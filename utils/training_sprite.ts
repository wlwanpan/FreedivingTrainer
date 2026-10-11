import { ImageSourcePropType, ImageStyle } from 'react-native'


export type TrainingSpriteName = 'breathe' | 'hold' | 'meditate' | 'rest'

const trainingSprite: ImageSourcePropType = require('../assets/images/training_sprite.png')

const SpriteSize = 1254
const CropSize = 560

/** Center of each icon on the sheet, in pixels. */
const Focus: Record<TrainingSpriteName, { x: number; y: number }> = {
  rest: { x: 350, y: 348 },
  breathe: { x: 903, y: 348 },
  hold: { x: 350, y: 893 },
  meditate: { x: 903, y: 894 },
}

export function trainingSpriteFrame(name: TrainingSpriteName): {
  source: ImageSourcePropType
  style: ImageStyle
} {
  const { x, y } = Focus[name]
  const originX = x - CropSize / 2
  const originY = y - CropSize / 2
  const scale = SpriteSize / CropSize
  return {
    source: trainingSprite,
    style: {
      position: 'absolute',
      width: `${scale * 100}%`,
      height: `${scale * 100}%`,
      left: `${(-originX / CropSize) * 100}%`,
      top: `${(-originY / CropSize) * 100}%`,
    },
  }
}
