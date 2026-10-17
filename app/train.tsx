import TrainingClock from '@/components/TrainingClock'
import WrapperScreen from '@/components/WrapperScreen'
import { useI18n } from '@/providers/i18n'
import useTrainingClock from '@/hooks/useTrainingClock'
import {
  parseSlot,
  parseTableType,
  parseTrainTable,
  trainTitle,
} from '@/utils/train_route'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect } from 'react'


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
  const title = trainTitle(params.name, tableType, t)
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
        openHold={training.openHold}
        steps={training.steps}
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
        onFinishOpenHold={training.finishOpenHold}
      />
    </WrapperScreen>
  )
}
