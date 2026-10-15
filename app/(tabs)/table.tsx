import Button from '@/components/Button'
import ScreenHeader from '@/components/ScreenHeader'
import SettingsStepper from '@/components/SettingsStepper'
import TableRoundRow from '@/components/TableRoundRow'
import TableTypeSwitch from '@/components/TableTypeSwitch'
import WrapperScreen from '@/components/WrapperScreen'
import { TableType } from '@/constants/tables'
import { tableTypeDescription, tableTypeLabel, tableTypeTerm } from '@/i18n/labels'
import { useBottomControlInset } from '@/design/chrome'
import { Footer } from '@/design/styled'
import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import useUpdateSetting from '@/hooks/useUpdateSetting'
import useWearableStatus, { watchBlocksPhoneStart } from '@/hooks/useWearableStatus'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { buildCo2Table, buildO2Table } from '@/utils/table'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { styled } from 'styled-components/native'


export default function TableScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const { settings } = useSQLContext()
  const subscription = useSubscriptionContext()
  const updateSetting = useUpdateSetting()
  const watchBusy = watchBlocksPhoneStart(useWearableStatus())
  const paddingBottom = useBottomControlInset(true)
  const [tableType, setTableType] = useState<TableType>('co2')
  const rounds = tableType === 'o2' ? buildO2Table(settings) : buildCo2Table(settings)

  const start = () => {
    if (watchBusy) return
    if (subscription.freeLimitReached) {
      router.push('/paywall')
      return
    }
    const o2 = tableType === 'o2'
    router.push({
      pathname: '/train',
      params: {
        type: tableType,
        name: tableTypeLabel(tableType, t),
        hold: String(o2 ? settings.o2HoldStartSeconds : settings.co2HoldSeconds),
        holdStep: String(o2 ? settings.o2HoldStepSeconds : 0),
        restStart: String(o2 ? settings.o2RestSeconds : settings.co2RestStartSeconds),
        restStep: String(o2 ? 0 : settings.co2RestStepSeconds),
        rounds: String(o2 ? settings.o2Rounds : settings.co2Rounds),
      },
    })
  }

  return (
    <WrapperScreen skipBottomInset>
      <ScreenHeader title={t('table.title')} />
      {watchBusy ? (
        <SBanner>
          <SBannerText>{t('table.watchBanner')}</SBannerText>
        </SBanner>
      ) : null}
      <TableTypeSwitch value={tableType} onChange={setTableType} />
      <SCopy>
        {tableTypeTerm(tableType, t) ? (
          <>
            <STerm>{tableTypeTerm(tableType, t)}</STerm>
            {': '}
          </>
        ) : null}
        {tableTypeDescription(tableType, t)}
      </SCopy>
      <SScroll
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingBottom }}
      >
        <SEditor>
          {tableType === 'o2' ? (
            <>
              <SettingsStepper
                label={t('settings.startingHold')}
                mode='duration'
                editable
                value={settings.o2HoldStartSeconds}
                step={15}
                min={15}
                max={900}
                onChange={(value) => { void updateSetting({ o2HoldStartSeconds: value }) }}
              />
              <SettingsStepper
                label={t('settings.holdStep')}
                mode='duration'
                editable
                value={settings.o2HoldStepSeconds}
                step={5}
                min={0}
                max={60}
                onChange={(value) => { void updateSetting({ o2HoldStepSeconds: value }) }}
              />
              <SettingsStepper
                label={t('settings.rest')}
                mode='duration'
                editable
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
          ) : (
            <>
              <SettingsStepper
                label={t('settings.hold')}
                mode='duration'
                editable
                value={settings.co2HoldSeconds}
                step={15}
                min={15}
                max={900}
                onChange={(value) => { void updateSetting({ co2HoldSeconds: value }) }}
              />
              <SettingsStepper
                label={t('settings.startingRest')}
                mode='duration'
                editable
                value={settings.co2RestStartSeconds}
                step={15}
                min={15}
                max={900}
                onChange={(value) => { void updateSetting({ co2RestStartSeconds: value }) }}
              />
              <SettingsStepper
                label={t('settings.restStep')}
                mode='duration'
                editable
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
        </SEditor>
        <SRounds>
          {rounds.map((round, index) => (
            <TableRoundRow
              key={`${tableType}-${round.index}`}
              round={round}
              inCard
              last={index === rounds.length - 1}
            />
          ))}
        </SRounds>
      </SScroll>
      <Footer aboveTabs>
        <Button
          title={t('table.start')}
          disabled={watchBusy}
          onPress={start}
        />
      </Footer>
    </WrapperScreen>
  )
}

const SBanner = styled.View`
  margin: 4px ${Space.screen}px 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background-color: ${Colors.SeafoamMuted};
`

const SBannerText = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.Small};
  font-weight: 600;
  color: ${Colors.Seafoam};
`

const SCopy = styled.Text`
  margin: 4px ${Space.screen}px 0;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const STerm = styled.Text`
  font-family: ${Fonts.BodySemi};
  font-weight: 700;
`

const SScroll = styled.ScrollView`
  flex: 1;
`

const SEditor = styled.View`
  margin: ${Space.md}px ${Space.screen}px 0;
  padding: 0 16px;
  border-radius: ${Radii.Card}px;
  border-width: 1px;
  border-color: ${Colors.Hairline};
  background-color: ${Colors.Card};
  overflow: hidden;
`

const SRounds = styled.View`
  margin: ${Space.md}px ${Space.screen}px 0;
  border-radius: ${Radii.Card}px;
  border-width: 1px;
  border-color: ${Colors.Hairline};
  background-color: ${Colors.Card};
  overflow: hidden;
`
