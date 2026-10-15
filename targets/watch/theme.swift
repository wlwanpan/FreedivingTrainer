import SwiftUI

enum Pelagic {
    static let canvas = Color(red: 244 / 255, green: 249 / 255, blue: 249 / 255)
    static let card = Color.white
    static let cardAlt = Color(red: 230 / 255, green: 246 / 255, blue: 244 / 255)
    static let seafoam = Color(red: 13 / 255, green: 148 / 255, blue: 136 / 255)
    static let lagoon = Color(red: 20 / 255, green: 184 / 255, blue: 166 / 255)
    static let aquamarine = Color(red: 6 / 255, green: 182 / 255, blue: 212 / 255)
    static let text = Color(red: 13 / 255, green: 43 / 255, blue: 56 / 255)
    static let muted = Color(red: 82 / 255, green: 121 / 255, blue: 138 / 255)
    static let hairline = Color(red: 225 / 255, green: 237 / 255, blue: 241 / 255)
    static let alert = Color(red: 244 / 255, green: 63 / 255, blue: 94 / 255)
    static let onSeafoam = Color.white
}

struct PelagicCard: ViewModifier {
    var emphasized = false

    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 8)
            .padding(.vertical, 10)
            .background {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Pelagic.card)
            }
            .overlay {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(
                        emphasized ? Pelagic.seafoam.opacity(0.45) : Pelagic.hairline,
                        lineWidth: 1
                    )
            }
    }
}

extension View {
    func pelagicCard(emphasized: Bool = false) -> some View {
        modifier(PelagicCard(emphasized: emphasized))
    }

    func pelagicPrimaryButton() -> some View {
        buttonStyle(.borderedProminent)
            .tint(Pelagic.seafoam)
            .foregroundStyle(Pelagic.onSeafoam)
    }
}
