import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import TableRoundRow from '@/components/TableRoundRow'
import WrapperScreen from '@/components/WrapperScreen'
import { ErrorTitles } from '@/constants/errors'
import { Footer } from '@/design/styled'
import { Colors, Fonts, FontSizes, Radii, Space } from '@/design/styles'
import useWearableStatus, { watchBlocksPhoneStart } from '@/hooks/useWearableStatus'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { sessionOutline } from '@/utils/training_plan'
import {
  parseLabel,
  parseSlot,
  parseTableType,
  parseTrainTable,
  trainTitle,
} from '@/utils/train_route'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect } from 'react'
import { styled } from 'styled-components/native'


export default function PrepareScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    type?: string | string[]
    name?: string | string[]
    hold?: string | string[]
    holdStep?: string | string[]
    restStart?: string | string[]
    restStep?: string | string[]
    rounds?: string | string[]
    week?: string | string[]
    session?: string | string[]
    note?: string | string[]
  }>()
  const { settings } = useSQLContext()
  const subscription = useSubscriptionContext()
  const { showWarning } = useWarningModal()
  const { formatSeconds } = useFormatterContext()
  const watchBusy = watchBlocksPhoneStart(useWearableStatus())
  const tableType = parseTableType(params.type)
  const table = parseTrainTable(params)
  const title = trainTitle(params.name, tableType)
  const note = parseLabel(params.note)
  const slot = parseSlot(params)
  const outline = tableType == null || table == null
    ? null
    : sessionOutline({ tableType, ...table }, settings.breatheUpSeconds)
  const ready = outline != null && outline.rounds.length > 0

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/training')
  }, [router])

  useEffect(() => {
    if (!ready) {
      leave()
    }
  }, [leave, ready])

  const start = () => {
    if (watchBusy || outline == null) return
    if (subscription.freeLimitReached) {
      router.push('/paywall')
      return
    }
    if (outline.rounds.length === 0) {
      showWarning(ErrorTitles.Input, 'Add at least one round before training.')
      return
    }
    router.push({
      pathname: '/train',
      params: {
        type: tableType,
        name: title,
        hold: String(table?.holdSeconds ?? ''),
        holdStep: String(table?.holdStepSeconds ?? 0),
        restStart: String(table?.restStartSeconds ?? ''),
        restStep: String(table?.restStepSeconds ?? 0),
        rounds: String(table?.rounds ?? ''),
        ...(slot == null ? {} : {
          week: String(slot.week),
          session: String(slot.index),
        }),
      },
    })
  }

  if (outline == null || outline.rounds.length === 0) {
    return null
  }

  return (
    <WrapperScreen skipBottomInset>
      <HeaderWithBtn headerText={title} leftText='Back' leftOnClick={leave} />
      {watchBusy ? (
        <SBanner>
          <SBannerText>Table started on Apple Watch</SBannerText>
        </SBanner>
      ) : null}
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Space.md }}
      >
        <SMeta
          accessibilityLabel={`${formatSeconds(outline.totalSeconds)} total session duration. ${outline.stepCount} total steps.`}
        >
          <STile>
            <SValue style={{ fontVariant: ['tabular-nums'] }}>
              {formatSeconds(outline.totalSeconds)}
            </SValue>
            <SLabel>Total session duration</SLabel>
          </STile>
          <STile>
            <SValue>{outline.stepCount}</SValue>
            <SLabel>Total steps</SLabel>
          </STile>
        </SMeta>
        {note == null ? null : <SNote>{note}</SNote>}
        <SRounds>
          {outline.rounds.map((round, index) => (
            <TableRoundRow
              key={round.index}
              round={round}
              inCard
              last={index === outline.rounds.length - 1}
            />
          ))}
        </SRounds>
      </SScroll>
      <Footer>
        <Button
          title={watchBusy ? 'On Watch' : 'Start'}
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

const SScroll = styled.ScrollView`
  flex: 1;
`

const SMeta = styled.View`
  flex-direction: row;
  gap: ${Space.sm}px;
  margin: ${Space.md}px ${Space.screen}px 0;
  padding: 12px;
  border-radius: ${Radii.Card}px;
  background-color: ${Colors.Card};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const STile = styled.View`
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px;
  background-color: ${Colors.Telemetry};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SValue = styled.Text`
  font-family: ${Fonts.HeadlineSemi};
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.Text};
`

const SLabel = styled.Text`
  margin-top: 4px;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`

const SNote = styled.Text`
  margin: ${Space.sm}px ${Space.screen}px 0;
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const SRounds = styled.View`
  margin: ${Space.md}px ${Space.screen}px 0;
  border-radius: ${Radii.Card}px;
  border-width: 1px;
  border-color: ${Colors.Hairline};
  background-color: ${Colors.Card};
  overflow: hidden;
`
