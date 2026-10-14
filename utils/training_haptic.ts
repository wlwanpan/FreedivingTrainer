import * as Haptics from 'expo-haptics'


export type TrainingHapticKind = 'step' | 'done' | 'tap'

export function playTrainingHaptic(enabled: boolean, kind: TrainingHapticKind = 'step') {
  if (!enabled) return
  switch (kind) {
    case 'done':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      return
    case 'tap':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      return
    default:
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }
}
