import { ResolvedTask } from '../domain/resolvedTask';
import Arrow from './arrow';
import Gantt from '..';
/**
 *
 */
export default class Bar {
    private gantt;
    task: ResolvedTask;
    private invalid;
    private height;
    private x;
    private y;
    private cornerRadius;
    private duration;
    private width;
    private progressWidth;
    group: SVGElement;
    private barGroup;
    private handleGroup;
    private plannedHandleGroup;
    $bar: SVGElement;
    $barProgress: SVGElement;
    $handleProgress: SVGElement;
    arrows: Arrow[];
    private plannedX?;
    private plannedY?;
    private plannedDuration?;
    $plannedBar?: SVGElement;
    private plannedWidth?;
    interactionTarget: 'planned' | 'main' | null;
    /**
     *
     * @param gantt
     * @param task
     */
    constructor(gantt: Gantt, task: ResolvedTask);
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
     *
     */
    draw(): void;
    /**
     *
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
     *
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
