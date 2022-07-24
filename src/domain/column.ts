
export interface Column {
  columnType: ColumnType,
  label: string,
  fieldName: string
}

export type ColumnType = 'label' | 'select' | 'text' | 'calendar'