import '../src/gantt.scss';
import { DateInfo } from './model/dateInfo';
import { Options } from './model/options';
import { ResolvedTask } from './model/resolvedTask';
import { Task } from './model/task';
import Bar from './app/bar';
import LabelColumn from './model/column/labelColumn';
import SelectColumn from './model/column/selectColumn';
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
     * オプション設定
     *
     * @param {Options} options
     */
    setupOptions(options: Options): void;
    /**
     * タスク設定
     *
     * @param {Task[]} tasks
     * @memberof Gantt
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
     * 表示モード変更処理
     *
     * @param {ViewMode} mode
     */
    changeViewMode(mode?: ViewMode): void;
    /**
     * 表示モードによって、スケールを変更する
     *
     * @param {ViewMode} view_mode
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
     * 描画処理
     */
    render(): void;
    /**
     *
     */
    setupLayers(): void;
    /**
     * グリッド作成
     */
    makeGrid(): void;
    /**
     * 背景作成
     */
    makeGridBackground(): void;
    /**
     * 行生成
     */
    makeGridRows(): void;
    /**
     * ヘッダー作成
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
     * 当日の背景色
     */
    makeGridHighlights(): void;
    /**
     *
     */
    makeDates(): void;
    createColumValue(task: ResolvedTask, column: SelectColumn | LabelColumn, x: number, posY: number, index: number): void;
    /**
     * 列の値を取得する。
     * グループ対象のキーの場合は現在までのindexのなかで複数あればブランクを返却
     *
     * @param {ResolvedTask} task
     * @param {string} fieldName
     * @param {number} index
     * @return {*}  {string}
     * @memberof Gantt
     */
    getColumnValue(task: ResolvedTask, fieldName: string, index: number): string;
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
