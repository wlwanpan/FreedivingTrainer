import { ErrorTitles } from '@/constants/errors'
import { SettingInsert } from '@/db/schema'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'


export default function useUpdateSetting() {
  const sql = useSQLContext()
  const { showWarning } = useWarningModal()

  return async (patch: Partial<SettingInsert>) => {
    const res = await sql.updateSettings({
      ...sql.settings,
      ...patch,
      updatedAt: new Date(),
    })
    if (res.error) {
      showWarning(ErrorTitles.Sql, res.error.message)
    }
  }
}
