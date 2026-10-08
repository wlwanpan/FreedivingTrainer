const IS_DEV = process.env.APP_VARIANT === 'development'
const IS_PREVIEW = process.env.APP_VARIANT === 'preview'
const APP_NAME = 'Freediving & CO2 Tables'

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

export default ({ config }) => ({
  ...config,
  name: getAppName(),
  extra: {
    ...config.extra,
    appVariant: process.env.APP_VARIANT ?? 'production',
    revenueCatIosApiKey: process.env.REVENUECAT_IOS_API_KEY ?? '',
    revenueCatAndroidApiKey: process.env.REVENUECAT_ANDROID_API_KEY ?? '',
  },
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
  },
})
