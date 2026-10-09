import { useTopControlInset } from '@/design/chrome'
import { Colors } from '@/design/styles'
import { ReactNode, RefObject } from 'react'
import { ScrollView, StyleProp, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { styled } from 'styled-components/native'


type Props = {
  children: ReactNode
  scrollable?: boolean
  skipBottomInset?: boolean
  sheet?: boolean
  style?: StyleProp<ViewStyle>
  scrollViewRef?: RefObject<ScrollView | null>
}

export default function WrapperScreen({
  children,
  style,
  scrollable = false,
  skipBottomInset = false,
  sheet = false,
  scrollViewRef,
}: Props) {
  const insets = useSafeAreaInsets()
  const topPadding = useTopControlInset(sheet)
  const bottomPadding = skipBottomInset ? 0 : insets.bottom

  return scrollable ? (
    <Wrapper style={[style, { paddingTop: topPadding }]}>
      <SScrollable
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        {children}
      </SScrollable>
    </Wrapper>
  ) : (
    <Wrapper style={[style, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
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
