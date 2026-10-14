const IS_DEV = process.env.APP_VARIANT === 'development'
const IS_PREVIEW = process.env.APP_VARIANT === 'preview'
const APP_NAME = 'Freediving & CO2 Tables'
const APPLE_TEAM_ID = 'WD73B9M86L'

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.wlwanpan.FreedivingTrainer.dev'
  }

  if (IS_PREVIEW) {
    return 'com.wlwanpan.FreedivingTrainer.preview'
  }

  return 'com.wlwanpan.FreedivingTrainer'
}

const getAppName = () => {
  if (IS_DEV) {
    return `${APP_NAME} (Dev)`
  }

  if (IS_PREVIEW) {
    return `${APP_NAME} (Preview)`
  }

  return APP_NAME
}

const getWatchAppExtension = bundleIdentifier => ({
  targetName: 'watch',
  bundleIdentifier: `${bundleIdentifier}.watch`,
  parentBundleIdentifier: bundleIdentifier,
  entitlements: {
    'com.apple.developer.healthkit': true,
  },
})

export default ({ config }) => {
  const bundleIdentifier = getUniqueIdentifier()

  return {
    ...config,
    name: getAppName(),
    extra: {
      ...config.extra,
      appVariant: process.env.APP_VARIANT ?? 'production',
      revenueCatIosApiKey: process.env.REVENUECAT_IOS_API_KEY ?? '',
      revenueCatAndroidApiKey: process.env.REVENUECAT_ANDROID_API_KEY ?? '',
      eas: {
        ...config.extra?.eas,
        build: {
          ...config.extra?.eas?.build,
          experimental: {
            ...config.extra?.eas?.build?.experimental,
            ios: {
              ...config.extra?.eas?.build?.experimental?.ios,
              appExtensions: [getWatchAppExtension(bundleIdentifier)],
            },
          },
        },
      },
    },
    ios: {
      ...config.ios,
      appleTeamId: APPLE_TEAM_ID,
      bundleIdentifier,
    },
    android: {
      ...config.android,
      package: bundleIdentifier,
    },
  }
}
