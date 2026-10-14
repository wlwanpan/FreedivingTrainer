/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "watch",
  bundleIdentifier: ".watch",
  icon: 'https://github.com/expo.png',
  colors: { $accent: "#0D9488" },
  deploymentTarget: "9.4",
  frameworks: ["HealthKit"],
  entitlements: {
    "com.apple.developer.healthkit": true,
  },
});