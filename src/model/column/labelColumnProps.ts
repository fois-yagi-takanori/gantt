import { Column } from './column';

export interface LabelColumnProps extends Column {
  onClick?: () => void
}

