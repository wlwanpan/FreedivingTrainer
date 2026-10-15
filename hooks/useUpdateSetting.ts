import { SettingInsert } from '@/db/schema'
import { useI18n } from '@/providers/i18n'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'


export default function useUpdateSetting() {
  const sql = useSQLContext()
  const { t } = useI18n()
  const { showWarning } = useWarningModal()

  return async (patch: Partial<SettingInsert>) => {
    const res = await sql.updateSettings({
      ...sql.settings,
      ...patch,
      updatedAt: new Date(),
    })
    if (res.error) {
      showWarning(t('errors.sql'), res.error.message)
    }
  }
}
