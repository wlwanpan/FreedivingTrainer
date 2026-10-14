import Foundation
import HealthKit
import WatchConnectivity

struct WatchListedSession: Identifiable {
    let index: Int
    let name: String
    let tableType: String
    let holdSeconds: Int
    let restSeconds: Int
    let rounds: Int
    let completed: Bool
    let note: String

    var id: Int { index }
}

struct WatchListedWeek: Identifiable {
    let week: Int
    let current: Bool
    let locked: Bool
    let sessions: [WatchListedSession]

    var id: Int { week }
}

struct WatchPlan {
    let name: String
    let tableType: String
    let breatheUpSeconds: Int
    let holdSeconds: Int
    let restSeconds: Int
    let rounds: [(hold: Int, rest: Int)]
    let week: Int
    let sessionIndex: Int
    let planKey: String
    let planWeek: Int
    let planWeeks: Int
    let progress: Int
    let planName: String
    let schedule: [WatchListedWeek]
}

struct WatchTable {
    let name: String
    let tableType: String
    let breatheUpSeconds: Int
    let holdSeconds: Int
    let restSeconds: Int
    let rounds: [(hold: Int, rest: Int)]
}

private struct WatchPhase {
    let title: String
    let seconds: Int
    let round: Int?
}

@MainActor
final class WatchSession: NSObject, ObservableObject {
    static let shared = WatchSession()

    @Published var reachable = false
    @Published var locked = false
    @Published var planComplete = false
    @Published var running = false
    @Published var paused = false
    @Published var finished = false
    @Published var plan: WatchPlan?
    @Published var co2Table: WatchTable?
    @Published var o2Table: WatchTable?
    @Published var phaseTitle = ""
    @Published var roundText = ""
    @Published var remaining = 0
    @Published var bpm = 0
    @Published var lostNotice: String?
    @Published var pendingSync = false

    private var connectivity: WCSession?
    private let healthStore = HKHealthStore()
    private var workout: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var lastSentBpm = 0
    private var lastSentAt = Date.distantPast
    private var ticker: Timer?
    private var startedAt = Date()
    private var wallStartedAt = Date()
    private var pausedAt: Date?
    private var phases: [WatchPhase] = []
    private var activePlan: WatchPlan?
    private var samples: [[String: Any]] = []
    private var captureSamples = false
    private var finishing = false
    private var loggedCount = -1
    private var planKey = ""
    private var queuedPlan: [String: Any]?
    private var pendingPlan: [String: Any]?
    private var dismissSavedTask: Task<Void, Never>?
    private var sendingCompletions = Set<Int>()

    private static let pendingDefaultsKey = "pendingSessionCompletions"

    var readyDetail: String {
        guard let plan else { return "" }
        let hold = clock(plan.holdSeconds)
        let prefix = plan.tableType == "o2" ? "Holds from \(hold)" : "Hold \(hold)"
        let count = plan.rounds.count
        let rounds = count == 1 ? "round" : "rounds"
        return "\(prefix) · \(count) \(rounds)"
    }

    var clockText: String {
        clock(remaining)
    }

    var sessionDetail: String {
        var parts: [String] = []
        if !roundText.isEmpty { parts.append(roundText) }
        if bpm > 0 { parts.append("\(bpm) bpm") }
        return parts.joined(separator: " · ")
    }

    var backdrop: TrainingSprite? {
        if finished { return .meditate }
        guard running else { return nil }
        switch phaseTitle {
        case "Hold": return .hold
        case "Rest": return .rest
        default: return .breathe
        }
    }

    override init() {
        super.init()
        pendingSync = !Self.storedCompletions().isEmpty
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        connectivity = session
        session.activate()
    }

    func startPlan() {
        guard let plan else { return }
        start(plan)
    }

