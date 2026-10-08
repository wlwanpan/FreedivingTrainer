export const TableTypes = ['co2', 'o2'] as const

export type TableType = (typeof TableTypes)[number]

export const TableTypeLabel: Record<TableType, string> = {
  co2: 'CO2',
  o2: 'O2',
}

export const TableTypeDescription: Record<TableType, string> = {
  co2: 'Hold stays fixed. Rest gets shorter.',
  o2: 'Hold gets longer. Rest stays fixed.',
}
