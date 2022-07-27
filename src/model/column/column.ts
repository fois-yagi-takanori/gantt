import { CreateSVGAttrs } from './../../utils/svg.utils';

export interface Column {
  columnType: ColumnType,
  label: string,
  fieldName: string,
  attributes: CreateSVGAttrs
}

export type ColumnType = 'label' | 'select' | 'text' | 'calendar'