import ExpoModulesCore
import Foundation
import ConnectIQ

private let watchAppUUID = UUID(uuidString: "0328696E-CB77-51AD-9D18-AFCB600B4221")!
private let urlScheme = "freedivingtrainer"
private let restorationId = "freedivingtrainer.garmin.connectiq"
private let devicesKey = "garmin.paired.devices"

public class GarminConnectIQModule: Module {
  private let coordinator = GarminCoordinator()

  public func definition() -> ModuleDefinition {
    Name("GarminConnectIQ")

    Events("onMessage", "onDeviceStatus", "onReady")

    Function("watchAppUUID") {
      return watchAppUUID.uuidString.lowercased()
    }

    AsyncFunction("initialize") { (promise: Promise) in
      self.coordinator.initialize { event, body in
        self.sendEvent(event, body)
      }
      promise.resolve(nil)
    }.runOnQueue(.main)

    AsyncFunction("showDeviceSelection") { (promise: Promise) in
      ConnectIQ.sharedInstance().showDeviceSelection()
      promise.resolve(nil)
    }.runOnQueue(.main)

    AsyncFunction("handleOpenURL") { (urlString: String, promise: Promise) in
      guard let url = URL(string: urlString) else {
        promise.reject("ERR_URL", "Invalid URL")
        return
      }
      let devices = self.coordinator.handleOpenURL(url)
      promise.resolve(devices)
    }

    AsyncFunction("sendNextSession") { (payload: [String: Any], promise: Promise) in
      self.coordinator.send(payload) { result in
        promise.resolve(result)
      }
    }

    AsyncFunction("sendAck") { (payload: [String: Any], promise: Promise) in
      self.coordinator.send(payload) { result in
        promise.resolve(result)
      }
    }

    AsyncFunction("getStatus") { (promise: Promise) in
      promise.resolve(self.coordinator.status())
    }
  }
}

private final class GarminCoordinator: NSObject, IQDeviceEventDelegate, IQAppMessageDelegate {
  private var devices: [UUID: IQDevice] = [:]
  private var apps: [UUID: IQApp] = [:]
  private var emit: ((String, [String: Any]) -> Void)?
  private var ready = false

  func initialize(emit: @escaping (String, [String: Any]) -> Void) {
    self.emit = emit
    ConnectIQ.sharedInstance().initialize(
      withUrlScheme: urlScheme,
      uiOverrideDelegate: nil,
      stateRestorationIdentifier: restorationId
    )
    ready = true
    restoreDevices()
    emit("onReady", ["ok": true])
  }

  func handleOpenURL(_ url: URL) -> [[String: Any]] {
    guard let parsed = ConnectIQ.sharedInstance().parseDeviceSelectionResponse(from: url) as? [IQDevice] else {
      return []
    }
    adopt(parsed)
    persistDevices()
    return parsed.map { devicePayload($0) }
  }

  func send(_ payload: [String: Any], completion: @escaping (String) -> Void) {
    let connected = apps.values.filter { app in
      ConnectIQ.sharedInstance().getDeviceStatus(app.device) == .connected
    }
    if connected.isEmpty {
      completion("notConnected")
      return
    }
    var remaining = connected.count
    var last = "unknown"
    for app in connected {
      ConnectIQ.sharedInstance().sendMessage(
        payload,
        to: app,
        progress: { _, _ in },
        completion: { result in
          last = NSStringFromSendMessageResult(result)
          remaining -= 1
          if remaining == 0 {
            completion(last)
          }
        }
      )
    }
  }

  func status() -> [String: Any] {
    let list = devices.values.map { devicePayload($0) }
    let connected = list.contains { ($0["status"] as? String) == "connected" }
    return [
      "initialized": ready,
      "connected": connected,
      "appInstalled": !list.isEmpty,
      "devices": list,
    ]
  }

  func deviceStatusChanged(_ device: IQDevice, status: IQDeviceStatus) {
    emit?("onDeviceStatus", devicePayload(device))
  }

  func deviceCharacteristicsDiscovered(_ device: IQDevice) {
    emit?("onDeviceStatus", devicePayload(device))
  }

  func receivedMessage(_ message: Any, from app: IQApp) {
    emit?("onMessage", ["message": message, "device": devicePayload(app.device)])
  }

  private func adopt(_ list: [IQDevice]) {
    devices.removeAll()
    apps.removeAll()
    ConnectIQ.sharedInstance().unregister(forAllDeviceEvents: self)
    ConnectIQ.sharedInstance().unregister(forAllAppMessages: self)
    for device in list {
      devices[device.uuid] = device
      ConnectIQ.sharedInstance().register(forDeviceEvents: device, delegate: self)
      let app = IQApp(uuid: watchAppUUID, store: watchAppUUID, device: device)
      apps[device.uuid] = app
      ConnectIQ.sharedInstance().register(forAppMessages: app, delegate: self)
      emit?("onDeviceStatus", devicePayload(device))
    }
  }

  private func persistDevices() {
    do {
      let data = try NSKeyedArchiver.archivedData(
        withRootObject: Array(devices.values),
        requiringSecureCoding: true
      )
      UserDefaults.standard.set(data, forKey: devicesKey)
    } catch {
      return
    }
  }

  private func restoreDevices() {
    guard let data = UserDefaults.standard.data(forKey: devicesKey) else { return }
    do {
      guard let saved = try NSKeyedUnarchiver.unarchivedArrayOfObjects(
        ofClass: IQDevice.self,
        from: data
      ) else { return }
      adopt(saved)
    } catch {
      return
    }
  }

  private func devicePayload(_ device: IQDevice) -> [String: Any] {
    let status = ConnectIQ.sharedInstance().getDeviceStatus(device)
    return [
      "uuid": device.uuid.uuidString,
      "modelName": device.modelName ?? "",
      "friendlyName": device.friendlyName ?? "",
      "partNumber": device.partNumber ?? "",
      "status": statusName(status),
    ]
  }

  private func statusName(_ status: IQDeviceStatus) -> String {
    switch status {
    case .invalidDevice: return "invalid"
    case .bluetoothNotReady: return "bluetoothNotReady"
    case .notFound: return "notFound"
    case .notConnected: return "notConnected"
    case .connected: return "connected"
    @unknown default: return "unknown"
    }
  }
}
