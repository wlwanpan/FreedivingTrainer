import RootNavigator from '@/components/RootNavigator'
import WatchBridge from '@/components/WatchBridge'
import { DATABASE_NAME, expoDb } from '@/db/client'
import { applyMigrations } from '@/db/migrate'
import { repairSettingsSchema } from '@/db/repair'
import { useAppFonts } from '@/design/fonts'
import { Colors } from '@/design/styles'
import FormatterContextProvider from '@/providers/formatter'
import I18nProvider from '@/providers/i18n'
import SQLContextProvider from '@/providers/sql'
import SubscriptionProvider from '@/providers/subscription'
import WarningModalProvider from '@/providers/warning_modal'
import migrations from '@/drizzle/migrations'
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'
import * as SplashScreen from 'expo-splash-screen'
import { SQLiteProvider, openDatabaseSync } from 'expo-sqlite'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'


SplashScreen.preventAutoHideAsync()
void SystemUI.setBackgroundColorAsync(Colors.Canvas)

export default function RootLayout() {
  const fontsReady = useAppFonts()
  const studioDb = useMemo(() => openDatabaseSync(DATABASE_NAME, {
    useNewConnection: true,
  }), [])

  useDrizzleStudio(studioDb)
  repairSettingsSchema(expoDb)
  const [migrated, setMigrated] = useState<{ success: boolean, error?: Error }>({ success: false })
  const success = migrated.success
  const error = migrated.error

  useEffect(() => {
    try {
      applyMigrations(expoDb, migrations)
      setMigrated({ success: true })
    } catch (caught) {
      const migrationError = caught instanceof Error ? caught : new Error(String(caught))
      console.error('Migration error:', migrationError)
      setMigrated({ success: false, error: migrationError })
    }
  }, [])

  useEffect(() => {
    if (fontsReady && (error || success)) {
      SplashScreen.hideAsync()
    }
  }, [fontsReady, success, error])

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.Canvas }}>
          <StatusBar style='dark' />
          <Suspense fallback={<ActivityIndicator size='large' color={Colors.Seafoam} />}>
            <SQLiteProvider databaseName={DATABASE_NAME}>
              <WarningModalProvider>
                <SQLContextProvider>
                  <I18nProvider>
                    <FormatterContextProvider>
                      <SubscriptionProvider>
                        <WatchBridge />
                        <RootNavigator />
                      </SubscriptionProvider>
                    </FormatterContextProvider>
                  </I18nProvider>
                </SQLContextProvider>
              </WarningModalProvider>
            </SQLiteProvider>
          </Suspense>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </KeyboardProvider>
  )
}
