import Bar from './bar';
import Gantt from '../index';
/**
 *
 */
export default class Arrow {
    private gantt;
    fromTask: Bar;
    toTask: Bar;
    private path;
    element: SVGElement;
    /**
     *
     * @param gantt
     * @param from_task
     * @param to_task
     */
    constructor(gantt: Gantt, from_task: Bar, to_task: Bar);
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
