import Button from '@/components/Button'
import FreeSessionsBanner from '@/components/FreeSessionsBanner'
import ScreenHeader from '@/components/ScreenHeader'
import SettingsChoice from '@/components/SettingsChoice'
import SettingsStepper from '@/components/SettingsStepper'
import WrapperScreen from '@/components/WrapperScreen'
import { DateFormats } from '@/constants/dates'
import { ErrorTitles } from '@/constants/errors'
import { useBottomControlInset } from '@/design/chrome'
import { Colors, FontSizes } from '@/design/styles'
import useCurrentPlanWeek from '@/hooks/useCurrentPlanWeek'
import useUpdateSetting from '@/hooks/useUpdateSetting'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { styled } from 'styled-components/native'


export default function SettingsScreen() {
  const router = useRouter()
  const { settings, eraseAllData } = useSQLContext()
  const subscription = useSubscriptionContext()
  const { formatSeconds } = useFormatterContext()
  const { showWarning, showConfirmDeletion } = useWarningModal()
  const updateSetting = useUpdateSetting()
  const planWeek = useCurrentPlanWeek()
  const paddingBottom = useBottomControlInset(true)
  const [eraseInFlight, setEraseInFlight] = useState(false)
  const [restoreInFlight, setRestoreInFlight] = useState(false)

  useEffect(() => {
    if (!eraseInFlight || settings.createdAt != null) return
    router.replace('/onboarding')
  }, [eraseInFlight, settings.createdAt, router])

  const erase = async () => {
    const confirmed = await showConfirmDeletion(
      'Erase all data?',
      'This removes your tables, logged sessions, and baseline from this device. The app will open as a new install. A lifetime purchase stays with your Apple ID.',
    )
    if (!confirmed) return

    setEraseInFlight(true)
    const res = await eraseAllData()
    if (res.error) {
      setEraseInFlight(false)
      showWarning(ErrorTitles.Sql, res.error.message)
    }
  }

  const restore = async () => {
    if (!subscription.configured) {
      showWarning(ErrorTitles.Input, 'Add a RevenueCat API key before restoring purchases.')
      return
    }
    setRestoreInFlight(true)
    await subscription.restorePurchase()
    setRestoreInFlight(false)
  }

  return (
    <WrapperScreen skipBottomInset>
      <ScreenHeader title='Settings' />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom }}
      >
        <SCard>
          <SCardTitle>Training settings</SCardTitle>
          <SGroup>Animation</SGroup>
          <SNote>Bubbles, fish, and card movement during a table.</SNote>
          <SChoiceRow>
            <SettingsChoice
              label='On'
              selected={settings.trainingAnimation}
              onPress={() => { void updateSetting({ trainingAnimation: true }) }}
            />
            <SettingsChoice
              label='Off'
              selected={!settings.trainingAnimation}
              onPress={() => { void updateSetting({ trainingAnimation: false }) }}
            />
          </SChoiceRow>

          <SGroup>Preparation</SGroup>
          <SettingsStepper
            label='Breathe-up'
            mode='duration'
            value={settings.breatheUpSeconds}
            step={15}
            min={0}
            max={300}
            onChange={(value) => { void updateSetting({ breatheUpSeconds: value }) }}
          />

          <SGroup>Baseline</SGroup>
          <SNote>
            {settings.baselineMaxHoldSeconds == null
              ? 'No maximum hold yet. A baseline test sizes the CO2 and O2 tables.'
              : `Maximum ${formatSeconds(settings.baselineMaxHoldSeconds)}${
                settings.baselineContractionSeconds == null
                  ? ''
                  : ` · contraction ${formatSeconds(settings.baselineContractionSeconds)}`
              }`}
          </SNote>
          <Button
            title={settings.baselineMaxHoldSeconds == null ? 'Take baseline test' : 'Retake baseline test'}
            onPress={() => router.push('/baseline')}
          />

          <SGroup>Plan</SGroup>
          {settings.baselineMaxHoldSeconds == null ? (
            <SNote>Take a baseline test to choose a 4, 8, or 12 week plan.</SNote>
          ) : (
            <>
              <SNote>
                {planWeek?.detail ?? 'Choose a 4, 8, or 12 week plan. Keep CO2 and O2 on different days.'}
              </SNote>
              <Button
                title='Change plan'
                onPress={() => router.push('/plan')}
              />
            </>
          )}

          <SGroup>CO2 table</SGroup>
          {planWeek ? (
            <SNote>This plan sets the CO2 table.</SNote>
          ) : (
            <>
              <SettingsStepper
                label='Hold'
                mode='duration'
                value={settings.co2HoldSeconds}
                step={15}
                min={15}
                max={900}
                onChange={(value) => { void updateSetting({ co2HoldSeconds: value }) }}
              />
              <SettingsStepper
                label='Starting rest'
                mode='duration'
                value={settings.co2RestStartSeconds}
                step={15}
                min={15}
                max={900}
                onChange={(value) => { void updateSetting({ co2RestStartSeconds: value }) }}
              />
              <SettingsStepper
                label='Rest step'
                mode='duration'
                value={settings.co2RestStepSeconds}
                step={5}
                min={0}
                max={120}
                onChange={(value) => { void updateSetting({ co2RestStepSeconds: value }) }}
              />
              <SettingsStepper
                label='Rounds'
                value={settings.co2Rounds}
                min={1}
                max={20}
                onChange={(value) => { void updateSetting({ co2Rounds: value }) }}
              />
            </>
          )}

          <SGroup>O2 table</SGroup>
          {planWeek?.setsO2 ? (
            <SNote>This plan sets the O2 table. Train it on a different day from CO2.</SNote>
          ) : (
            <>
              <SettingsStepper
                label='Starting hold'
                mode='duration'
                value={settings.o2HoldStartSeconds}
                step={15}
                min={15}
                max={900}
                onChange={(value) => { void updateSetting({ o2HoldStartSeconds: value }) }}
              />
              <SettingsStepper
                label='Hold step'
                mode='duration'
                value={settings.o2HoldStepSeconds}
                step={5}
                min={0}
                max={60}
                onChange={(value) => { void updateSetting({ o2HoldStepSeconds: value }) }}
              />
              <SettingsStepper
                label='Rest'
                mode='duration'
                value={settings.o2RestSeconds}
                step={15}
                min={15}
                max={900}
                onChange={(value) => { void updateSetting({ o2RestSeconds: value }) }}
              />
              <SettingsStepper
                label='Rounds'
                value={settings.o2Rounds}
                min={1}
                max={20}
                onChange={(value) => { void updateSetting({ o2Rounds: value }) }}
              />
            </>
          )}
        </SCard>

        <SCard>
          <SCardTitle>System settings</SCardTitle>
          <SGroup>Date</SGroup>
          <SChoiceRow>
            {DateFormats.map((format) => (
              <SettingsChoice
                key={format}
                label={format === 'YYYY-MM-DD' ? '2026-10-08' : 'Oct 8, 2026'}
                selected={settings.dateFormat === format}
                onPress={() => { void updateSetting({ dateFormat: format }) }}
              />
            ))}
          </SChoiceRow>

          <SGroup>Data</SGroup>
          <SNote>
            Removes your tables, logged sessions, and baseline from this device.
          </SNote>
          <Button
            title='Erase all data'
            onPress={() => { void erase() }}
            loading={eraseInFlight}
            defaultBGColor={Colors.RedPrimary}
            pressedBGColor={Colors.RedBackground}
          />
        </SCard>

        <SCard>
          <SCardTitle>Purchases</SCardTitle>
          <FreeSessionsBanner />
          <Button
            title={subscription.hasLifetimeAccess ? 'Lifetime access is active' : 'Unlock lifetime access'}
            onPress={() => router.push('/paywall')}
            disabled={subscription.hasLifetimeAccess}
            style={{ marginTop: subscription.loading || subscription.hasLifetimeAccess ? 12 : 0 }}
          />
          <Button
            title='Restore purchase'
            onPress={() => { void restore() }}
            loading={restoreInFlight}
            defaultBGColor={Colors.GreyPrimary}
            pressedBGColor={Colors.GreyFaded}
          />
        </SCard>
      </SScroll>
    </WrapperScreen>
  )
}

const SScroll = styled.ScrollView`
  flex: 1;
`

const SCard = styled.View`
  margin: 0 20px 12px;
  padding: 16px 16px 8px;
  border-radius: 16px;
  background-color: ${Colors.White};
  border-width: 1px;
  border-color: ${Colors.GreyDivider};
`

const SCardTitle = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SGroup = styled.Text`
  margin-top: 16px;
  margin-bottom: 4px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.GreyPrimary};
`

const SNote = styled.Text`
  margin-top: 8px;
  margin-bottom: 12px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.DeepPrimary};
`

const SChoiceRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 4px;
`