    func startTable(_ table: WatchTable) {
        start(WatchPlan(
            name: table.name,
            tableType: table.tableType,
            breatheUpSeconds: table.breatheUpSeconds,
            holdSeconds: table.holdSeconds,
            restSeconds: table.restSeconds,
            rounds: table.rounds,
            week: 0,
            sessionIndex: 0,
            planKey: "",
            planWeek: 1,
            planWeeks: 1,
            progress: 0,
            planName: "",
            schedule: []
        ))
    }

    private func start(_ plan: WatchPlan) {
        guard !running, !locked else { return }
        let built = makePhases(plan)
        guard !built.isEmpty else { return }
        activePlan = plan
        phases = built
        wallStartedAt = Date()
        startedAt = wallStartedAt
        samples = []
        captureSamples = true
        finishing = false
        finished = false
        paused = false
        pausedAt = nil
        running = true
        lostNotice = nil
        startHeartRate()
        startClock()
        advance()
        publishTraining(true)
    }

    func togglePause() {
        guard running, !finishing else { return }
        if paused {
            if let pausedAt {
                startedAt = startedAt.addingTimeInterval(Date().timeIntervalSince(pausedAt))
            }
            self.pausedAt = nil
            paused = false
            startClock()
            advance()
            return
        }
        pausedAt = Date()
        paused = true
        ticker?.invalidate()
        ticker = nil
    }

    func exitPlan() {
        guard running, paused, !finishing else { return }
        let queued = queuedPlan
        stopTraining()
        if let queued {
            installPlan(queued)
        }
    }

    private func stopTraining() {
        ticker?.invalidate()
        ticker = nil
        paused = false
        pausedAt = nil
        running = false
        finished = false
        finishing = false
        phaseTitle = ""
        roundText = ""
        remaining = 0
        samples = []
        captureSamples = false
        activePlan = nil
        phases = []
        queuedPlan = nil
        pendingPlan = nil
        dismissSavedTask?.cancel()
        dismissSavedTask = nil
        stopHeartRate(save: false)
        publishTraining(false)
    }

    func dismissSaved() {
        dismissSavedTask?.cancel()
        dismissSavedTask = nil
        guard finished else { return }
        finished = false
        let message = pendingPlan
        pendingPlan = nil
        if let message {
            installPlan(message)
        }
    }

    private func scheduleSavedDismissal() {
        guard dismissSavedTask == nil else { return }
        dismissSavedTask = Task { @MainActor [weak self] in
            try? await Task.sleep(for: .seconds(2))
            guard let self, !Task.isCancelled else { return }
            self.dismissSaved()
        }
    }

    func handle(_ message: [String: Any]) {
        acknowledge(message["syncedAt"])
        if textValue(message["type"]) == "nextSession" {
            applyPlan(message)
            return
        }
        guard let action = textValue(message["action"]) else { return }
        if action == "startSession" {
            startHeartRate()
        } else if action == "stopSession", !running {
            stopHeartRate()
        }
    }

    private func applyPlan(_ message: [String: Any]) {
        installTables(message)
        let key = textValue(message["planKey"]) ?? ""
        let changed = key != planKey
        let count = intValue(message["loggedCount"]) ?? loggedCount
        let logged = count != loggedCount
        if logged { loggedCount = count }
        if running {
            if changed {
                let tableSession = (activePlan?.week ?? 0) == 0
                let erased = textValue(message["sync"]) == "erase"
                if erased || !tableSession {
                    planKey = key
                    queuedPlan = nil
                    stopTraining()
                    installPlan(message)
                    lostNotice = erased
                        ? "All data was erased on your iPhone. This training is lost."
                        : "Your plan changed on your iPhone. This training is lost."
                } else {
                    planKey = key
                }
            }
            return
        }
        if finished {
            pendingPlan = message
            if logged {
                scheduleSavedDismissal()
            }
            return
        }
        if changed {
            planKey = key
            finished = false
        }
        if logged { finished = false }
        installPlan(message)
    }

