import Bar from './bar';
import { PopupOptions } from './popup';
import '../src/gantt.scss';
import { ResolvedTask } from '../domain/resolvedTask';
import { Task } from '../domain/task';
import { Options } from '../domain/options';
import { DateInfo } from '../domain/dateInfo';
export declare type ViewMode = 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year';
export default class Gantt {
    private $svg;
    private $columnSvg;
    private $container;
    private $columnContainer;
    private popupWrapper;
    options: Options;
    private tasks;
    private dependencyMap;
    ganttStart: null | Date;
    private ganttEnd;
    private dates;
    barBeingDragged?: string;
    private layers;
    private columnLayers;
    private bars;
    private arrows;
    private popup;
    private sortKey;
    static VIEW_MODE: {
        QUARTER_DAY: 'Quarter Day';
        HALF_DAY: 'Half Day';
        DAY: 'Day';
        WEEK: 'Week';
        MONTH: 'Month';
        YEAR: 'Year';
    };
    constructor(wrapper: string | HTMLElement | SVGElement | unknown, tasks: Task[], options: Options);
    setupWrapper(elementReference: string | HTMLElement | SVGElement | unknown): void;
    setupOptions(options: Options): void;
    setupTasks(tasks: Task[]): void;
    setupDependencies(): void;
    refresh(tasks: Task[]): void;
    changeViewMode(mode?: ViewMode): void;
    updateViewScale(view_mode: ViewMode): void;
    setupDates(): void;
    setupGanttDates(): void;
    setupDateValues(): void;
    bindEvents(): void;
    render(): void;
    setupLayers(): void;
    makeGrid(): void;
    makeGridBackground(): void;
    makeGridRows(): void;
    makeGridHeader(): void;
    makeColumnsGridHeader(): void;
    makeGridTicks(): void;
    makeGridHighlights(): void;
    makeDates(): void;
    getDatesToDraw(): DateInfo[];
    getDateInfo(date: Date, lastDate: Date, i: number): DateInfo;
    makeBars(): void;
    makeArrows(): void;
    mapArrowsOnBars(): void;
    setWidth(): void;
    setScrollPosition(): void;
    bindGridClick(): void;
    bindBarEvents(): void;
    bindBarProgress(): void;
    getAllDependentTasks(task_id: string): string[];
    getSnapPosition(dx: number): number;
    unselectAll(): void;
    viewIs(modes: ViewMode | ViewMode[]): boolean;
    getTask(id: string): ResolvedTask;
    getBar(id: string): Bar;
    showPopup(options: PopupOptions): void;
    hidePopup(): void;
    triggerEvent(event: string, args: unknown): void;
    /**
       * Gets the oldest starting date from the list of tasks
       *
       * @returns Date
       * @memberof Gantt
       */
    getOldestStartingDate(): Date;
    /**
       * Clear all elements from the parent svg element
       *
       * @memberof Gantt
       */
    clear(): void;
    setSortKey(sortFn?: (a: ResolvedTask, b: ResolvedTask) => number): void;
    sortTasks(): void;
}
