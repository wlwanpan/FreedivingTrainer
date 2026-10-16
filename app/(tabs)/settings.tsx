import Button from '@/components/Button'
import FreeSessionsBanner from '@/components/FreeSessionsBanner'
import PlanIdentity from '@/components/PlanIdentity'
import ScreenHeader from '@/components/ScreenHeader'
import SettingsCard from '@/components/SettingsCard'
import SettingsChoice from '@/components/SettingsChoice'
import SettingsField from '@/components/SettingsField'
import SettingsStepper from '@/components/SettingsStepper'
import WearableStatus from '@/components/WearableStatus'
import WrapperScreen from '@/components/WrapperScreen'
import { DateFormats } from '@/constants/dates'
import { useBottomControlInset } from '@/design/chrome'
import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import useCurrentPlanWeek from '@/hooks/useCurrentPlanWeek'
import useUpdateSetting from '@/hooks/useUpdateSetting'
import { withWatchTrainingLoss } from '@/hooks/useWearableStatus'
import { languageNativeName } from '@/i18n/languages'
import { useFormatterContext } from '@/providers/formatter'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { formatDay as formatDayValue } from '@/utils/date'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { styled } from 'styled-components/native'


const appName = Constants.expoConfig?.name ?? 'Freediving & CO2 Tables'
const appVersion = Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? ''