    private func installPlan(_ message: [String: Any]) {
        if flag(message["locked"]) {
            locked = true
            planComplete = false
            plan = nil
            return
        }
        if flag(message["complete"]) {
            locked = false
            planComplete = true
            finished = false
            plan = nil
            return
        }
        locked = false
        planComplete = false
        guard let name = textValue(message["name"]), !name.isEmpty,
              let tableType = textValue(message["tableType"]),
              let hold = intValue(message["holdSeconds"]),
              let rest = intValue(message["restSeconds"]) else {
            plan = nil
            return
        }
        let rounds = roundsValue(message["rounds"])
        guard !rounds.isEmpty else {
            plan = nil
            return
        }
        plan = WatchPlan(
            name: name,
            tableType: tableType,
            breatheUpSeconds: intValue(message["breatheUpSeconds"]) ?? 0,
            holdSeconds: hold,
            restSeconds: rest,
            rounds: rounds,
            week: intValue(message["week"]) ?? 0,
            sessionIndex: intValue(message["sessionIndex"]) ?? 0,
            planKey: textValue(message["planKey"]) ?? "",
            planWeek: intValue(message["planWeek"]) ?? intValue(message["week"]) ?? 1,
            planWeeks: max(1, intValue(message["planWeeks"]) ?? 1),
            progress: min(100, max(0, intValue(message["progress"]) ?? 0)),
            planName: textValue(message["planName"]) ?? "",
            schedule: listedWeeks(message["schedule"])
        )
    }

    private func installTables(_ message: [String: Any]) {
        guard let tables = recordValue(message["tables"]) else { return }
        let breatheUp = intValue(tables["breatheUpSeconds"]) ?? 0
        co2Table = readTable(tables["co2"], breatheUp: breatheUp)
        o2Table = readTable(tables["o2"], breatheUp: breatheUp)
    }

    private func makePhases(_ plan: WatchPlan) -> [WatchPhase] {
        var built: [WatchPhase] = []
        if plan.breatheUpSeconds > 0 {
            built.append(WatchPhase(title: "Breathe", seconds: plan.breatheUpSeconds, round: nil))
        }
        for (offset, round) in plan.rounds.enumerated() {
            let number = offset + 1
            if round.hold > 0 {
                built.append(WatchPhase(title: "Hold", seconds: round.hold, round: number))
            }
            if round.rest > 0 {
                built.append(WatchPhase(title: "Rest", seconds: round.rest, round: number))
            }
        }
        return built
    }

