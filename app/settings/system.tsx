import Button from '@/components/Button'
import HeaderWithBtn from '@/components/HeaderWithBtn'
import SettingsChoice from '@/components/SettingsChoice'
import WrapperScreen from '@/components/WrapperScreen'
import { DateFormats } from '@/constants/dates'
import { ErrorTitles } from '@/constants/errors'
import { Colors, FontSizes } from '@/design/styles'
import useUpdateSetting from '@/hooks/useUpdateSetting'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { styled } from 'styled-components/native'


export default function SystemSettingsScreen() {
  const router = useRouter()
  const { settings, eraseAllData } = useSQLContext()
  const { showWarning, showConfirmDeletion } = useWarningModal()
  const updateSetting = useUpdateSetting()
  const [eraseInFlight, setEraseInFlight] = useState(false)

  useEffect(() => {
    if (!eraseInFlight || settings.createdAt != null) return
    router.replace('/onboarding')
  }, [eraseInFlight, settings.createdAt, router])

  const erase = async () => {
    const confirmed = await showConfirmDeletion(
      'Erase all data?',
      'This removes your tables, logged sessions, and baseline from this device. The app will open as a new install. A lifetime purchase stays with your Apple ID.',
    )
    if (!confirmed) return

    setEraseInFlight(true)
    const res = await eraseAllData()
    if (res.error) {
      setEraseInFlight(false)
      showWarning(ErrorTitles.Sql, res.error.message)
    }
  }

  return (
    <WrapperScreen scrollable>
      <HeaderWithBtn
        headerText='System settings'
        leftText='Back'
        leftOnClick={() => router.back()}
      />
      <SBody>
        <SSection>Date</SSection>
        <SChoiceRow>
          {DateFormats.map((format) => (
            <SettingsChoice
              key={format}
              label={format === 'YYYY-MM-DD' ? '2026-10-08' : 'Oct 8, 2026'}
              selected={settings.dateFormat === format}
              onPress={() => { void updateSetting({ dateFormat: format }) }}
            />
          ))}
        </SChoiceRow>

        <SSection>Data</SSection>
        <SNote>
          Removes your tables, logged sessions, and baseline from this device.
        </SNote>
        <Button
          title='Erase all data'
          onPress={() => { void erase() }}
          loading={eraseInFlight}
          defaultBGColor={Colors.RedPrimary}
          pressedBGColor={Colors.RedBackground}
        />
      </SBody>
    </WrapperScreen>
  )
}

const SBody = styled.View`
  padding: 8px 20px 32px;
`

const SSection = styled.Text`
  margin-top: 22px;
  margin-bottom: 4px;
  font-size: ${FontSizes.Small};
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${Colors.GreyPrimary};
`

const SNote = styled.Text`
  margin-top: 8px;
  margin-bottom: 12px;
  font-size: ${FontSizes.Medium};
  line-height: 22px;
  color: ${Colors.DeepPrimary};
`

const SChoiceRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-top: 8px;
`
