/**
 * @bacons/apple-targets adds PBXFileSystemSynchronizedRootGroup (Xcode folders),
 * which sets objectVersion 70. CocoaPods 1.16.2's xcodeproj gem has no mapping
 * for 70, so `pod install` crashes. 77 is the Xcode 16.0 format that gem knows.
 */
const { withXcodeProject } = require('expo/config-plugins')


module.exports = function withPbxprojObjectVersion(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults
    if (String(project.hash?.project?.objectVersion) === '70') {
      project.hash.project.objectVersion = 77
    }
    return config
  })
}