    private func startClock() {
        ticker?.invalidate()
        let timer = Timer(timeInterval: 0.2, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.advance()
            }
        }
        RunLoop.main.add(timer, forMode: .common)
        ticker = timer
    }

    private func advance() {
        guard running, !paused, !finishing else { return }
        let elapsed = Int(Date().timeIntervalSince(startedAt))
        var cursor = elapsed
        for phase in phases {
            if cursor < phase.seconds {
                remaining = phase.seconds - cursor
                phaseTitle = phase.title
                if let round = phase.round {
                    let total = activePlan?.rounds.count ?? round
                    roundText = "Round \(round) of \(total)"
                } else {
                    roundText = "Breathe-up"
                }
                return
            }
            cursor -= phase.seconds
        }
        finishPlan()
    }

    private func finishPlan() {
        guard running, !finishing else { return }
        finishing = true
        ticker?.invalidate()
        ticker = nil
        paused = false
        pausedAt = nil
        running = false
        finished = true
        phaseTitle = ""
        roundText = ""
        remaining = 0
        sendCompletion()
        captureSamples = false
        stopHeartRate()
        publishTraining(false)
        if let queued = queuedPlan {
            queuedPlan = nil
            finished = false
            installPlan(queued)
        }
    }

    private func publishTraining(_ active: Bool) {
        send(["type": "watchTraining", "running": active])
    }

    private func sendCompletion() {
        guard let plan = activePlan else { return }
        var payload: [String: Any] = [
            "type": "sessionComplete",
            "tableType": plan.tableType,
            "holdSeconds": plan.holdSeconds,
            "restSeconds": plan.restSeconds,
            "roundsCompleted": plan.rounds.count,
            "roundsPlanned": plan.rounds.count,
            "startedAt": Int(wallStartedAt.timeIntervalSince1970 * 1000),
            "completedAt": Int(Date().timeIntervalSince1970 * 1000),
            "source": "watch",
            "watchDetail": "ios",
            "heartRates": samples,
        ]
        if plan.week > 0 && plan.sessionIndex > 0 {
            payload["week"] = plan.week
            payload["sessionIndex"] = plan.sessionIndex
            payload["planKey"] = plan.planKey
        }
        storePending(payload)
        deliver(payload)
    }

    private func startHeartRate() {
        guard workout == nil else { return }
        let share: Set<HKSampleType> = [HKQuantityType.workoutType()]
        let read: Set<HKObjectType> = [HKQuantityType(.heartRate)]
        healthStore.requestAuthorization(toShare: share, read: read) { [weak self] _, _ in
            Task { @MainActor in
                self?.beginWorkout()
            }
        }
    }

    private func beginWorkout() {
        guard workout == nil else { return }
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .mindAndBody
        configuration.locationType = .indoor
        do {
            let session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            let liveBuilder = session.associatedWorkoutBuilder()
            liveBuilder.dataSource = HKLiveWorkoutDataSource(
                healthStore: healthStore,
                workoutConfiguration: configuration
            )
            session.delegate = self
            liveBuilder.delegate = self
            workout = session
            builder = liveBuilder
            let start = Date()
            session.startActivity(with: start)
            liveBuilder.beginCollection(withStart: start) { _, _ in }
        } catch {
            bpm = 0
        }
    }

    private func stopHeartRate(save: Bool = true) {
        guard let session = workout, let liveBuilder = builder else {
            bpm = 0
            return
        }
        workout = nil
        builder = nil
        bpm = 0
        session.end()
        if save {
            liveBuilder.endCollection(withEnd: Date()) { _, _ in
                liveBuilder.finishWorkout { _, _ in }
            }
            return
        }
        liveBuilder.discardWorkout()
    }

    private func sendHeartRate(_ value: Int) {
        let now = Date()
        if value == lastSentBpm && now.timeIntervalSince(lastSentAt) < 5 { return }
        lastSentBpm = value
        lastSentAt = now
        let at = now.timeIntervalSince1970 * 1000
        if captureSamples {
            samples.append(["bpm": value, "at": at])
        }
        send([
            "type": "heartRate",
            "bpm": value,
            "at": at,
        ])
    }

    private func send(_ payload: [String: Any]) {
        guard let connectivity, connectivity.isReachable else { return }
        connectivity.sendMessage(payload, replyHandler: nil, errorHandler: nil)
    }

    private static func storedCompletions() -> [[String: Any]] {
        let stored = UserDefaults.standard.array(forKey: pendingDefaultsKey) ?? []
        return stored.compactMap { $0 as? [String: Any] }
    }

    private func loadPending() -> [[String: Any]] {
        Self.storedCompletions()
    }

    private func savePending(_ items: [[String: Any]]) {
        UserDefaults.standard.set(items, forKey: Self.pendingDefaultsKey)
        pendingSync = !items.isEmpty
    }

    private func completionId(_ payload: [String: Any]) -> Int? {
        guard let value = intValue(payload["completedAt"]), value > 0 else { return nil }
        return value
    }

    private func wirePayload(_ payload: [String: Any]) -> [String: Any] {
        var copy = payload
        copy.removeValue(forKey: "transferQueued")
        return copy
    }

    private func storePending(_ payload: [String: Any]) {
        guard let id = completionId(payload) else { return }
        var items = loadPending().filter { completionId($0) != id }
        items.append(payload)
        savePending(items)
    }

    private func removePending(_ id: Int) {
        sendingCompletions.remove(id)
        savePending(loadPending().filter { completionId($0) != id })
    }

    private func acknowledge(_ value: Any?) {
        let rows: [Any]
        if let list = value as? [Any] {
            rows = list
        } else if let list = value as? NSArray {
            rows = list.compactMap { $0 }
        } else {
            return
        }
        let ids = Set(rows.compactMap { intValue($0) })
        guard !ids.isEmpty else { return }
        ids.forEach { sendingCompletions.remove($0) }
        let remaining = loadPending().filter { item in
            guard let id = completionId(item) else { return true }
            return !ids.contains(id)
        }
        if remaining.count != loadPending().count {
            savePending(remaining)
        }
    }

    private func queueTransfer(_ id: Int) {
        guard let connectivity, connectivity.activationState == .activated else { return }
        var items = loadPending()
        guard let index = items.firstIndex(where: { completionId($0) == id }) else { return }
        var item = items[index]
        if flag(item["transferQueued"]) { return }
        connectivity.transferUserInfo(wirePayload(item))
        item["transferQueued"] = true
        items[index] = item
        savePending(items)
    }

    private func deliver(_ item: [String: Any]) {
        guard let id = completionId(item) else { return }
        guard let connectivity, connectivity.activationState == .activated else { return }
        if connectivity.isReachable {
            guard !sendingCompletions.contains(id) else { return }
            sendingCompletions.insert(id)
            let payload = wirePayload(item)
            connectivity.sendMessage(payload, replyHandler: { [weak self] reply in
                Task { @MainActor in
                    guard let self else { return }
                    self.sendingCompletions.remove(id)
                    if flag(reply["saved"]) {
                        self.removePending(id)
                    }
                }
            }, errorHandler: { [weak self] _ in
                Task { @MainActor in
                    guard let self else { return }
                    self.sendingCompletions.remove(id)
                    self.queueTransfer(id)
                }
            })
            Task { @MainActor [weak self] in
                try? await Task.sleep(for: .seconds(8))
                self?.sendingCompletions.remove(id)
            }
            return
        }
        queueTransfer(id)
    }

    private func flushPending() {
        for item in loadPending() {
            deliver(item)
        }
    }

    private func markTransfersRetryable() {
        var items = loadPending()
        var changed = false
        for index in items.indices where flag(items[index]["transferQueued"]) {
            var item = items[index]
            item["transferQueued"] = false
            items[index] = item
            changed = true
        }
        if changed { savePending(items) }
    }
}

