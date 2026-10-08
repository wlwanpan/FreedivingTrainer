import { TableType } from '@/constants/tables'
import { useSQLContext } from '@/providers/sql'
import { buildCo2Table, buildO2Table, TableRound } from '@/utils/table'
import { useMemo } from 'react'


export default function useTablePlan(tableType: TableType): TableRound[] {
  const { settings } = useSQLContext()

  return useMemo(() => (
    tableType === 'co2' ? buildCo2Table(settings) : buildO2Table(settings)
  ), [tableType, settings])
}
