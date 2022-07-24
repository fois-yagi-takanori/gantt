import { Task } from './task';
export interface ResolvedTask extends Task {
    invalid?: boolean;
    indexResolved: number;
    resultEndResolved: Date;
    dependencies: string[];
    resultStartResolved: Date;
    plannedStartResolved?: Date;
    plannedEndResolved?: Date;
    planGridRow?: SVGElement;
    resultGridRow?: SVGElement;
    [prop: string]: unknown;
}
