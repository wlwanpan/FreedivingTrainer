import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var session: WatchSession

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 6) {
                Circle()
                    .fill(session.reachable ? Color.green : Color.gray)
                    .frame(width: 8, height: 8)
                Text(session.reachable ? "Phone connected" : "Phone not connected")
                    .font(.caption2)
            }
            if session.running {
                Text(session.phaseTitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(session.clockText)
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .minimumScaleFactor(0.6)
                if !session.roundText.isEmpty {
                    Text(session.roundText)
                        .font(.caption2)
                }
                if session.bpm > 0 {
                    Text("\(session.bpm) bpm")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            } else if session.finished {
                Text("Saved")
                    .font(.headline)
                Text("Sent to your iPhone")
                    .font(.caption2)
                    .multilineTextAlignment(.center)
            } else if session.locked {
                Text("Unlock lifetime access on your iPhone")
                    .font(.caption)
                    .multilineTextAlignment(.center)
            } else if let plan = session.plan {
                Button(action: session.startPlan) {
                    VStack(spacing: 6) {
                        Text(plan.name)
                            .font(.headline)
                            .multilineTextAlignment(.center)
                        Text(session.readyDetail)
                            .font(.caption2)
                            .multilineTextAlignment(.center)
                        Text("Start")
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            } else {
                Text("Choose a plan on your iPhone")
                    .font(.caption)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
    }
}
