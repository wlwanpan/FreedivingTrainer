import TrainingClock from '@/components/TrainingClock'
import WrapperScreen from '@/components/WrapperScreen'
import { TableType, TableTypeLabel, TableTypes } from '@/constants/tables'
import useTrainingClock from '@/hooks/useTrainingClock'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'


function parseTableType(value: string | string[] | undefined): TableType | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw != null && (TableTypes as readonly string[]).includes(raw)) {
    return raw as TableType
  }
  return null
}

export default function TrainScreen() {
  const router = useRouter()
  const { type } = useLocalSearchParams<{ type?: string | string[] }>()
  const tableType = parseTableType(type)
  const training = useTrainingClock(tableType)

  useEffect(() => {
    if (tableType == null || !training.ready) {
      router.back()
    }
  }, [tableType, training.ready, router])

  if (tableType == null || !training.ready) {
    return null
  }

  return (
    <WrapperScreen skipBottomInset>
      <TrainingClock
        title={TableTypeLabel[tableType]}
        kind={training.kind}
        remainingSeconds={training.remainingSeconds}
        roundIndex={training.roundIndex}
        roundCount={training.roundCount}
        nextKind={training.nextKind}
        nextSeconds={training.nextSeconds}
        done={training.done}
        saving={training.saving}
        saved={training.saved}
        saveFailed={training.saveFailed}
        onCancel={() => router.back()}
        onClose={() => router.back()}
        onRetry={training.retry}
      />
    </WrapperScreen>
  )
}
