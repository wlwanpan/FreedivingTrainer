import { Audio } from 'expo-av'


let cue: Audio.Sound | null = null
let modeReady = false

async function ensureCue() {
  if (!modeReady) {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      shouldDuckAndroid: true,
    })
    modeReady = true
  }
  if (cue) return cue
  const loaded = await Audio.Sound.createAsync(
    require('@/assets/training/step-cue.wav'),
  )
  cue = loaded.sound
  return cue
}

export function playTrainingSound(enabled: boolean) {
  if (!enabled) return
  void (async () => {
    try {
      const sound = await ensureCue()
      await sound.setPositionAsync(0)
      await sound.playAsync()
    } catch {
      // Ignore missing audio in tests or unsupported environments.
    }
  })()
}
