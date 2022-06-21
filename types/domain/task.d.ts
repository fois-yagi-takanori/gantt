export interface Task {
    id: string;
    name: string;
    planStartDate: string | Date;
    planEndDate: string | Date;
    progress: number;
    plannedStart: string | Date;
    plannedEnd: string | Date;
    dependencies?: string | string[];
    customClass?: string;
    color?: string;
    plannedColor?: string;
    progressColor?: string;
    labelColor?: string;
    resultStartDate?: string | Date;
    resultEndDate?: string | Date;
}