export default function SettingsScreen() {
  const router = useRouter()
  const { settings, eraseAllData } = useSQLContext()
  const subscription = useSubscriptionContext()
  const { t, language } = useI18n()
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
      t('settings.eraseTitle'),
      withWatchTrainingLoss(t('settings.eraseBody'), t),
    )
    if (!confirmed) return

    setEraseInFlight(true)
    const res = await eraseAllData()
    if (res.error) {
      setEraseInFlight(false)
      showWarning(t('errors.sql'), res.error.message)
    }
  }

  const restore = async () => {
    if (!subscription.configured) {
      showWarning(t('errors.input'), t('settings.restoreNeedKey'))
      return
    }
    setRestoreInFlight(true)
    await subscription.restorePurchase()
    setRestoreInFlight(false)
  }

  const baselineNote = settings.baselineMaxHoldSeconds == null
    ? t('settings.baselineEmpty')
    : settings.baselineContractionSeconds == null
      ? t('settings.baselineMax', { time: formatSeconds(settings.baselineMaxHoldSeconds) })
      : t('settings.baselineMaxContraction', {
        time: formatSeconds(settings.baselineMaxHoldSeconds),
        contraction: formatSeconds(settings.baselineContractionSeconds),
      })

  return (
    <WrapperScreen skipBottomInset>
      <ScreenHeader title={t('settings.title')} />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom }}
      >
        <SettingsCard icon='notifications-outline' title={t('settings.training')}>
          <SettingsField
            icon='sparkles-outline'
            title={t('settings.animation')}
            note={t('settings.animationNote')}
          >
            <SChoiceRow>
              <SettingsChoice
                label={t('common.on')}
                selected={settings.trainingAnimation}
                onPress={() => { void updateSetting({ trainingAnimation: true }) }}
              />
              <SettingsChoice
                label={t('common.off')}
                selected={!settings.trainingAnimation}
                onPress={() => { void updateSetting({ trainingAnimation: false }) }}
              />
            </SChoiceRow>
          </SettingsField>
          <SettingsField
            icon='flash-outline'
            title={t('settings.haptic')}
            note={t('settings.hapticNote')}
          >
            <SChoiceRow>
              <SettingsChoice
                label={t('common.on')}
                selected={settings.trainingHaptic}
                onPress={() => { void updateSetting({ trainingHaptic: true }) }}
              />
              <SettingsChoice
                label={t('common.off')}
                selected={!settings.trainingHaptic}
                onPress={() => { void updateSetting({ trainingHaptic: false }) }}
              />
            </SChoiceRow>
          </SettingsField>
          <SettingsField
            icon='volume-medium-outline'
            title={t('settings.sound')}
            note={t('settings.soundNote')}
            last
          >
            <SChoiceRow>
              <SettingsChoice
                label={t('common.on')}
                selected={settings.trainingSound}
                onPress={() => { void updateSetting({ trainingSound: true }) }}
              />
              <SettingsChoice
                label={t('common.off')}
                selected={!settings.trainingSound}
                onPress={() => { void updateSetting({ trainingSound: false }) }}
              />
            </SChoiceRow>
          </SettingsField>
        </SettingsCard>

        <SettingsCard icon='map-outline' title={t('settings.currentPlan')}>
          {settings.baselineMaxHoldSeconds != null && planWeek == null ? (
            <SPlanBlock>
              <SNote>{t('settings.planChoose')}</SNote>
              <Button
                title={t('settings.changePlan')}
                onPress={() => router.push('/plan')}
                style={{ marginBottom: 0 }}
              />
            </SPlanBlock>
          ) : planWeek != null ? (
            <SPlanBlock>
              <SInset>
                <PlanIdentity level={planWeek.level} name={planWeek.planName} />
                <SPlanFrequency>{planWeek.frequency}</SPlanFrequency>
                <Button
                  title={t('settings.changePlan')}
                  onPress={() => router.push('/plan')}
                  style={{ marginBottom: 0 }}
                />
              </SInset>
            </SPlanBlock>
          ) : null}
          <SettingsField
            icon='stopwatch-outline'
            title={t('settings.baseline')}
            note={baselineNote}
            last
          >
            <Button
              title={settings.baselineMaxHoldSeconds == null ? t('settings.takeBaseline') : t('settings.retakeBaseline')}
              onPress={() => router.push('/baseline')}
              style={{ marginBottom: 0 }}
            />
          </SettingsField>
        </SettingsCard>

        <SettingsCard icon='leaf-outline' title={t('settings.preparation')}>
          <SettingsField
            icon='cloud-outline'
            title={t('settings.breatheUp')}
            last
            accessory={(
              <SettingsStepper
                mode='duration'
                value={settings.breatheUpSeconds}
                step={15}
                min={0}
                max={300}
                last
                onChange={(value) => { void updateSetting({ breatheUpSeconds: value }) }}
              />
            )}
          />
        </SettingsCard>

        <SettingsCard icon='water-outline' title={t('settings.co2Table')}>
          {planWeek?.sessions.some((session) => session.kind === 'co2') ? (
            <SNote>{t('settings.planSetsCo2')}</SNote>
          ) : planWeek ? (
            <SNote>{t('settings.planNoCo2')}</SNote>
          ) : (
            <>
              <SettingsStepper
                label={t('settings.hold')}
                mode='duration'
                value={settings.co2HoldSeconds}
                step={15}
                min={15}
                max={900}
                onChange={(value) => { void updateSetting({ co2HoldSeconds: value }) }}
              />
              <SettingsStepper
                label={t('settings.startingRest')}
                mode='duration'
                value={settings.co2RestStartSeconds}
                step={15}
                min={15}
                max={900}
                onChange={(value) => { void updateSetting({ co2RestStartSeconds: value }) }}
              />
              <SettingsStepper
                label={t('settings.restStep')}
                mode='duration'
                value={settings.co2RestStepSeconds}
                step={5}
                min={0}
                max={120}
                onChange={(value) => { void updateSetting({ co2RestStepSeconds: value }) }}
              />
              <SettingsStepper
                label={t('settings.rounds')}
                value={settings.co2Rounds}
                min={1}
                max={20}
                last
                onChange={(value) => { void updateSetting({ co2Rounds: value }) }}
              />
            </>
          )}
        </SettingsCard>

        <SettingsCard icon='fitness-outline' title={t('settings.o2Table')}>
          {planWeek?.setsO2 ? (
            <SNote>{t('settings.planSetsO2')}</SNote>
          ) : (
            <>
              <SettingsStepper
                label={t('settings.startingHold')}
                mode='duration'
                value={settings.o2HoldStartSeconds}
                step={15}
                min={15}
                max={900}
                onChange={(value) => { void updateSetting({ o2HoldStartSeconds: value }) }}
              />
              <SettingsStepper
                label={t('settings.holdStep')}
                mode='duration'
                value={settings.o2HoldStepSeconds}
                step={5}
                min={0}
                max={60}
                onChange={(value) => { void updateSetting({ o2HoldStepSeconds: value }) }}
              />
              <SettingsStepper
                label={t('settings.rest')}
                mode='duration'
                value={settings.o2RestSeconds}
                step={15}
                min={15}
                max={900}
                onChange={(value) => { void updateSetting({ o2RestSeconds: value }) }}
              />
              <SettingsStepper
                label={t('settings.rounds')}
                value={settings.o2Rounds}
                min={1}
                max={20}
                last
                onChange={(value) => { void updateSetting({ o2Rounds: value }) }}
              />
            </>
          )}
        </SettingsCard>

        <SettingsCard icon='diamond-outline' title={t('settings.purchases')}>
          {subscription.hasLifetimeAccess ? (
            <SNote>{t('settings.lifetimeActive')}</SNote>
          ) : null}
          <FreeSessionsBanner />
          {subscription.hasLifetimeAccess ? null : (
            <Button
              title={t('settings.unlockLifetime')}
              onPress={() => router.push('/paywall')}
              style={{ marginTop: subscription.loading ? 12 : 0 }}
            />
          )}
          <Button
            title={t('settings.restore')}
            onPress={() => { void restore() }}
            loading={restoreInFlight}
            disabled={subscription.hasLifetimeAccess}
            variant='ghost'
            style={{ marginBottom: 0 }}
          />
        </SettingsCard>

        <SettingsCard icon='watch-outline' title={t('settings.device')}>
          <SettingsField
            icon='watch-outline'
            title={t('settings.appleWatch')}
            note={t('settings.appleWatchNote')}
            last
          >
            <WearableStatus />
          </SettingsField>
        </SettingsCard>

        <SettingsCard icon='settings-outline' title={t('settings.system')}>
          <SettingsField
            icon='globe-outline'
            title={t('language.label')}
            note={t('language.note')}
            value={languageNativeName(language)}
            accessibilityLabel={t('language.openA11y', { language: languageNativeName(language) })}
            onPress={() => router.push('/language')}
          />
          <SettingsField
            icon='calendar-outline'
            title={t('settings.date')}
            last
          >
            <SChoiceRow>
              {DateFormats.map((format) => (
                <SettingsChoice
                  key={format}
                  label={format === 'YYYY-MM-DD' ? '2026-10-08' : formatDayValue('2026-10-08', 'MMM D, YYYY', t)}
                  selected={settings.dateFormat === format}
                  onPress={() => { void updateSetting({ dateFormat: format }) }}
                />
              ))}
            </SChoiceRow>
          </SettingsField>
        </SettingsCard>

        <SettingsCard icon='trash-outline' title={t('settings.data')}>
          <SNote>{t('settings.dataNote')}</SNote>
          <Button
            title={t('settings.erase')}
            onPress={() => { void erase() }}
            loading={eraseInFlight}
            variant='danger'
            style={{ marginBottom: 0 }}
          />
        </SettingsCard>
        <SAppVersion>
          {appVersion === '' ? appName : `${appName} ${appVersion}`}
        </SAppVersion>
      </SScroll>
    </WrapperScreen>
  )
}

const SScroll = styled.ScrollView`
  flex: 1;
`

const SPlanBlock = styled.View`
  padding-bottom: ${Space.md}px;
  border-bottom-width: 1px;
  border-bottom-color: ${Colors.Hairline};
`

const SInset = styled.View`
  margin-top: ${Space.sm}px;
  padding: ${Space.md}px;
  border-radius: 12px;
  background-color: ${Colors.Telemetry};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SPlanFrequency = styled.Text`
  margin-top: 4px;
  margin-bottom: 12px;
  font-family: ${Fonts.BodyMedium};
  font-size: ${FontSizes.XSmall};
  font-weight: 500;
  color: ${Colors.TextMuted};
`

const SNote = styled.Text`
  margin-top: ${Space.sm}px;
  margin-bottom: 12px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const SChoiceRow = styled.View`
  flex-direction: row;
  gap: 8px;
`

const SAppVersion = styled.Text`
  margin: ${Space.md}px ${Space.screen}px 12px;
  text-align: center;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.TextMuted};
`
