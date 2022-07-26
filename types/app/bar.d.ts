import { ResolvedTask } from '../model/resolvedTask';
import Arrow from './arrow';
import Gantt from '..';
/**
 * バークラス
 */
export default class Bar {
    private gantt;
    private invalid;
    private height;
    private x;
    private y;
    private cornerRadius;
    private duration;
    private width;
    private progressWidth;
    private barGroup;
    private handleGroup;
    private plannedHandleGroup;
    private plannedX?;
    private plannedY?;
    private plannedDuration?;
    private plannedWidth?;
    group: SVGElement;
    task: ResolvedTask;
    $bar: SVGElement;
    $barProgress: SVGElement;
    $handleProgress: SVGElement;
    arrows: Arrow[];
    $plannedBar?: SVGElement;
    interactionTarget: 'planned' | 'main' | null;
    currentIndex: number;
    /**
     *
     * @param gantt
     * @param task
     */
    constructor(gantt: Gantt, task: ResolvedTask, index: number);
    /**
     *
     * @param gantt
     * @param task
     */
    setDefaults(gantt: Gantt, task: ResolvedTask): void;
    /**
     *
     */
    prepare(): void;
    /**
     *
     */
    prepareValues(): void;
    prepareHelpers: () => void;
    /**
     * 描画処理
     */
    draw(): void;
    /**
     * バー描画
     */
    drawBar(): void;
    /**
     * 予定バー描画
     */
    drawPlannedBar(): void;
    /**
     *
     */
    drawProgressBar(): void;
    /**
     * タスク名表示
     */
    drawLabel(): void;
    /**
     *
     */
    drawResizeHandles(): void;
    /**
     *
     */
    getProgressPolygonPoints(): number[];
    /**
     *
     */
    bind(): void;
    /**
     *
     * @param root0
     * @param root0.x
     * @param root0.width
     */
    updateBarPosition({ x, width }: {
        x?: number | null;
        width?: number | null;
    }): void;
    /**
     *
     */
    dateChanged(): void;
    /**
     *
     */
    progressChanged(): void;
    /**
     *
     * @param planned
     */
    computeStartEndDate(planned?: boolean): {
        newStartDate: Date;
        newEndDate: Date;
    };
    /**
     *
     */
    computeProgress(): number;
    /**
     *
     * @param planned
     */
    computeX(planned?: boolean): number;
    /**
     *
     */
    computeY(): number;
    /**
     *
     * @param dx
     */
    getSnapPosition(dx: number): number;
    updateAttr: (element: Element, attr: string, value: number | string) => Element;
    /**
     *
     */
    updateProgressbarPosition(): void;
    /**
     *
     */
    updateLabelPosition(): void;
    /**
     *
     */
    updateHandlePosition(): void;
    /**
     *
     */
    updateArrowPosition(): void;
    /**
     *
     */
    setupHoverEvent(): void;
    /**
     *
     * @param main
     * @param planned
     */
    setHover(main: boolean, planned: boolean): void;
}
