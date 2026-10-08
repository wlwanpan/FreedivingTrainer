import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import { styled } from 'styled-components/native'


type Props = {
  onStart: () => void
  onBack: () => void
}

export default function BaselinePrep({ onStart, onBack }: Props) {
  return (
    <Wrapper>
      <HeaderWithBtn headerText='Baseline' leftText='Back' leftOnClick={onBack} />
      <SBody>
        <STitle>One maximum hold</STitle>
        <SCopy>
          Sit or lie down. Breathe calmly, take one full inhale, then start. Leave the screen on. This is a dry static.
        </SCopy>
        <SWarning>Stay out of the water. Stop if you feel unwell.</SWarning>
        <SCard>
          <SCardTitle>First contraction</SCardTitle>
          <SCardCopy>
            Tap when the first urge to breathe arrives. That is usually a contraction in the diaphragm.
          </SCardCopy>
        </SCard>
        <SCard>
          <SCardTitle>Then keep holding</SCardTitle>
          <SCardCopy>
            Continue until you must breathe. That total time is the maximum the tables are built from.
          </SCardCopy>
        </SCard>
      </SBody>
      <Footer>
        <Button title='Start hold' onPress={onStart} />
      </Footer>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex: 1;
`

const SBody = styled.View`
  flex: 1;
  padding: 8px 24px 0;
`

const STitle = styled.Text`
  font-size: ${FontSizes.XLarge};
  font-weight: 800;
  color: ${Colors.DeepPrimary};
`

const SCopy = styled.Text`
  margin-top: 12px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.GreyPrimary};
`

const SWarning = styled.Text`
  margin-top: 12px;
  margin-bottom: 20px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  font-weight: 600;
  color: ${Colors.CoralPrimary};
`

const SCard = styled.View`
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 14px;
  background-color: ${Colors.TealBackground};
`

const SCardTitle = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  color: ${Colors.DeepPrimary};
`

const SCardCopy = styled.Text`
  margin-top: 4px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.GreyPrimary};
`
