import TrainingClock from '@/components/TrainingClock'
import WrapperScreen from '@/components/WrapperScreen'
import { TableType, TableTypes } from '@/constants/tables'
import { tableTypeLabel } from '@/i18n/labels'
import { useI18n } from '@/providers/i18n'
import useTrainingClock, { TrainPlanSlot, TrainTable } from '@/hooks/useTrainingClock'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect } from 'react'


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

function parseLabel(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  const label = raw?.trim() ?? ''
  return label === '' ? null : label
}

function parseSlot(params: {
  week?: string | string[]
  session?: string | string[]
}): TrainPlanSlot | null {
  const week = parseCount(params.week, false)
  const index = parseCount(params.session, false)
  if (week == null || index == null) return null
  return { week, index }
}

function parseTrainTable(params: {
  hold?: string | string[]
  holdStep?: string | string[]
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
  return {
    holdSeconds,
    holdStepSeconds: parseCount(params.holdStep, true) ?? 0,
    restStartSeconds,
    restStepSeconds,
    rounds,
  }
}

export default function TrainScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const params = useLocalSearchParams<{
    type?: string | string[]
    name?: string | string[]
    hold?: string | string[]
    holdStep?: string | string[]
    restStart?: string | string[]
    restStep?: string | string[]
    rounds?: string | string[]
    week?: string | string[]
    session?: string | string[]
  }>()
  const tableType = parseTableType(params.type)
  const title = parseLabel(params.name) ?? (tableType == null ? '' : tableTypeLabel(tableType, t))
  const training = useTrainingClock(tableType, parseTrainTable(params), parseSlot(params), title)

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/')
  }, [router])

  useEffect(() => {
    if (tableType == null || !training.ready) {
      leave()
    }
  }, [leave, tableType, training.ready])

  if (tableType == null || !training.ready) {
    return null
  }

  return (
    <WrapperScreen skipBottomInset>
      <TrainingClock
        title={title}
        previous={training.previous}
        current={training.current}
        next={training.next}
        remainingSeconds={training.remainingSeconds}
        elapsedTotalSeconds={training.elapsedTotalSeconds}
        totalSeconds={training.totalSeconds}
        stepCount={training.stepCount}
        roundCount={training.roundCount}
        heartRateBpm={training.heartRateBpm}
        paused={training.paused}
        done={training.done}
        saving={training.saving}
        saved={training.saved}
        saveFailed={training.saveFailed}
        contractions={training.contractions}
        onCancel={leave}
        onClose={leave}
        onRetry={training.retry}
        onTogglePause={training.togglePause}
        onRememberTap={training.rememberTap}
        onLogContraction={training.logContraction}
      />
    </WrapperScreen>
  )
}
