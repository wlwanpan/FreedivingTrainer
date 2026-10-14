import SwiftUI

@main
struct watchEntry: App {
    @StateObject private var session = WatchSession.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(session)
                .preferredColorScheme(.light)
                .tint(Pelagic.seafoam)
        }
    }
}
