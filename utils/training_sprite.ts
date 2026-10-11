import { ImageSourcePropType, ImageStyle } from 'react-native'


export type TrainingSpriteName = 'breathe' | 'hold' | 'meditate' | 'rest'

const trainingSprite: ImageSourcePropType = require('../assets/images/training_sprite.png')

const SpriteSize = 1254

/** Share of the icon width taken by its rounded corner. */
export const TrainingSpriteCorner = 0.25

/** Tight square around each icon, in sheet pixels. */
const Frame: Record<TrainingSpriteName, { x: number; y: number; size: number }> = {
  rest: { x: 99, y: 99, size: 500 },
  breathe: { x: 653, y: 98, size: 501 },
  hold: { x: 101, y: 644, size: 501 },
  meditate: { x: 653, y: 644, size: 501 },
}

export function trainingSpriteFrame(name: TrainingSpriteName): {
  source: ImageSourcePropType
  style: ImageStyle
} {
  const { x, y, size } = Frame[name]
  const crop = size * 0.9
  const originX = x + (size - crop) / 2
  const originY = y + (size - crop) / 2
  const scale = SpriteSize / crop
  return {
    source: trainingSprite,
    style: {
      position: 'absolute',
      width: `${scale * 100}%`,
      height: `${scale * 100}%`,
      left: `${(-originX / crop) * 100}%`,
      top: `${(-originY / crop) * 100}%`,
    },
  }
}
