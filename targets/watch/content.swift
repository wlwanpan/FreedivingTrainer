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
        .id(session.language)
        .alert(L10n.t("exitTitle"), isPresented: $confirmExit) {
            Button(L10n.t("exit"), role: .destructive) { session.exitPlan() }
            Button(L10n.t("cancel"), role: .cancel) {}
        } message: {
            Text(L10n.t("exitBody"))
        }
        .alert(L10n.t("endedTitle"), isPresented: lostNoticePresented) {
            Button(L10n.t("ok"), role: .cancel) { session.lostNotice = nil }
        } message: {
            Text(session.lostNotice ?? L10n.t("lostDefault"))
        }
    }

    @ViewBuilder
    private var pagedHome: some View {
        if #available(watchOS 10.0, *) {
            TabView {
                homePage
                tableStartPage(session.co2Table, title: L10n.t("co2"))
                tableStartPage(session.o2Table, title: L10n.t("o2"))
            }
            .tabViewStyle(.verticalPage)
        } else {
            TabView {
                homePage
                tableStartPage(session.co2Table, title: L10n.t("co2"))
                tableStartPage(session.o2Table, title: L10n.t("o2"))
            }
        }
    }

    private var homePage: some View {
        VStack(spacing: 8) {
            if session.pendingSync {
                Text(L10n.t("waitingPhone"))
                    .font(.caption2)
                    .foregroundStyle(Pelagic.muted)
                    .multilineTextAlignment(.center)
            }
            if session.phoneTraining && session.reachable {
                phoneTrainingNotice
            }
            if session.planComplete {
                Text(L10n.t("weekComplete"))
                    .font(.headline)
                    .foregroundStyle(Pelagic.text)
                    .multilineTextAlignment(.center)
                Text(L10n.t("savedOnPhone"))
                    .font(.caption2)
                    .foregroundStyle(Pelagic.muted)
                    .multilineTextAlignment(.center)
            } else if session.locked {
                Text(L10n.t("unlockLifetime"))
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
                Text(L10n.t("choosePlan"))
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
                Text(session.paused ? L10n.t("paused") : L10n.phase(session.phaseTitle))
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
                    Button(L10n.t("resume"), action: session.togglePause)
                        .buttonStyle(.borderedProminent)
                        .tint(Pelagic.seafoam)
                    Button(L10n.t("exit"), role: .destructive) { confirmExit = true }
                        .buttonStyle(.bordered)
                        .tint(Pelagic.alert)
                } else {
                    Button(L10n.t("pause"), action: session.togglePause)
                        .buttonStyle(.bordered)
                        .tint(Pelagic.seafoam)
                }
            } else {
                Text(L10n.t("saved"))
                    .font(.headline)
                    .foregroundStyle(Pelagic.seafoam)
                Text(session.pendingSync ? L10n.t("waitingPhone") : L10n.t("sentToPhone"))
                    .font(.caption2)
                    .foregroundStyle(Pelagic.muted)
                    .multilineTextAlignment(.center)
                Button(L10n.t("okay"), action: session.dismissSaved)
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
                    Text(L10n.t("unlockLifetime"))
                        .font(.caption)
                        .foregroundStyle(Pelagic.muted)
                        .multilineTextAlignment(.center)
                } else {
                    Button(L10n.t("start")) {
                        session.startTable(table)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Pelagic.seafoam)
                }
            } else {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(Pelagic.text)
                Text(L10n.t("syncTable"))
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
            meta: L10n.t("weekOf", ["week": "\(plan.planWeek)", "weeks": "\(plan.planWeeks)"]),
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
            Button(L10n.t("start"), action: start)
                .buttonStyle(.borderedProminent)
                .tint(Pelagic.seafoam)
        }
    }

    private var phoneTrainingNotice: some View {
        VStack(spacing: 2) {
            Text(L10n.t("trainingOnPhone"))
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
        L10n.holdDetail(
            tableType: table.tableType,
            time: clock(table.holdSeconds),
            count: table.rounds.count
        )
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
                    Text(L10n.t("plan"))
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
                Text(L10n.t("week", ["week": "\(week.week)"]))
                    .font(.caption)
                    .fontWeight(.bold)
                Spacer(minLength: 4)
                if complete {
                    Text(L10n.t("complete"))
                        .foregroundStyle(Pelagic.seafoam)
                } else if focused {
                    Text(L10n.t("thisWeek"))
                        .foregroundStyle(Pelagic.seafoam)
                }
                if week.locked {
                    Text(L10n.t("locked"))
                        .foregroundStyle(Pelagic.muted)
                }
            }
            .font(.caption2)
            .foregroundStyle(Pelagic.text)
            if week.locked {
                Text(L10n.t("lockNote", ["week": "\(plan.planWeek)"]))
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
                            Text(L10n.t("done"))
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
        L10n.holdDetail(
            tableType: session.tableType,
            time: clock(session.holdSeconds),
            count: session.rounds
        )
    }
}
