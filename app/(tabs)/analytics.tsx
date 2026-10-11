import AnalyticsOverview from '@/components/AnalyticsOverview'
import HoldHistoryChart from '@/components/HoldHistoryChart'
import ScreenHeader from '@/components/ScreenHeader'
import WrapperScreen from '@/components/WrapperScreen'


export default function AnalyticsScreen() {
  return (
    <WrapperScreen skipBottomInset>
      <ScreenHeader title='Analytics' />
      <AnalyticsOverview />
      <HoldHistoryChart />
    </WrapperScreen>
  )
}
