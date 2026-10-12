export const TableTypes = ['co2', 'o2', 'one-breath', 'walk'] as const

export const ManualTableTypes = ['co2', 'o2'] as const

export type TableType = (typeof TableTypes)[number]

export const TableTypeLabel: Record<TableType, string> = {
  co2: 'CO2',
  o2: 'O2',
  'one-breath': 'One breath',
  walk: 'Dry walk',
}

export const TableTypeDescription: Record<TableType, string> = {
  co2: 'Hold stays fixed. Rest gets shorter.',
  o2: 'Hold gets longer. Rest stays fixed.',
  'one-breath': 'Hold stays short. Rest is one breath.',
  walk: 'Walk during each hold. Recover standing still.',
}
