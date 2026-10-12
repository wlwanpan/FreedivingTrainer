import type {
  ActivationDidCompleteEvent,
  ActivationState,
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
  updateApplicationContext: (context: Record<string, unknown>) => Promise<void>
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
  updateApplicationContext(context: Record<string, unknown>): Promise<void> {
    if (native == null) return Promise.resolve()
    return native.updateApplicationContext(context)
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
}

function listen<T>(eventName: string, callback: (event: T) => void): EventSubscription {
  if (native == null) return { remove() {} }
  return native.addListener(eventName, callback as (event: never) => void)
}
