import HeaderWithBtn from '@/components/HeaderWithBtn'
import WrapperScreen from '@/components/WrapperScreen'
import { Colors, FontSizes } from '@/design/styles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { styled } from 'styled-components/native'


export default function SettingsScreen() {
  const router = useRouter()

  return (
    <WrapperScreen>
      <HeaderWithBtn
        headerText='Settings'
        leftText='Back'
        leftOnClick={() => router.back()}
      />
      <SBody>
        <SRow onPress={() => router.push('/settings/training')}>
          <SRowLabel>Training settings</SRowLabel>
          <Ionicons name='chevron-forward' size={18} color={Colors.GreyPrimary} />
        </SRow>
        <SRow onPress={() => router.push('/settings/system')}>
          <SRowLabel>System settings</SRowLabel>
          <Ionicons name='chevron-forward' size={18} color={Colors.GreyPrimary} />
        </SRow>
        <SRow onPress={() => router.push('/settings/purchases')}>
          <SRowLabel>Purchases</SRowLabel>
          <Ionicons name='chevron-forward' size={18} color={Colors.GreyPrimary} />
        </SRow>
      </SBody>
    </WrapperScreen>
  )
}

const SBody = styled.View`
  padding: 8px 0 32px;
`

const SRow = styled.Pressable`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: ${Colors.GreyDivider};
`

const SRowLabel = styled.Text`
  font-size: ${FontSizes.Medium};
  font-weight: 600;
  color: ${Colors.DeepPrimary};
`