func clock(_ seconds: Int) -> String {
    let safe = max(0, seconds)
    return String(format: "%d:%02d", safe / 60, safe % 60)
}

private func intValue(_ value: Any?) -> Int? {
    if let number = value as? Int { return number }
    if let number = value as? Double { return Int(number) }
    if let number = value as? NSNumber { return number.intValue }
    return nil
}

private func textValue(_ value: Any?) -> String? {
    value as? String
}

private func flag(_ value: Any?) -> Bool {
    if let value = value as? Bool { return value }
    if let number = value as? NSNumber { return number.boolValue }
    return false
}

private func arrayValue(_ value: Any?) -> [Any] {
    if let list = value as? [Any] { return list }
    if let list = value as? NSArray { return list.compactMap { $0 } }
    return []
}

private func recordValue(_ value: Any?) -> [String: Any]? {
    value as? [String: Any] ?? (value as? NSDictionary) as? [String: Any]
}

private func readTable(_ value: Any?, breatheUp: Int) -> WatchTable? {
    guard let record = recordValue(value),
          let name = textValue(record["name"]), !name.isEmpty,
          let tableType = textValue(record["tableType"]),
          let hold = intValue(record["holdSeconds"]),
          let rest = intValue(record["restSeconds"]) else { return nil }
    let rounds = roundsValue(record["rounds"])
    guard !rounds.isEmpty else { return nil }
    return WatchTable(
        name: name,
        tableType: tableType,
        breatheUpSeconds: breatheUp,
        holdSeconds: hold,
        restSeconds: rest,
        rounds: rounds
    )
}

