/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "watch",
  bundleIdentifier: ".watch",
  icon: '../../assets/images/icon.png',
  colors: { $accent: "#0D9488" },
  deploymentTarget: "9.4",
  frameworks: ["HealthKit"],
  entitlements: {
    "com.apple.developer.healthkit": true,
  },
});