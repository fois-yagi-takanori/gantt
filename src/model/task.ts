export interface Task {
  id: string,
  name: string,
  planStartDate: string | Date,
  planEndDate: string | Date,
  progress: number,
  dependencies?: string | string[],
  customClass?: string,
  resultBarColor?: string,
  planColor?: string,
  progressColor?: string,
  labelColor?: string,
  resultStartDate?: string | Date,
  resultEndDate?: string | Date
}
