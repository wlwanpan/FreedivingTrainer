import { Flex } from '@/design/styled'
import { Colors } from '@/design/styles'
import { ReactNode } from 'react'
import { ActivityIndicator } from 'react-native'


type Props = {
  isLoading: boolean
  children: ReactNode
}

export default function Loader({ isLoading, children }: Props) {
  return isLoading ? (
    <Flex>
      <ActivityIndicator size='large' color={Colors.TealPrimary} />
    </Flex>
  ) : (
    children
  )
}