private func listedWeeks(_ value: Any?) -> [WatchListedWeek] {
    arrayValue(value).compactMap { row in
        guard let record = recordValue(row),
              let week = intValue(record["week"]),
              week > 0 else { return nil }
        let sessions = arrayValue(record["sessions"]).compactMap { item -> WatchListedSession? in
            guard let session = recordValue(item),
                  let name = textValue(session["name"]), !name.isEmpty,
                  let index = intValue(session["index"]) else { return nil }
            return WatchListedSession(
                index: index,
                name: name,
                tableType: textValue(session["tableType"]) ?? "co2",
                holdSeconds: intValue(session["holdSeconds"]) ?? 0,
                restSeconds: intValue(session["restSeconds"]) ?? 0,
                rounds: intValue(session["rounds"]) ?? 0,
                completed: flag(session["completed"]),
                note: textValue(session["note"]) ?? ""
            )
        }
        return WatchListedWeek(
            week: week,
            current: flag(record["current"]),
            locked: flag(record["locked"]),
            sessions: sessions
        )
    }
}

private func roundsValue(_ value: Any?) -> [(hold: Int, rest: Int)] {
    let rows: [Any]
    if let list = value as? [Any] {
        rows = list
    } else if let list = value as? NSArray {
        rows = list.compactMap { $0 }
    } else {
        return []
    }
    return rows.compactMap { row in
        let record = row as? [String: Any] ?? (row as? NSDictionary) as? [String: Any]
        guard let record,
              let hold = intValue(record["hold"]),
              let rest = intValue(record["rest"]),
              hold > 0 else { return nil }
        return (hold, max(0, rest))
    }
}

extension WatchSession: WCSessionDelegate {
    nonisolated func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        Task { @MainActor in
            self.reachable = session.isReachable
            self.handle(session.receivedApplicationContext)
            self.flushPending()
        }
    }

    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        Task { @MainActor in
            self.reachable = session.isReachable
            self.flushPending()
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        Task { @MainActor in
            self.handle(message)
        }
    }

    nonisolated func session(
        _ session: WCSession,
        didReceiveMessage message: [String: Any],
        replyHandler: @escaping ([String: Any]) -> Void
    ) {
        Task { @MainActor in
            self.handle(message)
            replyHandler(["status": "ok"])
        }
    }

    nonisolated func session(
        _ session: WCSession,
        didReceiveApplicationContext applicationContext: [String: Any]
    ) {
        Task { @MainActor in
            self.handle(applicationContext)
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        Task { @MainActor in
            self.handle(userInfo)
        }
    }

    nonisolated func session(
        _ session: WCSession,
        didFinish userInfoTransfer: WCSessionUserInfoTransfer,
        error: Error?
    ) {
        guard error != nil else { return }
        Task { @MainActor in
            self.markTransfersRetryable()
        }
    }
}

extension WatchSession: HKWorkoutSessionDelegate {
    nonisolated func workoutSession(
        _ workoutSession: HKWorkoutSession,
        didChangeTo toState: HKWorkoutSessionState,
        from fromState: HKWorkoutSessionState,
        date: Date
    ) {}

    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        Task { @MainActor in
            self.bpm = 0
        }
    }
}

extension WatchSession: HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutBuilder(
        _ workoutBuilder: HKLiveWorkoutBuilder,
        didCollectDataOf collectedTypes: Set<HKSampleType>
    ) {
        let heartRate = HKQuantityType(.heartRate)
        guard collectedTypes.contains(heartRate),
              let quantity = workoutBuilder.statistics(for: heartRate)?.mostRecentQuantity() else { return }
        let bpm = Int(quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())).rounded())
        guard bpm > 0 else { return }
        Task { @MainActor in
            self.bpm = bpm
            self.sendHeartRate(bpm)
        }
    }

    nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}
}
