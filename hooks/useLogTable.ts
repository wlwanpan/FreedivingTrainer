import { ErrorTitles } from '@/constants/errors'
import { TableType } from '@/constants/tables'
import { useSQLContext } from '@/providers/sql'
import { useSubscriptionContext } from '@/providers/subscription'
import { useWarningModal } from '@/providers/warning_modal'
import { todayDate } from '@/utils/date'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import useTablePlan from './useTablePlan'


export default function useLogTable(tableType: TableType) {
  const sql = useSQLContext()
  const subscription = useSubscriptionContext()
  const { showWarning } = useWarningModal()
  const router = useRouter()
  const rounds = useTablePlan(tableType)
  const [inFlight, setInFlight] = useState(false)

  const logCompletedTable = async () => {
    if (sql.settings.createdAt == null) {
      return
    }
    if (subscription.freeLimitReached) {
      router.push('/paywall')
      return
    }
    const first = rounds[0]
    if (!first) {
      showWarning(ErrorTitles.Input, 'Add at least one round before logging a table.')
      return
    }

    setInFlight(true)
    const now = new Date()
    const res = await sql.insertSession({
      tableType,
      day: todayDate(),
      roundsCompleted: rounds.length,
      roundsPlanned: rounds.length,
      holdSeconds: first.holdSeconds,
      restSeconds: tableType === 'co2' ? sql.settings.co2RestStartSeconds : sql.settings.o2RestSeconds,
      createdAt: now,
      updatedAt: now,
    })
    setInFlight(false)
    if (res.error) {
      showWarning(ErrorTitles.Sql, res.error.message)
    }
  }

  return { rounds, inFlight, logCompletedTable }
}
