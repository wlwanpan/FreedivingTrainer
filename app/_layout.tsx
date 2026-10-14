import RootNavigator from '@/components/RootNavigator'
import WatchBridge from '@/components/WatchBridge'
import { DATABASE_NAME, drizzleDb } from '@/db/client'
import { useAppFonts } from '@/design/fonts'
import { Colors } from '@/design/styles'
import FormatterContextProvider from '@/providers/formatter'
import SQLContextProvider from '@/providers/sql'
import SubscriptionProvider from '@/providers/subscription'
import WarningModalProvider from '@/providers/warning_modal'
import migrations from '@/drizzle/migrations'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'
import * as SplashScreen from 'expo-splash-screen'
import { SQLiteProvider, openDatabaseSync } from 'expo-sqlite'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import { Suspense, useEffect, useMemo } from 'react'
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
  const { success, error } = useMigrations(drizzleDb, migrations)
  if (error) {
    console.error('Migration error:', error)
  }

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
                  <FormatterContextProvider>
                    <SubscriptionProvider>
                      <WatchBridge />
                      <RootNavigator />
                    </SubscriptionProvider>
                  </FormatterContextProvider>
                </SQLContextProvider>
              </WarningModalProvider>
            </SQLiteProvider>
          </Suspense>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </KeyboardProvider>
  )
}
