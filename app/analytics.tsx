import AnalyticsOverview from '@/components/AnalyticsOverview'
import EmptyListPlaceholder from '@/components/EmptyListPlaceholder'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import HeartRateChart from '@/components/HeartRateChart'
import HoldHistoryChart from '@/components/HoldHistoryChart'
import SessionListItem from '@/components/SessionListItem'
import WrapperScreen from '@/components/WrapperScreen'
import { useBottomControlInset } from '@/design/chrome'
import { Colors, Fonts, FontSizes, Space } from '@/design/styles'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { useRouter } from 'expo-router'
import { styled } from 'styled-components/native'


export default function AnalyticsScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const { sessions } = useSQLContext()
  const paddingBottom = useBottomControlInset(false)
  const listed = [...sessions].sort((a, b) => {
    const byTime = b.createdAt.getTime() - a.createdAt.getTime()
    if (byTime !== 0) return byTime
    return b.id - a.id
  })

  return (
    <WrapperScreen skipBottomInset>
      <HeaderWithBtn headerText={t('analytics.title')} leftBack leftOnClick={() => router.back()} />
      <SScroll
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom }}
      >
        <AnalyticsOverview />
        <HoldHistoryChart />
        <HeartRateChart />
        <SSection>{t('analytics.sessions')}</SSection>
        {listed.length === 0 ? (
          <EmptyListPlaceholder message={t('analytics.empty')} card />
        ) : (
          listed.map((session) => (
            <SessionListItem key={session.id} session={session} />
          ))
        )}
      </SScroll>
    </WrapperScreen>
  )
}

const SScroll = styled.ScrollView`
  flex: 1;
`

const SSection = styled.Text`
  margin: 22px ${Space.screen}px 8px;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XSmall};
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${Colors.TextMuted};
`
