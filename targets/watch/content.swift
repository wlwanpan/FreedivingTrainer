import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var session: WatchSession
    @State private var confirmExit = false

    private var lostNoticePresented: Binding<Bool> {
        Binding(
            get: { session.lostNotice != nil },
            set: { if !$0 { session.lostNotice = nil } }
        )
    }

    var body: some View {
        ZStack {
            if let sprite = session.backdrop {
                TrainingSpriteBackground(sprite: sprite)
                    .ignoresSafeArea()
            }
            sessionBody
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
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

    private var sessionBody: some View {
        VStack(spacing: 8) {
            if session.running {
                Text(session.paused ? "Paused" : session.phaseTitle)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.92))
                    .shadow(color: .black.opacity(0.45), radius: 2, y: 1)
                Text(session.clockText)
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .minimumScaleFactor(0.6)
                    .foregroundStyle(.white)
                    .shadow(color: .black.opacity(0.45), radius: 3, y: 1)
                if !session.sessionDetail.isEmpty {
                    Text(session.sessionDetail)
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.92))
                        .shadow(color: .black.opacity(0.45), radius: 2, y: 1)
                }
                if session.paused {
                    Button("Resume", action: session.togglePause)
                        .buttonStyle(.borderedProminent)
                    Button("Exit", role: .destructive) { confirmExit = true }
                        .buttonStyle(.bordered)
                } else {
                    Button("Pause", action: session.togglePause)
                        .buttonStyle(.bordered)
                }
            } else if session.planComplete {
                Text("Week complete")
                    .font(.headline)
                    .multilineTextAlignment(.center)
                Text("Saved on your iPhone")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            } else if session.finished {
                Text("Saved")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .shadow(color: .black.opacity(0.45), radius: 2, y: 1)
                Text("Sent to your iPhone")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.92))
                    .multilineTextAlignment(.center)
                    .shadow(color: .black.opacity(0.45), radius: 2, y: 1)
                Button("Okay", action: session.dismissSaved)
                    .buttonStyle(.borderedProminent)
            } else if session.locked {
                Text("Unlock lifetime access on your iPhone")
                    .font(.caption)
                    .multilineTextAlignment(.center)
            } else if let plan = session.plan {
                VStack(spacing: 12) {
                    VStack(spacing: 6) {
                        Text(plan.name)
                            .font(.headline)
                            .multilineTextAlignment(.center)
                        Text("Week \(plan.planWeek) of \(plan.planWeeks)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        ProgressView(value: Double(plan.progress), total: 100)
                            .progressViewStyle(.linear)
                            .tint(.accentColor)
                        Text(session.readyDetail)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 10)
                    .background {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(Color.primary.opacity(0.08))
                    }
                    .overlay {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .strokeBorder(Color.accentColor.opacity(0.55), lineWidth: 1)
                    }
                    Button("Start", action: session.startPlan)
                        .buttonStyle(.borderedProminent)
                }
            } else {
                Text("Choose a plan on your iPhone")
                    .font(.caption)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
    }
}
