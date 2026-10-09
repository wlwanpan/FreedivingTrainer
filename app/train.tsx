import TrainingClock from '@/components/TrainingClock'
import WrapperScreen from '@/components/WrapperScreen'
import { TableType, TableTypeLabel, TableTypes } from '@/constants/tables'
import useTrainingClock, { TrainTable } from '@/hooks/useTrainingClock'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'


function parseTableType(value: string | string[] | undefined): TableType | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw != null && (TableTypes as readonly string[]).includes(raw)) {
    return raw as TableType
  }
  return null
}

function parseCount(value: string | string[] | undefined, allowZero: boolean): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw == null || raw === '') return null
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 0 || (!allowZero && parsed === 0)) return null
  return parsed
}

function parseTrainTable(params: {
  hold?: string | string[]
  restStart?: string | string[]
  restStep?: string | string[]
  rounds?: string | string[]
}): TrainTable | null {
  const holdSeconds = parseCount(params.hold, false)
  const restStartSeconds = parseCount(params.restStart, true)
  const restStepSeconds = parseCount(params.restStep, true)
  const rounds = parseCount(params.rounds, false)
  if (holdSeconds == null || restStartSeconds == null || restStepSeconds == null || rounds == null) {
    return null
  }
  return { holdSeconds, restStartSeconds, restStepSeconds, rounds }
}

export default function TrainScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    type?: string | string[]
    hold?: string | string[]
    restStart?: string | string[]
    restStep?: string | string[]
    rounds?: string | string[]
  }>()
  const tableType = parseTableType(params.type)
  const training = useTrainingClock(tableType, parseTrainTable(params))

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
        previous={training.previous}
        current={training.current}
        next={training.next}
        remainingSeconds={training.remainingSeconds}
        roundCount={training.roundCount}
        paused={training.paused}
        done={training.done}
        saving={training.saving}
        saved={training.saved}
        saveFailed={training.saveFailed}
        onCancel={() => router.back()}
        onClose={() => router.back()}
        onRetry={training.retry}
        onTogglePause={training.togglePause}
      />
    </WrapperScreen>
  )
}
