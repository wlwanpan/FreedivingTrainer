import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import SettingsChoice from '@/components/SettingsChoice'
import SettingsStepper from '@/components/SettingsStepper'
import { Footer } from '@/design/styled'
import { Colors, FontSizes } from '@/design/styles'
import { MIN_BASELINE_SECONDS } from '@/utils/baseline'
import { useState } from 'react'
import { styled } from 'styled-components/native'


const STEP_SECONDS = 5
const MIN_CONTRACTION_SECONDS = 15
const MAX_HOLD_SECONDS = 900

type Props = {
  initialMaxHoldSeconds: number
  initialContractionSeconds: number | null
  onBack: () => void
  onSubmit: (input: { maxHoldSeconds: number; contractionSeconds: number | null }) => void
}

export default function BaselineManual({
  initialMaxHoldSeconds,
  initialContractionSeconds,
  onBack,
  onSubmit,
}: Props) {
  const [maxHoldSeconds, setMaxHoldSeconds] = useState(
    Math.min(MAX_HOLD_SECONDS, Math.max(MIN_BASELINE_SECONDS, initialMaxHoldSeconds)),
  )
  const [contractionSeconds, setContractionSeconds] = useState<number | null>(
    knownContraction(initialContractionSeconds, initialMaxHoldSeconds),
  )

  const changeMax = (next: number) => {
    setMaxHoldSeconds(next)
    setContractionSeconds((current) => current == null ? null : Math.min(current, next))
  }

  const markKnown = () => {
    setContractionSeconds((current) => {
      if (current != null) return Math.min(current, maxHoldSeconds)
      const half = Math.round((maxHoldSeconds * 0.5) / STEP_SECONDS) * STEP_SECONDS
      return Math.min(maxHoldSeconds, Math.max(MIN_CONTRACTION_SECONDS, half))
    })
  }

  return (
    <Wrapper>
      <HeaderWithBtn headerText='Enter times' leftText='Back' leftOnClick={onBack} />
      <SBody
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        automaticallyAdjustKeyboardInsets
      >
        <SCopy>
          Use a max hold and first contraction you already know. The tables are sized from these two times.
        </SCopy>
        <SettingsStepper
          label='Maximum hold'
          mode='duration'
          editable
          value={maxHoldSeconds}
          min={MIN_BASELINE_SECONDS}
          max={MAX_HOLD_SECONDS}
          step={STEP_SECONDS}
          onChange={changeMax}
        />
        <SSection>First contraction</SSection>
        <SCopy>
          This is the moment the first urge to breathe arrives. Before it, you are in the relaxation phase and the hold still feels easy. After it, you are in the struggle phase. Beginner CO2 tables hold at this time so training stays in the relaxation phase.
        </SCopy>
        <SChoiceRow>
          <SettingsChoice
            label='I know it'
            selected={contractionSeconds != null}
            onPress={markKnown}
          />
          <SettingsChoice
            label='Not sure'
            selected={contractionSeconds == null}
            onPress={() => setContractionSeconds(null)}
          />
        </SChoiceRow>
        {contractionSeconds == null ? (
          <SNote>Without it, beginner tables use half your maximum.</SNote>
        ) : (
          <SettingsStepper
            label='Contraction'
            mode='duration'
            editable
            value={contractionSeconds}
            min={MIN_CONTRACTION_SECONDS}
            max={maxHoldSeconds}
            step={STEP_SECONDS}
            onChange={setContractionSeconds}
          />
        )}
      </SBody>
      <Footer>
        <Button
          title='Use these times'
          onPress={() => onSubmit({ maxHoldSeconds, contractionSeconds })}
        />
      </Footer>
    </Wrapper>
  )
}

function knownContraction(seconds: number | null, maxHoldSeconds: number): number | null {
  if (seconds == null || seconds < MIN_CONTRACTION_SECONDS) return null
  const max = Math.min(MAX_HOLD_SECONDS, Math.max(MIN_BASELINE_SECONDS, maxHoldSeconds))
  return Math.min(max, seconds)
}

const Wrapper = styled.View`
  flex: 1;
`

const SBody = styled.ScrollView`
  flex: 1;
  padding: 8px 20px 0;
`

const SCopy = styled.Text`
  margin-top: 8px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`

const SSection = styled.Text`
  margin-top: 22px;
  font-size: ${FontSizes.Medium};
  font-weight: 700;
  color: ${Colors.Text};
`

const SChoiceRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-top: 12px;
`

const SNote = styled.Text`
  margin-top: 12px;
  font-size: ${FontSizes.Small};
  line-height: 20px;
  color: ${Colors.TextMuted};
`
