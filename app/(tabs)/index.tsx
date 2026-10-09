import Button from '@/components/Button'
import FreeSessionsBanner from '@/components/FreeSessionsBanner'
import ScreenHeader from '@/components/ScreenHeader'
import TableRoundRow from '@/components/TableRoundRow'
import TableTypeSwitch from '@/components/TableTypeSwitch'
import WrapperScreen from '@/components/WrapperScreen'
import { ErrorTitles } from '@/constants/errors'
import { TableType, TableTypeDescription } from '@/constants/tables'
import { Footer } from '@/design/styled'
import { Colors, FontSizes, Layout } from '@/design/styles'
import useTablePlan from '@/hooks/useTablePlan'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { styled } from 'styled-components/native'


export default function TablesScreen() {
  const router = useRouter()
  const { settings } = useSQLContext()
  const subscription = useSubscriptionContext()
  const { showWarning } = useWarningModal()
  const { formatSeconds } = useFormatterContext()
  const [tableType, setTableType] = useState<TableType>('co2')
  const rounds = useTablePlan(tableType)

  const startTraining = () => {
    if (subscription.freeLimitReached) {
      router.push('/paywall')
      return
    }
    if (rounds.length === 0) {
      showWarning(ErrorTitles.Input, 'Add at least one round before training.')
      return
    }
    router.push({ pathname: '/train', params: { type: tableType } })
  }

  return (
    <WrapperScreen skipBottomInset>
      <ScreenHeader
        title='Tables'
        right={(
          <SIconButton onPress={() => router.push('/settings')}>
            <Ionicons name='settings-outline' size={24} color={Colors.TealPrimary} />
          </SIconButton>
        )}
      />
      <FreeSessionsBanner />
      <TableTypeSwitch value={tableType} onChange={setTableType} />
      <SHint>{TableTypeDescription[tableType]}</SHint>
      <SHint>Breathe-up {formatSeconds(settings.breatheUpSeconds)}</SHint>
      {settings.baselineMaxHoldSeconds != null ? (
        <SHint>Baseline max {formatSeconds(settings.baselineMaxHoldSeconds)}</SHint>
      ) : null}
      <SRounds>
        {rounds.map((round) => (
          <TableRoundRow key={round.index} round={round} />
        ))}
      </SRounds>
      <Footer aboveTabs>
        <Button
          title='Start Training'
          onPress={startTraining}
        />
      </Footer>
    </WrapperScreen>
  )
}

const SIconButton = styled.Pressable`
  width: ${Layout.MinControl}px;
  height: ${Layout.MinControl}px;
  align-items: center;
  justify-content: center;
`

const SHint = styled.Text`
  margin: 4px 20px 0;
  font-size: ${FontSizes.Small};
  color: ${Colors.GreyPrimary};
`

const SRounds = styled.ScrollView`
  flex: 1;
  margin-top: 12px;
`
