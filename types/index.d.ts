import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../src/gantt.scss';
import { DateInfo } from './domain/dateInfo';
import { Options } from './domain/options';
import { ResolvedTask } from './domain/resolvedTask';
import { Task } from './domain/task';
import Bar from './app/bar';
import { PopupOptions } from './app/popup';
export declare type ViewMode = 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year';
/**
 *
 */
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
    /**
     * コンストラクタ
     *
     * @param {(string | HTMLElement | SVGElement | unknown)} wrapper - ラッパー
     * @param {Task[]} tasks - タスク一覧
     * @param {Options} options - オプション
     * @memberof Gantt
     */
    constructor(wrapper: string | HTMLElement | SVGElement | unknown, tasks: Task[], options: Options);
    /**
     * 大枠作成
     *
     * @param {(string | HTMLElement | SVGElement | unknown)} elementReference
     * @memberof Gantt
     */
    setupWrapper(elementReference: string | HTMLElement | SVGElement | unknown): void;
    /**
     *
     * @param options
     */
    setupOptions(options: Options): void;
    /**
     *
     * @param tasks
     */
    setupTasks(tasks: Task[]): void;
    /**
     *
     */
    setupDependencies(): void;
    /**
     *
     * @param tasks
     */
    refresh(tasks: Task[]): void;
    /**
     *
     * @param mode
     */
    changeViewMode(mode?: ViewMode): void;
    /**
     *
     * @param view_mode
     */
    updateViewScale(view_mode: ViewMode): void;
    /**
     *
     */
    setupDates(): void;
    /**
     *
     */
    setupGanttDates(): void;
    /**
     *
     */
    setupDateValues(): void;
    /**
     *
     */
    bindEvents(): void;
    /**
     *
     */
    render(): void;
    /**
     *
     */
    setupLayers(): void;
    /**
     *
     */
    makeGrid(): void;
    /**
     *
     */
    makeGridBackground(): void;
    /**
     *
     */
    makeGridRows(): void;
    /**
     *
     */
    makeGridHeader(): void;
    /**
     *
     */
    makeColumnsGridHeader(): void;
    /**
     *
     */
    makeGridTicks(): void;
    /**
     *
     */
    makeGridHighlights(): void;
    /**
     *
     */
    makeDates(): void;
    /**
     *
     */
    getDatesToDraw(): DateInfo[];
    /**
     *
     * @param date
     * @param lastDate
     * @param i
     */
    getDateInfo(date: Date, lastDate: Date, i: number): DateInfo;
    /**
     *
     */
    makeBars(): void;
    /**
     *
     */
    makeArrows(): void;
    /**
     *
     */
    mapArrowsOnBars(): void;
    /**
     *
     */
    setWidth(): void;
    /**
     *
     */
    setScrollPosition(): void;
    /**
     *
     */
    bindGridClick(): void;
    bindBarEvents(): void;
    /**
     *
     */
    bindBarProgress(): void;
    /**
     *
     * @param task_id
     */
    getAllDependentTasks(task_id: string): string[];
    /**
     *
     * @param dx
     */
    getSnapPosition(dx: number): number;
    /**
     *
     */
    unselectAll(): void;
    /**
     *
     * @param modes
     */
    isView(modes: ViewMode | ViewMode[]): boolean;
    /**
     *
     * @param id
     */
    getTask(id: string): ResolvedTask;
    /**
     *
     * @param id
     */
    getBar(id: string): Bar;
    /**
     *
     * @param options
     */
    showPopup(options: PopupOptions): void;
    /**
     *
     */
    hidePopup(): void;
    /**
     *
     * @param event
     * @param args
     */
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
    /**
     *
     * @param sortFn
     */
    setSortKey(sortFn?: (a: ResolvedTask, b: ResolvedTask) => number): void;
    /**
     *
     */
    sortTasks(): void;
}
