import { Column } from './column';
import { Language } from '../utils/date.utils';
import { ResolvedTask } from './resolvedTask';
import { ViewMode } from '..';

export interface Options {
  headerHeight?: number,
  columnWidth?: number,
  step?: number,
  viewModes?: ViewMode[],
  barHeight?: number,
  barCornerRadius?: number,
  arrowCurve?: number,
  padding?: number,
  viewMode?: ViewMode,
  dateFormat?: string,
  customPopupHtml?: string | null,
  language?: Language,
  columns: Column[],
  columnWidthForColumns?: number,
  groupKey?: string,
  onClick?: (task: ResolvedTask) => void,
  onDateChange?: (task: ResolvedTask, startDate: Date, endDate: Date) => void,
  onProgressChange?: (task: ResolvedTask, progress: number) => void,
  onViewChange?: (mode: ViewMode) => void,
}
