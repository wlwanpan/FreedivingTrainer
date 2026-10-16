import { Colors, Fonts, FontSizes, Radii } from '@/design/styles'
import { styled } from 'styled-components/native'


type Props = {
  level: string
  name: string
}

export default function PlanIdentity({ level, name }: Props) {
  const [phase, focus] = splitLevel(level)
  return (
    <Wrapper>
      {phase || focus ? (
        <SMetaRow>
          {phase ? <SPhase>{phase}</SPhase> : null}
          {focus ? <SFocus>{focus}</SFocus> : null}
        </SMetaRow>
      ) : null}
      <SName>{name}</SName>
    </Wrapper>
  )
}

function splitLevel(level: string): [string | null, string | null] {
  const parts = level.split(' · ')
  if (parts.length < 2) return [level || null, null]
  return [parts[0], parts.slice(1).join(' · ')]
}

const Wrapper = styled.View``

const SMetaRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
`

const SPhase = styled.Text`
  padding: 2px 8px;
  border-radius: ${Radii.Pill}px;
  overflow: hidden;
  font-family: ${Fonts.BodySemi};
  font-size: ${FontSizes.XXSmall};
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: ${Colors.Seafoam};
  background-color: ${Colors.SeafoamMuted};
  border-width: 1px;
  border-color: ${Colors.Hairline};
`

const SFocus = styled.Text`
  font-family: ${Fonts.Body};
  font-size: ${FontSizes.XSmall};
  color: ${Colors.TextMuted};
`

const SName = styled.Text`
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.Large};
  font-weight: 700;
  letter-spacing: -0.4px;
  color: ${Colors.Text};
`
