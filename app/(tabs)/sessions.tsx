import EmptyListPlaceholder from '@/components/EmptyListPlaceholder'
import ScreenHeader from '@/components/ScreenHeader'
import SessionListItem from '@/components/SessionListItem'
import WrapperScreen from '@/components/WrapperScreen'
import FreeSessionsBanner from '@/components/FreeSessionsBanner'
import { ErrorTitles } from '@/constants/errors'
import { Session } from '@/db/schema'
import { useSQLContext } from '@/providers/sql'
import { useWarningModal } from '@/providers/warning_modal'
import { useBottomControlInset } from '@/design/chrome'
import { styled } from 'styled-components/native'


export default function SessionsScreen() {
  const { sessions, deleteSession } = useSQLContext()
  const { showConfirmDeletion, showWarning } = useWarningModal()
  const bottomInset = useBottomControlInset(true)

  const remove = async (session: Session) => {
    const confirmed = await showConfirmDeletion(
      'Delete this table?',
      'This removes the logged session from this device.',
    )
    if (!confirmed) return
    const res = await deleteSession(session.id)
    if (res.error) {
      showWarning(ErrorTitles.Sql, res.error.message)
    }
  }

  return (
    <WrapperScreen skipBottomInset>
      <ScreenHeader title='Sessions' />
      <FreeSessionsBanner />
      <SList contentContainerStyle={{ paddingBottom: bottomInset }}>
        {sessions.length === 0 ? (
          <EmptyListPlaceholder message='No tables logged yet.' />
        ) : (
          sessions.map((session) => (
            <SessionListItem
              key={session.id}
              session={session}
              onDelete={() => { void remove(session) }}
            />
          ))
        )}
      </SList>
    </WrapperScreen>
  )
}

const SList = styled.ScrollView`
  flex: 1;
  margin-top: 8px;
`
