import { Colors } from '@/design/styles'
import { ReactNode, RefObject } from 'react'
import { ScrollView, StyleProp, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { styled } from 'styled-components/native'


type Props = {
  children: ReactNode
  scrollable?: boolean
  skipBottomInset?: boolean
  style?: StyleProp<ViewStyle>
  scrollViewRef?: RefObject<ScrollView | null>
}

export default function WrapperScreen({
  children,
  style,
  scrollable = false,
  skipBottomInset = false,
  scrollViewRef,
}: Props) {
  const insets = useSafeAreaInsets()
  const bottomPadding = skipBottomInset ? 0 : insets.bottom

  return scrollable ? (
    <Wrapper style={[style, { paddingTop: insets.top }]}>
      <SScrollable
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        {children}
      </SScrollable>
    </Wrapper>
  ) : (
    <Wrapper style={[style, { paddingTop: insets.top, paddingBottom: bottomPadding }]}>
      {children}
    </Wrapper>
  )
}

const SScrollable = styled(ScrollView)`
  flex: 1;
`

const Wrapper = styled.View`
  flex: 1;
  background-color: ${Colors.White};
`
