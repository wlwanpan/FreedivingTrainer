import type {
  ActivationDidCompleteEvent,
  ActivationState,
  ApplicationContextReceivedEvent,
  MessageReceivedEvent,
  ReachabilityChangedEvent,
  SessionState,
  UserInfoReceivedEvent,
} from '@plevo/expo-watch-connectivity/src/ExpoWatchConnectivity.types'
import { requireNativeModule, type EventSubscription } from 'expo-modules-core'


type NativeWatchConnectivity = {
  isSupported: () => boolean
  getSessionState: () => SessionState
  activate: () => Promise<ActivationState>
  sendMessage: (message: Record<string, unknown>) => Promise<Record<string, unknown>>
  replyToMessage: (replyId: string, reply: Record<string, unknown>) => void
  updateApplicationContext: (context: Record<string, unknown>) => Promise<void>
  getReceivedApplicationContext: () => Record<string, unknown>
  addListener: (eventName: string, listener: (event: never) => void) => EventSubscription
}

const unsupportedState: SessionState = {
  isSupported: false,
  isPaired: false,
  isWatchAppInstalled: false,
  isReachable: false,
  activationState: 'notActivated',
  hasContentPending: false,
  isComplicationEnabled: false,
  remainingComplicationUserInfoTransfers: 0,
  watchDirectoryURL: null,
}

function nativeModule(): NativeWatchConnectivity | null {
  try {
    return requireNativeModule<NativeWatchConnectivity>('ExpoWatchConnectivity')
  } catch {
    return null
  }
}

const native = nativeModule()

export const WatchConnectivity = {
  get isSupported(): boolean {
    return native?.isSupported() ?? false
  },
  get sessionState(): SessionState {
    return native?.getSessionState() ?? unsupportedState
  },
  activate(): Promise<ActivationState> {
    if (native == null) return Promise.resolve('notActivated')
    return native.activate()
  },
  sendMessage(message: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (native == null) return Promise.reject(new Error('WatchConnectivity is not supported'))
    return native.sendMessage(message)
  },
  replyToMessage(replyId: string, reply: Record<string, unknown>): void {
    native?.replyToMessage(replyId, reply)
  },
  updateApplicationContext(context: Record<string, unknown>): Promise<void> {
    if (native == null) return Promise.resolve()
    return native.updateApplicationContext(context)
  },
  get receivedApplicationContext(): Record<string, unknown> {
    return native?.getReceivedApplicationContext() ?? {}
  },
  addActivationListener(callback: (event: ActivationDidCompleteEvent) => void): EventSubscription {
    return listen('onActivationDidComplete', callback)
  },
  addMessageListener(callback: (event: MessageReceivedEvent) => void): EventSubscription {
    return listen('onMessageReceived', callback)
  },
  addUserInfoListener(callback: (event: UserInfoReceivedEvent) => void): EventSubscription {
    return listen('onUserInfoReceived', callback)
  },
  addReachabilityListener(callback: (event: ReachabilityChangedEvent) => void): EventSubscription {
    return listen('onReachabilityChanged', callback)
  },
  addApplicationContextListener(
    callback: (event: ApplicationContextReceivedEvent) => void,
  ): EventSubscription {
    return listen('onApplicationContextReceived', callback)
  },
}

function listen<T>(eventName: string, callback: (event: T) => void): EventSubscription {
  if (native == null) return { remove() {} }
  return native.addListener(eventName, callback as (event: never) => void)
}

export function ensureWatchSession(): Promise<boolean> {
  if (!WatchConnectivity.isSupported) return Promise.resolve(false)
  if (WatchConnectivity.sessionState.activationState === 'activated') return Promise.resolve(true)
  return new Promise((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let subscription: EventSubscription | undefined
    const finish = (activated: boolean) => {
      if (settled) return
      settled = true
      if (timer != null) clearTimeout(timer)
      subscription?.remove()
      resolve(activated)
    }
    subscription = WatchConnectivity.addActivationListener((event) => {
      if (event.activationState !== 'activated' && event.error == null) return
      finish(event.activationState === 'activated')
    })
    void WatchConnectivity.activate().then(() => {
      if (WatchConnectivity.sessionState.activationState === 'activated') finish(true)
    }).catch(() => finish(false))
    timer = setTimeout(() => {
      finish(WatchConnectivity.sessionState.activationState === 'activated')
    }, 4000)
  })
}
