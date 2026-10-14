import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import { Footer } from '@/design/styled'
import { Colors, Fonts, FontSizes } from '@/design/styles'
import { formatDuration } from '@/utils/duration'
import { styled } from 'styled-components/native'


type Props = {
  elapsedSeconds: number
  contractionSeconds: number | null
  controlsReady: boolean
  onContraction: () => void
  onFinish: () => void
  onCancel: () => void
}

export default function BaselineTimer({
  elapsedSeconds,
  contractionSeconds,
  controlsReady,
  onContraction,
  onFinish,
  onCancel,
}: Props) {
  const marked = contractionSeconds != null

  return (
    <Wrapper>
      <HeaderWithBtn headerText='Hold' leftText='Cancel' leftOnClick={onCancel} />
      <SClock>
        <STime
          style={{ fontVariant: ['tabular-nums'] }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatDuration(elapsedSeconds)}
        </STime>
        <SStatus>
          {marked
            ? `Contraction at ${formatDuration(contractionSeconds)}. Hold until you need to breathe.`
            : 'Tap the first button at the first contraction.'}
        </SStatus>
      </SClock>
      <Footer>
        <Button
          title={marked ? 'Undo contraction' : 'First contraction'}
          onPress={onContraction}
          disabled={!controlsReady}
          variant={marked ? 'muted' : 'primary'}
        />
        <Button
          title='I need to breathe'
          onPress={onFinish}
          disabled={!controlsReady}
          variant='danger'
        />
      </Footer>
    </Wrapper>
  )
}

const Wrapper = styled.View`
  flex: 1;
`

const SClock = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const STime = styled.Text`
  width: 100%;
  font-family: ${Fonts.Headline};
  font-size: ${FontSizes.Timer};
  font-weight: 700;
  letter-spacing: -1.4px;
  color: ${Colors.Seafoam};
  text-align: center;
`

const SStatus = styled.Text`
  margin-top: 16px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  text-align: center;
  color: ${Colors.TextMuted};
`

