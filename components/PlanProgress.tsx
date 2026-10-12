import { Colors, FontSizes } from '@/design/styles'
import { TrainingOutline } from '@/hooks/useTrainingOutline'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ReactNode } from 'react'
import { styled } from 'styled-components/native'


type Props = {
  outline: TrainingOutline
  onRetest: () => void
  onPress?: () => void
  children?: ReactNode
}

export default function PlanProgress({ outline, onRetest, onPress, children }: Props) {
  const overview = (
    <>
      <SHeader>
        <SHeaderText>
          <SPlanName>{outline.planName}</SPlanName>
          <SLevel>{outline.level}</SLevel>
        </SHeaderText>
        {onPress ? (
          <Ionicons name='chevron-forward' size={22} color={Colors.TealPrimary} />
        ) : null}
      </SHeader>
      <SWeekLine>
        {`Week ${outline.week} of ${outline.weeks}`}
      </SWeekLine>
      <STrack>
        <SFill style={{ width: `${Math.round(outline.progress * 100)}%` }} />
      </STrack>
      <SPercent>{`${Math.round(outline.progress * 100)}% of the plan`}</SPercent>
      <SFrequency>{outline.frequency}</SFrequency>
    </>
  )

  return (
    <Wrapper>
      {onPress ? (
        <SPress onPress={onPress}>{overview}</SPress>
      ) : overview}
      {outline.retestDue ? (
        <SLink onPress={onRetest}>
          Retake your baseline this week so the intervals can move.
        </SLink>
      ) : null}
      {children}
    </Wrapper>
  )
}

const Wrapper = styled.View`
  margin: 8px 20px 0;
  padding: 16px;
  border-radius: 16px;
  background-color: ${Colors.TealBackground};
`

const SPress = styled.Pressable``

const SHeader = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`

const SHeaderText = styled.View`
  flex: 1;
`

const SPlanName = styled.Text`
  font-size: ${FontSizes.Large};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SLevel = styled.Text`
  margin-top: 2px;
  font-size: ${FontSizes.Small};
  color: ${Colors.GreyPrimary};
`

const SWeekLine = styled.Text`
  margin-top: 12px;
  font-size: ${FontSizes.Medium};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const STrack = styled.View`
  height: 8px;
  margin-top: 8px;
  border-radius: 4px;
  background-color: ${Colors.White};
  overflow: hidden;
`

const SFill = styled.View`
  height: 8px;
  border-radius: 4px;
  background-color: ${Colors.TealPrimary};
`

const SPercent = styled.Text`
  margin-top: 6px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  color: ${Colors.TealPrimary};
`

const SFrequency = styled.Text`
  margin-top: 8px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.GreyPrimary};
`

const SLink = styled.Text`
  margin-top: 8px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  line-height: 20px;
  color: ${Colors.TealPrimary};
`
