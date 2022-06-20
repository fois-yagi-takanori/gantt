import { Task } from './task';
export interface ResolvedTask extends Task {
    invalid?: boolean;
    indexResolved: number;
    endResolved: Date;
    dependencies: string[];
    startResolved: Date;
    plannedStartResolved?: Date;
    plannedEndResolved?: Date;
    hasPlanned: boolean;
    gridRow?: SVGElement;
    [prop: string]: unknown;
}
