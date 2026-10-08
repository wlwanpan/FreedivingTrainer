import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import SettingsChoice from '@/components/SettingsChoice'
import SettingsStepper from '@/components/SettingsStepper'
import WrapperScreen from '@/components/WrapperScreen'
import { DateFormats } from '@/constants/dates'
import { ErrorTitles } from '@/constants/errors'
import { Colors, FontSizes } from '@/design/styles'
import useUpdateSetting from '@/hooks/useUpdateSetting'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { styled } from 'styled-components/native'


export default function SettingsScreen() {
  const router = useRouter()
  const { settings } = useSQLContext()
  const { formatSeconds } = useFormatterContext()
  const subscription = useSubscriptionContext()
  const { showWarning } = useWarningModal()
  const updateSetting = useUpdateSetting()
  const [restoreInFlight, setRestoreInFlight] = useState(false)

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
    <WrapperScreen scrollable>
      <HeaderWithBtn
        headerText='Settings'
        leftText='Back'
        leftOnClick={() => router.back()}
      />
      <SBody>
        <SSection>Preparation</SSection>
        <SettingsStepper
          label='Breathe-up'
          mode='duration'
          value={settings.breatheUpSeconds}
          step={15}
          min={0}
          max={300}
          onChange={(value) => { void updateSetting({ breatheUpSeconds: value }) }}
        />

        <SSection>Baseline</SSection>
        <SBaseline>
          {settings.baselineMaxHoldSeconds == null
            ? 'No maximum hold yet. A baseline test sizes the CO2 and O2 tables.'
            : `Maximum ${formatSeconds(settings.baselineMaxHoldSeconds)}${
              settings.baselineContractionSeconds == null
                ? ''
                : ` · contraction ${formatSeconds(settings.baselineContractionSeconds)}`
            }`}
        </SBaseline>
        <Button
          title={settings.baselineMaxHoldSeconds == null ? 'Take baseline test' : 'Retake baseline test'}
          onPress={() => router.push('/baseline')}
        />

        <SSection>CO2 table</SSection>
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

        <SSection>O2 table</SSection>
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

        <SSection>Date</SSection>
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

        <SSection>Access</SSection>
        <Button
          title={subscription.hasLifetimeAccess ? 'Lifetime access is active' : 'Unlock lifetime access'}
          onPress={() => router.push('/paywall')}
          disabled={subscription.hasLifetimeAccess}
        />
        <Button
          title='Restore purchase'
          onPress={() => { void restore() }}
          loading={restoreInFlight}
          defaultBGColor={Colors.GreyPrimary}
          pressedBGColor={Colors.GreyFaded}
        />
      </SBody>
    </WrapperScreen>
  )
}

const SBody = styled.View`
  padding: 8px 20px 32px;
`

const SSection = styled.Text`
  margin-top: 22px;
  margin-bottom: 4px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.GreyPrimary};
`

const SBaseline = styled.Text`
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
`
