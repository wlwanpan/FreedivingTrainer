import { useKeepAwake } from 'expo-keep-awake'


const TrainingKeepAwakeTag = 'training'

export default function TrainingKeepAwake() {
  useKeepAwake(TrainingKeepAwakeTag)
  return null
}
