import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var session: WatchSession
    @State private var confirmExit = false
    @State private var showSchedule = false

    private var lostNoticePresented: Binding<Bool> {
        Binding(
            get: { session.lostNotice != nil },
            set: { if !$0 { session.lostNotice = nil } }
        )
    }

    var body: some View {
        ZStack {
            Pelagic.canvas
                .ignoresSafeArea()
            if let sprite = session.backdrop {
                TrainingSpriteBackground(sprite: sprite)
                    .ignoresSafeArea()
            }
            if session.running || session.finished {
                sessionBody
            } else if showSchedule, let plan = session.plan, !plan.schedule.isEmpty {
                PlanScheduleList(plan: plan) { showSchedule = false }
            } else {
                pagedHome
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .foregroundStyle(Pelagic.text)
        .alert("Exit training?", isPresented: $confirmExit) {
            Button("Exit", role: .destructive) { session.exitPlan() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Session progress will be lost.")
        }
        .alert("Training ended", isPresented: lostNoticePresented) {
            Button("OK", role: .cancel) { session.lostNotice = nil }
        } message: {
            Text(session.lostNotice ?? "This training is lost.")
        }
    }

    @ViewBuilder
    private var pagedHome: some View {
        if #available(watchOS 10.0, *) {
            TabView {
                homePage
                tableStartPage(session.co2Table, title: "CO2")
                tableStartPage(session.o2Table, title: "O2")
            }
            .tabViewStyle(.verticalPage)
        } else {
            TabView {
                homePage
                tableStartPage(session.co2Table, title: "CO2")
                tableStartPage(session.o2Table, title: "O2")
            }
        }
    }

    private var homePage: some View {
        VStack(spacing: 8) {
            if session.pendingSync {
                Text("Waiting for your iPhone")
                    .font(.caption2)
                    .foregroundStyle(Pelagic.muted)
                    .multilineTextAlignment(.center)
            }
            if session.phoneTraining && session.reachable {
                phoneTrainingNotice
            }
            if session.planComplete {
                Text("Week complete")
                    .font(.headline)
                    .foregroundStyle(Pelagic.text)
                    .multilineTextAlignment(.center)
                Text("Saved on your iPhone")
                    .font(.caption2)
                    .foregroundStyle(Pelagic.muted)
                    .multilineTextAlignment(.center)
            } else if session.locked {
                Text("Unlock lifetime access on your iPhone")
                    .font(.caption)
                    .foregroundStyle(Pelagic.muted)
                    .multilineTextAlignment(.center)
            } else if let plan = session.plan {
                VStack(spacing: 12) {
                    if plan.schedule.isEmpty {
                        planCard(plan)
                    } else {
                        Button { showSchedule = true } label: {
                            planCard(plan)
                        }
                        .buttonStyle(.plain)
                    }
                    phoneOrStart {
                        showSchedule = false
                        session.startPlan()
                    }
                }
            } else {
                Text("Choose a plan on your iPhone")
                    .font(.caption)
                    .foregroundStyle(Pelagic.muted)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
    }

    private var sessionBody: some View {
        VStack(spacing: 8) {
            if session.running {
                Text(session.paused ? "Paused" : session.phaseTitle)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(phaseColor)
                Text(session.clockText)
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .minimumScaleFactor(0.6)
                    .monospacedDigit()
                    .foregroundStyle(phaseColor)
                if !session.sessionDetail.isEmpty {
                    Text(session.sessionDetail)
                        .font(.caption2)
                        .foregroundStyle(Pelagic.muted)
                }
                if session.paused {
                    Button("Resume", action: session.togglePause)
                        .buttonStyle(.borderedProminent)
                        .tint(Pelagic.seafoam)
                    Button("Exit", role: .destructive) { confirmExit = true }
                        .buttonStyle(.bordered)
                        .tint(Pelagic.alert)
                } else {
                    Button("Pause", action: session.togglePause)
                        .buttonStyle(.bordered)
                        .tint(Pelagic.seafoam)
                }
            } else {
                Text("Saved")
                    .font(.headline)
                    .foregroundStyle(Pelagic.seafoam)
                Text(session.pendingSync ? "Waiting for your iPhone" : "Sent to your iPhone")
                    .font(.caption2)
                    .foregroundStyle(Pelagic.muted)
                    .multilineTextAlignment(.center)
                Button("Okay", action: session.dismissSaved)
                    .buttonStyle(.borderedProminent)
                    .tint(Pelagic.seafoam)
            }
        }
        .padding()
    }

    private func tableStartPage(_ table: WatchTable?, title: String) -> some View {
        VStack(spacing: 12) {
            if let table {
                tableCard(table)
                if session.phoneTraining && session.reachable {
                    phoneTrainingNotice
                } else if session.locked {
                    Text("Unlock lifetime access on your iPhone")
                        .font(.caption)
                        .foregroundStyle(Pelagic.muted)
                        .multilineTextAlignment(.center)
                } else {
                    Button("Start") {
                        session.startTable(table)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Pelagic.seafoam)
                }
            } else {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(Pelagic.text)
                Text("Open the iPhone app to sync this table")
                    .font(.caption)
                    .foregroundStyle(Pelagic.muted)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
    }

    private func planCard(_ plan: WatchPlan) -> some View {
        startCard(
            title: plan.name,
            detail: session.readyDetail,
            meta: "Week \(plan.planWeek) of \(plan.planWeeks)",
            showChevron: !plan.schedule.isEmpty,
            progress: plan.schedule.isEmpty ? nil : Double(plan.progress)
        )
    }

    private func tableCard(_ table: WatchTable) -> some View {
        startCard(
            title: table.name,
            detail: tableDetail(table),
            meta: nil,
            showChevron: false,
            progress: nil
        )
    }

    private func startCard(
        title: String,
        detail: String,
        meta: String?,
        showChevron: Bool,
        progress: Double?
    ) -> some View {
        VStack(spacing: 6) {
            Text(title)
                .font(.headline)
                .foregroundStyle(Pelagic.text)
                .multilineTextAlignment(.center)
            if let meta {
                HStack(spacing: 4) {
                    Text(meta)
                    if showChevron {
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                    }
                }
                .font(.caption2)
                .foregroundStyle(Pelagic.muted)
            }
            if let progress {
                ProgressView(value: progress, total: 100)
                    .progressViewStyle(.linear)
                    .tint(Pelagic.lagoon)
            }
            Text(detail)
                .font(.caption2)
                .foregroundStyle(Pelagic.muted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .pelagicCard(emphasized: true)
    }

    @ViewBuilder
    private func phoneOrStart(start: @escaping () -> Void) -> some View {
        if !session.phoneTraining || !session.reachable {
            Button("Start", action: start)
                .buttonStyle(.borderedProminent)
                .tint(Pelagic.seafoam)
        }
    }

    private var phoneTrainingNotice: some View {
        VStack(spacing: 2) {
            Text("Training on your iPhone")
                .font(.caption)
                .foregroundStyle(Pelagic.text)
                .multilineTextAlignment(.center)
            if !session.phoneTrainingName.isEmpty {
                Text(session.phoneTrainingName)
                    .font(.caption2)
                    .foregroundStyle(Pelagic.muted)
                    .multilineTextAlignment(.center)
            }
        }
    }

    private func tableDetail(_ table: WatchTable) -> String {
        let hold = clock(table.holdSeconds)
        let prefix = table.tableType == "o2" ? "Holds from \(hold)" : "Hold \(hold)"
        let count = table.rounds.count
        let rounds = count == 1 ? "round" : "rounds"
        return "\(prefix) · \(count) \(rounds)"
    }

    private var phaseColor: Color {
        if session.paused { return Pelagic.muted }
        switch session.phaseTitle {
        case "Hold": return Pelagic.lagoon
        case "Rest": return Pelagic.aquamarine
        default: return Pelagic.seafoam
        }
    }
}

private struct PlanScheduleList: View {
    let plan: WatchPlan
    let onBack: () -> Void

    private var focusWeek: Int {
        if let next = plan.schedule.first(where: { week in
            !week.locked && week.sessions.contains(where: { !$0.completed })
        }) {
            return next.week
        }
        if plan.week > 0 { return plan.week }
        return plan.schedule.first(where: \.current)?.week ?? plan.schedule.first?.week ?? 1
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: onBack) {
                HStack(spacing: 4) {
                    Image(systemName: "chevron.left")
                    Text("Plan")
                }
                .font(.caption2)
                .foregroundStyle(Pelagic.seafoam)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            if !plan.planName.isEmpty {
                Text(plan.planName)
                    .font(.headline)
                    .foregroundStyle(Pelagic.text)
            }
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(plan.schedule) { week in
                            weekCard(week, focused: week.week == focusWeek)
                                .id(week.week)
                        }
                    }
                }
                .task(id: focusWeek) {
                    try? await Task.sleep(for: .milliseconds(50))
                    proxy.scrollTo(focusWeek, anchor: .top)
                }
            }
        }
        .padding(.horizontal, 4)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private func weekCard(_ week: WatchListedWeek, focused: Bool) -> some View {
        let complete = !week.sessions.isEmpty && week.sessions.allSatisfy(\.completed)
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Week \(week.week)")
                    .font(.caption)
                    .fontWeight(.bold)
                Spacer(minLength: 4)
                if complete {
                    Text("Complete")
                        .foregroundStyle(Pelagic.seafoam)
                } else if focused {
                    Text("This week")
                        .foregroundStyle(Pelagic.seafoam)
                }
                if week.locked {
                    Text("Locked")
                        .foregroundStyle(Pelagic.muted)
                }
            }
            .font(.caption2)
            .foregroundStyle(Pelagic.text)
            if week.locked {
                Text("Finish week \(plan.planWeek) to start these.")
                    .font(.caption2)
                    .foregroundStyle(Pelagic.muted)
            }
            ForEach(week.sessions) { session in
                VStack(alignment: .leading, spacing: 2) {
                    if session.index != week.sessions.first?.index {
                        Divider()
                            .overlay(Pelagic.hairline)
                    }
                    HStack(alignment: .firstTextBaseline) {
                        Text(session.name)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundStyle(Pelagic.text)
                        Spacer(minLength: 4)
                        if session.completed {
                            Text("Done")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundStyle(Pelagic.seafoam)
                        }
                    }
                    Text(sessionDetail(session))
                        .font(.caption2)
                        .foregroundStyle(week.locked ? Pelagic.muted : Pelagic.seafoam)
                    if !session.note.isEmpty {
                        Text(session.note)
                            .font(.caption2)
                            .foregroundStyle(Pelagic.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .opacity(week.locked ? 0.55 : 1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .pelagicCard(emphasized: focused)
    }

    private func sessionDetail(_ session: WatchListedSession) -> String {
        let hold = clock(session.holdSeconds)
        let prefix = session.tableType == "o2" ? "Holds from \(hold)" : "Hold \(hold)"
        return "\(prefix) · \(session.rounds) rounds"
    }
}
