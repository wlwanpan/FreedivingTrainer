let resumeHandler: (() => void) | null = null

export function registerTrainingResume(handler: (() => void) | null) {
  resumeHandler = handler
}

export function resumeTrainingSession() {
  resumeHandler?.()
}
