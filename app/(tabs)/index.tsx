import FreeSessionsBanner from '@/components/FreeSessionsBanner'
import ScreenHeader from '@/components/ScreenHeader'
import TableRoundRow from '@/components/TableRoundRow'
import TableTypeSwitch from '@/components/TableTypeSwitch'
import WrapperScreen from '@/components/WrapperScreen'
import { TableType, TableTypeDescription } from '@/constants/tables'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import useLogTable from '@/hooks/useLogTable'
import { useFormatterContext } from '@/providers/formatter'
import { useSQLContext } from '@/providers/sql'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { styled } from 'styled-components/native'
import Button from '@/components/Button'


export default function TablesScreen() {
  const router = useRouter()
  const { settings } = useSQLContext()
  const { formatSeconds } = useFormatterContext()
  const [tableType, setTableType] = useState<TableType>('co2')
  const { rounds, inFlight, logCompletedTable } = useLogTable(tableType)

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
      <SRounds>
        {rounds.map((round) => (
          <TableRoundRow key={round.index} round={round} />
        ))}
      </SRounds>
      <Footer>
        <Button
          title='Log completed table'
          onPress={() => { void logCompletedTable() }}
          loading={inFlight}
        />
      </Footer>
    </WrapperScreen>
  )
}

const SIconButton = styled.Pressable`
  padding: 4px;
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
