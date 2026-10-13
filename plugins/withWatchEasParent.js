/**
 * @bacons/apple-targets overwrites extra.eas.build.experimental.ios.appExtensions
 * and drops parentBundleIdentifier. EAS still needs the parent iPhone bundle ID
 * when it creates the watch target's App Store profile.
 */
module.exports = function withWatchEasParent(config) {
  const parentBundleIdentifier = config.ios?.bundleIdentifier
  const extensions = config.extra?.eas?.build?.experimental?.ios?.appExtensions

  if (!parentBundleIdentifier || !Array.isArray(extensions)) {
    return config
  }

  for (const extension of extensions) {
    if (extension?.targetName === 'watch' && !extension.parentBundleIdentifier) {
      extension.parentBundleIdentifier = parentBundleIdentifier
    }
  }

  return config
}
