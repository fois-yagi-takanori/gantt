import Bar from './bar';
import Gantt from '../index';
/**
 *
 */
export default class Arrow {
    private gantt;
    private path;
    fromTask: Bar;
    toTask: Bar;
    element: SVGElement;
    /**
     * コンストラクタ
     *
     * @param gantt
     * @param fromTask
     * @param toTask
     */
    constructor(gantt: Gantt, fromTask: Bar, toTask: Bar);
    /**
     *
     */
    calculatePath(): void;
    /**
     *
     */
    draw(): void;
    /**
     *
     */
    update(): void;
}
