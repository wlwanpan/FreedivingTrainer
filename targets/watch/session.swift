import Foundation
import HealthKit
import WatchConnectivity

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
    @Published var phaseTitle = ""
    @Published var roundText = ""
    @Published var remaining = 0
    @Published var bpm = 0
    @Published var lostNotice: String?

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
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        connectivity = session
        session.activate()
    }

    func startPlan() {
        guard let plan, !running else { return }
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
        stopHeartRate(save: false)
        publishTraining(false)
    }

    func handle(_ message: [String: Any]) {
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
        let key = textValue(message["planKey"]) ?? ""
        let changed = key != planKey
        let count = intValue(message["loggedCount"]) ?? loggedCount
        let logged = count != loggedCount
        if logged { loggedCount = count }
        if running {
            if changed {
                planKey = key
                queuedPlan = nil
                stopTraining()
                installPlan(message)
                lostNotice = textValue(message["sync"]) == "erase"
                    ? "All data was erased on your iPhone. This training is lost."
                    : "Your plan changed on your iPhone. This training is lost."
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
            planKey: textValue(message["planKey"]) ?? ""
        )
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
            "startedAt": wallStartedAt.timeIntervalSince1970 * 1000,
            "completedAt": Date().timeIntervalSince1970 * 1000,
            "heartRates": samples,
        ]
        if plan.week > 0 && plan.sessionIndex > 0 {
            payload["week"] = plan.week
            payload["sessionIndex"] = plan.sessionIndex
            payload["planKey"] = plan.planKey
        }
        send(payload)
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
        guard let connectivity else { return }
        if connectivity.isReachable {
            connectivity.sendMessage(payload, replyHandler: nil) { _ in
                connectivity.transferUserInfo(payload)
            }
        } else {
            connectivity.transferUserInfo(payload)
        }
    }
}

private func clock(_ seconds: Int) -> String {
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
        }
    }

    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        Task { @MainActor in
            self.reachable = session.isReachable
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
