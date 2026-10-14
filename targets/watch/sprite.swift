import SwiftUI
import UIKit

// Frames match utils/training_sprite.ts.
enum TrainingSprite {
    case breathe
    case hold
    case rest
    case meditate

    private static let sheet: CGFloat = 1254
    private static var cropped: [TrainingSprite: UIImage] = [:]

    fileprivate var image: UIImage? {
        if let cached = TrainingSprite.cropped[self] { return cached }
        guard let sheet = UIImage(named: "TrainingSprite")?.cgImage else { return nil }
        let tile = tile
        let unit = CGFloat(sheet.width) / TrainingSprite.sheet
        // Stay inside the icon's rounded corners so the art covers the screen.
        let crop = tile.size * 0.84
        let originX = tile.x + (tile.size - crop) / 2
        let originY = tile.y + (tile.size - crop) / 2
        let rect = CGRect(
            x: originX * unit,
            y: originY * unit,
            width: crop * unit,
            height: crop * unit
        ).integral
        guard let part = sheet.cropping(to: rect) else { return nil }
        let image = UIImage(cgImage: part)
        TrainingSprite.cropped[self] = image
        return image
    }

    private var tile: (x: CGFloat, y: CGFloat, size: CGFloat) {
        switch self {
        case .rest: return (99, 99, 500)
        case .breathe: return (653, 98, 501)
        case .hold: return (101, 644, 501)
        case .meditate: return (653, 644, 501)
        }
    }
}

struct TrainingSpriteBackground: View {
    let sprite: TrainingSprite

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Pelagic.canvas
                if let image = sprite.image {
                    Image(uiImage: image)
                        .resizable()
                        .frame(width: geo.size.width, height: geo.size.height)
                        .opacity(0.18)
                }
            }
        }
        .ignoresSafeArea()
    }
}
