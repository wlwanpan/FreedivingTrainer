/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "watch",
  bundleIdentifier: ".watch",
  // Watch icon is AppIcon.icon in this folder. Leave `icon` unset so prebuild
  // does not replace it with a PNG app icon set. The folder name must stay AppIcon.
  colors: { $accent: "#0D9488" },
  deploymentTarget: "9.4",
  frameworks: ["HealthKit"],
  entitlements: {
    "com.apple.developer.healthkit": true,
  },
});