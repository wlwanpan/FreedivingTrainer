import Button from '@/components/Button'
import FreeSessionsBanner from '@/components/FreeSessionsBanner'
import ScreenHeader from '@/components/ScreenHeader'
import SettingsChoice from '@/components/SettingsChoice'
import SettingsStepper from '@/components/SettingsStepper'
import WearableStatus from '@/components/WearableStatus'
import WrapperScreen from '@/components/WrapperScreen'
import { DateFormats } from '@/constants/dates'
import { useBottomControlInset } from '@/design/chrome'
import { Colors, Fonts, FontSizes, Layout, Radii, Space } from '@/design/styles'
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
import Ionicons from '@expo/vector-icons/Ionicons'
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

  return (
    <WrapperScreen skipBottomInset>
      <ScreenHeader title={t('settings.title')} />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom }}
      >
        <SCard>
          <SCardTitle>{t('settings.training')}</SCardTitle>
          <SGroup>{t('settings.animation')}</SGroup>
          <SNote>{t('settings.animationNote')}</SNote>
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

          <SGroup>{t('settings.haptic')}</SGroup>
          <SNote>{t('settings.hapticNote')}</SNote>
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

          <SGroup>{t('settings.sound')}</SGroup>
          <SNote>{t('settings.soundNote')}</SNote>
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

          <SGroup>{t('settings.preparation')}</SGroup>
          <SettingsStepper
            label={t('settings.breatheUp')}
            mode='duration'
            value={settings.breatheUpSeconds}
            step={15}
            min={0}
            max={300}
            onChange={(value) => { void updateSetting({ breatheUpSeconds: value }) }}
          />

          <SGroup>{t('settings.baseline')}</SGroup>
          <SNote>
            {settings.baselineMaxHoldSeconds == null
              ? t('settings.baselineEmpty')
              : settings.baselineContractionSeconds == null
                ? t('settings.baselineMax', { time: formatSeconds(settings.baselineMaxHoldSeconds) })
                : t('settings.baselineMaxContraction', {
                  time: formatSeconds(settings.baselineMaxHoldSeconds),
                  contraction: formatSeconds(settings.baselineContractionSeconds),
                })}
          </SNote>
          <Button
            title={settings.baselineMaxHoldSeconds == null ? t('settings.takeBaseline') : t('settings.retakeBaseline')}
            onPress={() => router.push('/baseline')}
          />

          <SGroup>{t('settings.plan')}</SGroup>
          {settings.baselineMaxHoldSeconds == null ? (
            <SNote>{t('settings.planNeedBaseline')}</SNote>
          ) : (
            <>
              <SNote>
                {planWeek?.detail ?? t('settings.planChoose')}
              </SNote>
              <Button
                title={t('settings.changePlan')}
                onPress={() => router.push('/plan')}
              />
            </>
          )}

          <SGroup>{t('settings.co2Table')}</SGroup>
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
                onChange={(value) => { void updateSetting({ co2Rounds: value }) }}
              />
            </>
          )}

          <SGroup>{t('settings.o2Table')}</SGroup>
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
                onChange={(value) => { void updateSetting({ o2Rounds: value }) }}
              />
            </>
          )}
        </SCard>

        <SCard>
          <SCardTitle>{t('settings.purchases')}</SCardTitle>
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
          />
        </SCard>

        <SCard>
          <SCardTitle>{t('settings.device')}</SCardTitle>
          <SGroup>{t('settings.appleWatch')}</SGroup>
          <SNote>
            {t('settings.appleWatchNote')}
          </SNote>
          <WearableStatus />
        </SCard>

        <SCard>
          <SCardTitle>{t('settings.system')}</SCardTitle>
          <SGroup>{t('language.label')}</SGroup>
          <SNote>{t('language.note')}</SNote>
          <SLangLink
            onPress={() => router.push('/language')}
            accessibilityRole='button'
            accessibilityLabel={t('language.openA11y', { language: languageNativeName(language) })}
          >
            {({ pressed }) => (
              <SLangInner $pressed={pressed}>
                <SLangValue>{languageNativeName(language)}</SLangValue>
                <Ionicons name='chevron-forward' size={18} color={Colors.TextMuted} />
              </SLangInner>
            )}
          </SLangLink>

          <SGroup>{t('settings.date')}</SGroup>
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

          <SGroup>{t('settings.data')}</SGroup>
          <SNote>
            {t('settings.dataNote')}
          </SNote>
          <Button
            title={t('settings.erase')}
            onPress={() => { void erase() }}
            loading={eraseInFlight}
            variant='danger'
          />
        </SCard>
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

const SCard = styled.View`
  margin: 0 ${Space.screen}px 12px;
  padding: 16px 16px 8px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SCardTitle = styled.Text`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SGroup = styled.Text`
  margin-top: 16px;
  margin-bottom: 4px;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SNote = styled.Text`
  margin-top: 8px;
  margin-bottom: 12px;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.Text};
`

const SChoiceRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 4px;
`

const SLangLink = styled.Pressable`
  min-height: ${Layout.MinControl}px;
  margin-bottom: 4px;
`

const SLangInner = styled.View<{ $pressed: boolean }>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  min-height: ${Layout.MinControl}px;
  padding: 0 4px;
  border-radius: ${Radii.Control}px;
  background-color: ${(props) => props.$pressed ? Colors.Hover : 'transparent'};
`

const SLangValue = styled.Text`
  flex: 1;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SAppVersion = styled.Text`
  margin: 8px ${Space.screen}px 12px;
  text-align: center;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.TextMuted};
`
