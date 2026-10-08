import { formatDay as formatDayValue } from '@/utils/date'
import { formatDuration } from '@/utils/duration'
import { createContext, ReactNode, useCallback, useContext } from 'react'
import { useSQLContext } from './sql'


export interface IFormatter {
  formatDay: (day: string) => string
  formatSeconds: (seconds: number) => string
}

export const FormatterContext = createContext<IFormatter | null>(null)

export const useFormatterContext = () => {
  const context = useContext(FormatterContext)
  if (!context) {
    throw new Error('IFormatter is not provided to component')
  }
  return context
}

type Props = {
  children: ReactNode
}

export default function FormatterContextProvider({ children }: Props) {
  const { settings } = useSQLContext()

  const formatDay = useCallback((day: string) => {
    return formatDayValue(day, settings.dateFormat)
  }, [settings.dateFormat])

  const formatSeconds = useCallback((seconds: number) => {
    return formatDuration(seconds)
  }, [])

  return (
    <FormatterContext.Provider value={{ formatDay, formatSeconds }}>
      {children}
    </FormatterContext.Provider>
  )
}
