import '../src/gantt.scss';
import * as stringUtils from './utils/string.utils';
import { $, createSVG } from './utils/svg.utils';
import Arrow from './app/arrow';
import Bar from './app/bar';
import Split from 'split-grid';
import dateUtils from './utils/date.utils';
const VIEW_MODE = {
    QUARTER_DAY: 'Quarter Day',
    HALF_DAY: 'Half Day',
    DAY: 'Day',
    WEEK: 'Week',
    MONTH: 'Month',
    YEAR: 'Year',
};
/**
 * タスクID生成
 *
 * @param {ResolvedTask} task
 * @returns {string} タスクID
 */
function generateId(task) {
    return (`${task.name}_${Math.random()
        .toString(36)
        .slice(2, 12)}`);
}
/**
 *
 */
export default class Gantt {
    /**
     * コンストラクタ
     *
     * @param {(string | HTMLElement | SVGElement | unknown)} wrapper - ラッパー
     * @param {Task[]} tasks - タスク一覧
     * @param {Options} options - オプション
     * @memberof Gantt
     */
    constructor(wrapper, tasks, options) {
        this.setupWrapper(wrapper);
        this.setupOptions(options);
        this.setupTasks(tasks);
        this.setSortKey((a, b) => a.id.localeCompare(b.id));
        // initialize with default view mode
        this.changeViewMode();
        this.bindEvents();
        Split({
            columnGutters: [{
                    track: 1,
                    element: document.querySelector('.gutter-col-1'),
                }],
        });
    }
    /**
     * 大枠作成
     *
     * @param {(string | HTMLElement | SVGElement | unknown)} elementReference
     * @memberof Gantt
     */
    setupWrapper(elementReference) {
        let svgElement;
        let wrapperElement;
        const gutterElement = document.createElement('div');
        let resolvedElementReference;
        // CSS Selector is passed
        if (typeof elementReference === 'string') {
            resolvedElementReference = document.querySelector(elementReference);
        }
        else {
            resolvedElementReference = elementReference;
        }
        // get the SVGElement
        if (resolvedElementReference instanceof HTMLElement) {
            wrapperElement = resolvedElementReference;
            svgElement = resolvedElementReference.querySelector('svg');
        }
        else if (resolvedElementReference instanceof SVGElement) {
            svgElement = resolvedElementReference;
        }
        else {
            throw new TypeError('Frappé Gantt only supports usage of a string CSS selector,'
                + ' HTML DOM element or SVG DOM element for the \'element\' parameter');
        }
        wrapperElement.classList.add('grid');
        // svg element
        if (!svgElement) {
            // create it
            this.$svg = createSVG('svg', {
                append_to: wrapperElement,
                class: 'gantt',
            });
            this.$columnSvg = createSVG('svg', {
                append_to: wrapperElement,
                class: 'gantt',
                width: 400,
                id: 'columnSvg',
            });
        }
        else {
            this.$svg = svgElement;
            this.$svg.classList.add('gantt');
            this.$columnSvg = svgElement;
            this.$columnSvg.classList.add('gantt');
        }
        // wrapper element
        this.$container = document.createElement('div');
        this.$container.classList.add('gantt-container');
        this.$container.id = 'main-chart';
        this.$columnContainer = document.createElement('div');
        this.$columnContainer.classList.add('gantt-container');
        this.$columnContainer.classList.add('columns_svg');
        this.$columnContainer.id = 'columns_svg';
        gutterElement.classList.add('gutter-col');
        gutterElement.classList.add('gutter-col-1');
        gutterElement.style.gridTemplateColumns = '1fr 10px 2.5fr';
        const { parentElement } = this.$svg.parentElement;
        parentElement.appendChild(this.$columnContainer);
        parentElement.appendChild(this.$container);
        this.$columnContainer.appendChild(this.$columnSvg);
        this.$container.appendChild(this.$svg);
        // popup wrapper
        this.popupWrapper = document.createElement('div');
        this.popupWrapper.classList.add('popup-wrapper');
        this.$container.appendChild(this.popupWrapper);
        wrapperElement.appendChild(this.$columnContainer);
        wrapperElement.appendChild(gutterElement);
        wrapperElement.appendChild(this.$container);
    }
    /**
     * オプション設定
     *
     * @param {Options} options
     */
    setupOptions(options) {
        const defaultOptions = {
            headerHeight: 50,
            columnWidth: 30,
            step: 24,
            viewModes: [...Object.values(VIEW_MODE)],
            barHeight: 20,
            barCornerRadius: 3,
            arrowCurve: 5,
            padding: 18,
            viewMode: 'Day',
            dateFormat: 'YYYY-MM-DD',
            customPopupHtml: null,
            language: 'ja',
            columns: new Array(),
            columnWidthForColumns: 120,
        };
        this.options = Object.assign(Object.assign({}, defaultOptions), options);
    }
    /**
     * タスク設定
     *
     * @param {Task[]} tasks
     * @memberof Gantt
     */
    setupTasks(tasks) {
        // prepare tasks
        this.tasks = tasks.map((task, i) => {
            let dependencies;
            // dependencies
            if (typeof task.dependencies === 'string') {
                dependencies = task.dependencies
                    .split(',')
                    .map((d) => d.trim())
                    .filter((d) => d);
            }
            else if (dependencies) {
                dependencies = task.dependencies;
            }
            else {
                dependencies = [];
            }
            const resolvedTask = Object.assign(Object.assign({}, task), { plannedStartResolved: dateUtils.parse(task.planStartDate), plannedEndResolved: dateUtils.parse(task.planEndDate), resultStartResolved: dateUtils.parse(task.resultStartDate), resultEndResolved: dateUtils.parse(task.resultEndDate), indexResolved: i, dependencies });
            // make task invalid if duration too large
            if (dateUtils.diff(resolvedTask.resultEndResolved, resolvedTask.resultStartResolved, 'year') > 10) {
                resolvedTask.end = null;
            }
            // cache index
            // invalid dates
            if (!resolvedTask.planStartDate && !resolvedTask.planEndDate) {
                const today = dateUtils.today();
                resolvedTask.resultStartResolved = today;
                resolvedTask.resultEndResolved = dateUtils.add(today, 2, 'day');
            }
            if (!resolvedTask.planStartDate && resolvedTask.planEndDate) {
                resolvedTask.resultStartResolved = dateUtils.add(resolvedTask.resultEndResolved, -2, 'day');
            }
            if (resolvedTask.planStartDate && !resolvedTask.planEndDate) {
                resolvedTask.resultEndResolved = dateUtils.add(resolvedTask.resultStartResolved, 2, 'day');
            }
            // if hours is not set, assume the last day is full day
            // e.g: 2018-09-09 becomes 2018-09-09 23:59:59
            const taskEndValues = dateUtils.getDateValues(resolvedTask.resultEndResolved);
            if (taskEndValues.slice(3)
                .every((d) => d === 0)) {
                resolvedTask.resultEndResolved = dateUtils.add(resolvedTask.resultEndResolved, 24, 'hour');
            }
            // invalid flag
            if (!resolvedTask.planStartDate || !resolvedTask.planEndDate) {
                resolvedTask.invalid = true;
            }
            // uids
            if (!resolvedTask.id) {
                resolvedTask.id = generateId(resolvedTask);
            }
            return resolvedTask;
        });
        this.setupDependencies();
    }
    /**
     *
     */
    setupDependencies() {
        this.dependencyMap = {};
        this.tasks.forEach((t) => {
            t.dependencies.forEach((d) => {
                this.dependencyMap[d] = this.dependencyMap[d] || [];
                this.dependencyMap[d].push(t.id);
            });
        });
    }
    /**
     *
     * @param tasks
     */
    refresh(tasks) {
        this.setupTasks(tasks);
        this.changeViewMode();
    }
    /**
     * 表示モード変更処理
     *
     * @param {ViewMode} mode
     */
    changeViewMode(mode = this.options.viewMode) {
        this.updateViewScale(mode);
        this.setupDates();
        this.render();
        // fire viewmode_change event
        this.triggerEvent('ViewChange', [mode]);
    }
    /**
     * 表示モードによって、スケールを変更する
     *
     * @param {ViewMode} view_mode
     */
    updateViewScale(view_mode) {
        this.options.viewMode = view_mode;
        switch (view_mode) {
            case 'Quarter Day':
                this.options.step = 24 / 4;
                this.options.columnWidth = 38;
                break;
            case 'Half Day':
                this.options.step = 24 / 2;
                this.options.columnWidth = 38;
                break;
            case 'Day':
                this.options.step = 24;
                this.options.columnWidth = 38;
                break;
            case 'Week':
                this.options.step = 24 * 7;
                this.options.columnWidth = 140;
                break;
            case 'Month':
                this.options.step = 24 * 30;
                this.options.columnWidth = 120;
                break;
            case 'Year':
                this.options.step = 24 * 365;
                this.options.columnWidth = 120;
                break;
            default:
                // eslint-disable-next-line no-console
                console.error(`Unknown view mode used: ${view_mode}`);
        }
    }
    /**
     *
     */
    setupDates() {
        this.setupGanttDates();
        this.setupDateValues();
    }
    /**
     *
     */
    setupGanttDates() {
        this.ganttStart = null;
        this.ganttEnd = null;
        this.tasks.forEach((task) => {
            // set global start and end date
            if (!this.ganttStart || task.resultStartResolved < this.ganttStart) {
                this.ganttStart = task.resultStartResolved;
            }
            if (task.plannedStartResolved
                && (!this.ganttStart || task.plannedStartResolved > this.ganttStart)) {
                this.ganttStart = task.plannedStartResolved;
            }
            if (!this.ganttEnd || task.resultEndResolved > this.ganttEnd) {
                this.ganttEnd = task.resultEndResolved;
            }
            if (task.plannedEndResolved
                && (!this.ganttEnd || task.plannedEndResolved > this.ganttEnd)) {
                this.ganttEnd = task.plannedEndResolved;
            }
        });
        this.ganttStart = dateUtils.startOf(this.ganttStart, 'day');
        this.ganttEnd = dateUtils.startOf(this.ganttEnd, 'day');
        // add date padding on both sides
        if (this.isView([VIEW_MODE.QUARTER_DAY, VIEW_MODE.HALF_DAY])) {
            this.ganttStart = dateUtils.add(this.ganttStart, -7, 'day');
            this.ganttEnd = dateUtils.add(this.ganttEnd, 7, 'day');
        }
        else if (this.isView(VIEW_MODE.MONTH)) {
            this.ganttStart = dateUtils.startOf(this.ganttStart, 'year');
            this.ganttEnd = dateUtils.add(this.ganttEnd, 1, 'year');
        }
        else if (this.isView(VIEW_MODE.YEAR)) {
            this.ganttStart = dateUtils.add(this.ganttStart, -2, 'year');
            this.ganttEnd = dateUtils.add(this.ganttEnd, 2, 'year');
        }
        else {
            this.ganttStart = dateUtils.add(this.ganttStart, -1, 'month');
            this.ganttEnd = dateUtils.add(this.ganttEnd, 1, 'month');
        }
    }
    /**
     *
     */
    setupDateValues() {
        this.dates = [];
        let currentDate = null;
        while (currentDate === null || currentDate < this.ganttEnd) {
            if (!currentDate) {
                currentDate = dateUtils.clone(this.ganttStart);
            }
            else if (this.isView(VIEW_MODE.YEAR)) {
                currentDate = dateUtils.add(currentDate, 1, 'year');
            }
            else if (this.isView(VIEW_MODE.MONTH)) {
                currentDate = dateUtils.add(currentDate, 1, 'month');
            }
            else {
                currentDate = dateUtils.add(currentDate, this.options.step, 'hour');
            }
            this.dates.push(currentDate);
        }
    }
    /**
     *
     */
    bindEvents() {
        this.bindBarEvents();
    }
    /**
     * 描画処理
     */
    render() {
        this.clear();
        this.setupLayers();
        this.makeGrid();
        this.makeDates();
        this.makeBars();
        this.makeArrows();
        this.mapArrowsOnBars();
        this.setWidth();
        this.setScrollPosition();
    }
    /**
     *
     */
    setupLayers() {
        this.layers = {};
        this.columnLayers = {};
        const layers = ['grid', 'date', 'arrow', 'progress', 'bar', 'details'];
        // make group layers
        layers.forEach((layer) => {
            this.layers[layer] = createSVG('g', {
                class: layer,
                append_to: this.$svg,
            });
            this.columnLayers[layer] = createSVG('g', {
                class: layer,
                append_to: this.$columnSvg
            });
        });
    }
    /**
     * グリッド作成
     */
    makeGrid() {
        this.makeGridBackground();
        this.makeGridRows();
        this.makeGridHeader();
        this.makeColumnsGridHeader();
        this.makeGridTicks();
        this.makeGridHighlights();
    }
    /**
     * 背景作成
     */
    makeGridBackground() {
        const gridWidth = this.dates.length * this.options.columnWidth;
        const columnGridWidth = this.options.columns.length * this.options.columnWidthForColumns;
        const gridHeight = this.options.headerHeight
            + this.options.padding
            + (this.options.barHeight + this.options.padding)
                * this.tasks.length;
        createSVG('rect', {
            x: 0,
            y: 0,
            width: columnGridWidth,
            height: gridHeight,
            class: 'grid-background',
            append_to: this.layers.grid,
        });
        createSVG('rect', {
            x: 0,
            y: 0,
            width: gridWidth,
            height: gridHeight,
            class: 'grid-background',
            append_to: this.columnLayers.grid,
        });
        $.attr(this.$svg, {
            height: gridHeight + this.options.padding + 100,
            width: '100%'
        });
        $.attr(this.$columnSvg, {
            height: gridHeight + this.options.padding + 100,
            width: columnGridWidth,
        });
        // this.$container.style.left = `${columnGridWidth + 51}px`;
    }
    /**
     * 行生成
     */
    makeGridRows() {
        const rowsLayer = createSVG('g', { append_to: this.layers.grid });
        const linesLayer = createSVG('g', { append_to: this.layers.grid });
        const columnsRowsLayer = createSVG('g', { append_to: this.columnLayers.grid });
        const columnsLinesLayer = createSVG('g', { append_to: this.columnLayers.grid });
        const rowWidth = this.dates.length * this.options.columnWidth;
        const rowHeight = this.options.barHeight + this.options.padding + 20;
        const columnRowWidth = this.options.columns.length * this.options.columnWidthForColumns;
        let rowY = this.options.headerHeight + this.options.padding / 2;
        this.tasks.forEach((task) => {
            task.gridRow = createSVG('rect', {
                x: 0,
                y: rowY + 20,
                width: rowWidth,
                height: rowHeight,
                class: 'grid-row',
                append_to: rowsLayer,
            });
            createSVG('rect', {
                x: 0,
                y: rowY,
                width: columnRowWidth,
                height: rowHeight,
                class: 'grid-row',
                append_to: columnsRowsLayer,
            });
            createSVG('line', {
                x1: 0,
                y1: rowY + rowHeight,
                x2: rowWidth,
                y2: rowY + rowHeight,
                class: 'row-line',
                append_to: linesLayer,
            });
            createSVG('line', {
                x1: 0,
                y1: rowY + rowHeight,
                x2: columnRowWidth,
                y2: rowY + rowHeight,
                class: 'row-line',
                append_to: columnsLinesLayer,
            });
            rowY += this.options.barHeight + this.options.padding + 20;
        });
    }
    /**
     * ヘッダー作成
     */
    makeGridHeader() {
        const headerWidth = this.dates.length * this.options.columnWidth;
        const headerHeight = this.options.headerHeight + 10;
        createSVG('rect', {
            x: 0,
            y: 0,
            width: headerWidth,
            height: headerHeight,
            class: 'grid-header',
            append_to: this.layers.grid,
        });
    }
    /**
     *
     */
    makeColumnsGridHeader() {
        const headerWidth = this.options.columns.length * this.options.columnWidthForColumns;
        const headerHeight = this.options.headerHeight + 10;
        createSVG('rect', {
            x: 0,
            y: 0,
            width: headerWidth,
            height: headerHeight,
            class: 'grid-header',
            append_to: this.columnLayers.grid,
        });
    }
    /**
     *
     */
    makeGridTicks() {
        let tickX = 0;
        const tickY = this.options.headerHeight + this.options.padding / 2;
        const tickHeight = (this.options.barHeight + this.options.padding)
            * this.tasks.length;
        this.dates.forEach((date) => {
            let tickClass = 'tick';
            // thick tick for monday
            if (this.isView(VIEW_MODE.DAY) && date.getDate() === 1) {
                tickClass += ' thick';
            }
            // thick tick for first week
            if (this.isView(VIEW_MODE.WEEK)
                && date.getDate() >= 1
                && date.getDate() < 8) {
                tickClass += ' thick';
            }
            // thick ticks for quarters
            if (this.isView(VIEW_MODE.MONTH) && (date.getMonth() + 1) % 3 === 0) {
                tickClass += ' thick';
            }
            createSVG('path', {
                d: `M ${tickX} ${tickY} v ${tickHeight}`,
                class: tickClass,
                append_to: this.layers.grid,
            });
            if (this.isView(VIEW_MODE.MONTH)) {
                tickX
                    += (dateUtils.getDaysInMonth(date)
                        * this.options.columnWidth)
                        / 30;
            }
            else {
                tickX += this.options.columnWidth;
            }
        });
    }
    /**
     * 当日の背景色
     */
    makeGridHighlights() {
        // highlight today's date
        if (this.isView(VIEW_MODE.DAY)) {
            const x = (dateUtils.diff(dateUtils.today(), this.ganttStart, 'hour')
                / this.options.step)
                * this.options.columnWidth;
            const y = 0;
            const width = this.options.columnWidth;
            const height = (this.options.barHeight + this.options.padding + 20)
                * this.tasks.length
                + this.options.headerHeight
                + this.options.padding / 2;
            createSVG('rect', {
                x,
                y,
                width,
                height,
                class: 'today-highlight',
                append_to: this.layers.grid,
            });
        }
    }
    /**
     *
     */
    makeDates() {
        for (let i = 0; i < this.getDatesToDraw().length; i += 1) {
            const date = this.getDatesToDraw()[i];
            createSVG('text', {
                x: date.lowerX,
                y: date.lowerY,
                innerHTML: date.lowerText,
                class: 'lower-text',
                append_to: this.layers.date,
            });
            if (date.upperText) {
                const $upperText = createSVG('text', {
                    x: date.upperX,
                    y: date.upperY,
                    innerHTML: date.upperText,
                    class: 'upper-text',
                    append_to: this.layers.date,
                });
                // remove out-of-bound dates
                if ($upperText.getBBox().right > this.layers.grid.getBBox().width) {
                    $upperText.remove();
                }
            }
        }
        let x = 60;
        this.options.columns.forEach((column) => {
            createSVG('text', {
                x,
                y: 50,
                innerHTML: column.label,
                class: 'lower-text',
                append_to: this.columnLayers.date,
            });
            x += 120;
        });
        this.tasks.forEach((task, index) => {
            const posY = 15
                + this.options.headerHeight
                + this.options.padding
                + task.indexResolved * (this.options.barHeight + this.options.padding + 20);
            x = 60;
            this.options.columns.forEach((column) => {
                this.createColumValue(task, column.fieldName, x, posY, index);
                x += 120;
            });
        });
    }
    createColumValue(task, fieldName, x, posY, index) {
        switch (fieldName) {
            case 'startDate':
                createSVG('text', {
                    x,
                    y: posY,
                    innerHTML: stringUtils.getDefaultString(String(task.planStartDate)),
                    class: 'lower-text',
                    append_to: this.columnLayers.date,
                });
                createSVG('text', {
                    x,
                    y: posY + 20,
                    innerHTML: stringUtils.getDefaultString(String(task.resultStartDate)),
                    class: 'lower-text',
                    append_to: this.columnLayers.date,
                });
                break;
            case 'endDate':
                createSVG('text', {
                    x,
                    y: posY,
                    innerHTML: stringUtils.getDefaultString(String(task.resultStartDate)),
                    class: 'lower-text',
                    append_to: this.columnLayers.date,
                });
                createSVG('text', {
                    x,
                    y: posY + 20,
                    innerHTML: stringUtils.getDefaultString(String(task.resultEndDate)),
                    class: 'lower-text',
                    append_to: this.columnLayers.date,
                });
                break;
            case 'schedule':
                createSVG('text', {
                    x,
                    y: posY,
                    innerHTML: '予定',
                    class: 'lower-text',
                    append_to: this.columnLayers.date,
                });
                createSVG('text', {
                    x,
                    y: posY + 20,
                    innerHTML: '実績',
                    class: 'lower-text',
                    append_to: this.columnLayers.date,
                });
                break;
            default:
                createSVG('text', {
                    x,
                    y: posY,
                    innerHTML: this.getColumnValue(task, fieldName, index),
                    class: 'lower-text',
                    append_to: this.columnLayers.date,
                });
                break;
        }
    }
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
    getColumnValue(task, fieldName, index) {
        if (fieldName !== this.options.groupKey || stringUtils.isNullOrEmpty(this.options.groupKey)) {
            return stringUtils.getDefaultString(String(task[fieldName]));
        }
        if (index === 0) {
            return stringUtils.getDefaultString(String(task[fieldName]));
        }
        const groupValue = stringUtils.getDefaultString(String(task[fieldName]));
        let searchCount = 0;
        let loopIndex = 0;
        for (const loopTask of this.tasks) {
            const value = stringUtils.getDefaultString(String(loopTask[fieldName]));
            if (value === groupValue) {
                searchCount++;
            }
            if (index === loopIndex) {
                break;
            }
            loopIndex++;
        }
        if (searchCount === 1) {
            return groupValue;
        }
        return '';
    }
    /**
     *
     */
    getDatesToDraw() {
        let lastDate = null;
        return this.dates.map((date, i) => {
            const d = this.getDateInfo(date, lastDate, i);
            lastDate = date;
            return d;
        });
    }
    /**
     *
     * @param date
     * @param lastDate
     * @param i
     */
    getDateInfo(date, lastDate, i) {
        if (!lastDate) {
            // eslint-disable-next-line no-param-reassign
            lastDate = dateUtils.add(date, 1, 'year');
        }
        const dateText = {
            'Quarter Day_lower': dateUtils.format(date, 'HH', this.options.language),
            'Half Day_lower': dateUtils.format(date, 'HH', this.options.language),
            Day_lower: date.getDate() !== lastDate.getDate()
                ? dateUtils.format(date, 'D', this.options.language)
                : '',
            Week_lower: date.getMonth() !== lastDate.getMonth()
                ? dateUtils.format(date, 'D MMM', this.options.language)
                : dateUtils.format(date, 'D', this.options.language),
            Month_lower: dateUtils.format(date, 'MMMM', this.options.language),
            Year_lower: dateUtils.format(date, 'YYYY', this.options.language),
            'Quarter Day_upper': date.getDate() !== lastDate.getDate()
                ? dateUtils.format(date, 'D MMM', this.options.language)
                : '',
            'Half Day_upper': 
            // eslint-disable-next-line no-nested-ternary
            date.getDate() !== lastDate.getDate()
                ? date.getMonth() !== lastDate.getMonth()
                    ? dateUtils.format(date, 'D MMM', this.options.language)
                    : dateUtils.format(date, 'D', this.options.language)
                : '',
            Day_upper: date.getMonth() !== lastDate.getMonth()
                ? dateUtils.format(date, 'MMMM', this.options.language)
                : '',
            Week_upper: date.getMonth() !== lastDate.getMonth()
                ? dateUtils.format(date, 'MMMM', this.options.language)
                : '',
            Month_upper: date.getFullYear() !== lastDate.getFullYear()
                ? dateUtils.format(date, 'YYYY', this.options.language)
                : '',
            Year_upper: date.getFullYear() !== lastDate.getFullYear()
                ? dateUtils.format(date, 'YYYY', this.options.language)
                : '',
        };
        const basePos = {
            x: i * this.options.columnWidth,
            lower_y: this.options.headerHeight,
            upper_y: this.options.headerHeight - 25,
        };
        const xPos = {
            'Quarter Day_lower': (this.options.columnWidth * 4) / 2,
            'Quarter Day_upper': 0,
            'Half Day_lower': (this.options.columnWidth * 2) / 2,
            'Half Day_upper': 0,
            Day_lower: this.options.columnWidth / 2,
            Day_upper: (this.options.columnWidth * 30) / 2,
            Week_lower: 0,
            Week_upper: (this.options.columnWidth * 4) / 2,
            Month_lower: this.options.columnWidth / 2,
            Month_upper: (this.options.columnWidth * 12) / 2,
            Year_lower: this.options.columnWidth / 2,
            Year_upper: (this.options.columnWidth * 30) / 2,
        };
        return {
            upperText: dateText[`${this.options.viewMode}_upper`],
            lowerText: dateText[`${this.options.viewMode}_lower`],
            upperX: basePos.x + xPos[`${this.options.viewMode}_upper`],
            upperY: basePos.upper_y,
            lowerX: basePos.x + xPos[`${this.options.viewMode}_lower`],
            lowerY: basePos.lower_y,
        };
    }
    /**
     *
     */
    makeBars() {
        let i = 0;
        this.bars = this.tasks.map((task) => {
            const bar = new Bar(this, task, i);
            this.layers.bar.appendChild(bar.group);
            i++;
            return bar;
        });
    }
    /**
     *
     */
    makeArrows() {
        this.arrows = [];
        this.tasks.forEach((task) => {
            const arrows = task.dependencies
                .map((task_id) => {
                const dependency = this.getTask(task_id);
                if (!dependency)
                    return null;
                const arrow = new Arrow(this, this.bars[dependency.indexResolved], // from_task
                this.bars[task.indexResolved]);
                this.layers.arrow.appendChild(arrow.element);
                return arrow;
            })
                .filter(Boolean); // filter falsy values
            this.arrows = this.arrows.concat(arrows);
        });
    }
    /**
     *
     */
    mapArrowsOnBars() {
        this.bars.forEach((bar) => {
            // eslint-disable-next-line no-param-reassign
            bar.arrows = this.arrows.filter((arrow) => (arrow.fromTask.task.id === bar.task.id
                || arrow.toTask.task.id === bar.task.id));
        });
    }
    /**
     *
     */
    setWidth() {
        const currentWidth = this.$svg.getBoundingClientRect().width;
        const actualWidth = this.$svg
            .querySelector('.grid .grid-row')
            .getAttribute('width');
        if (currentWidth < Number(actualWidth)) {
            this.$svg.setAttribute('width', actualWidth);
        }
    }
    /**
     *
     */
    setScrollPosition() {
        const { parentElement } = this.$svg;
        if (!parentElement)
            return;
        const hoursBeforeFirstTask = dateUtils.diff(this.getOldestStartingDate(), this.ganttStart, 'hour');
        parentElement.scrollLeft = (hoursBeforeFirstTask
            / this.options.step)
            * this.options.columnWidth
            - this.options.columnWidth;
    }
    // eslint-disable-next-line max-lines-per-function
    bindBarEvents() {
        let isDragging = false;
        let xOnStart = 0;
        let isResizingLeft = false;
        let isResizingRight = false;
        let parentBarId = null;
        let draggingPlanned = false;
        let bars = []; // instanceof Bar
        this.barBeingDragged = null;
        function actionInProgress() {
            return isDragging || isResizingLeft || isResizingRight;
        }
        // @ts-ignore Weird sorcery. I don't touch it and it keeps working.
        $.on(this.$svg, 'mousedown', '.bar-wrapper, .bar-progress, .handle', (e, element) => {
            const barWrapper = $.closest('.bar-wrapper', element);
            if (element.classList.contains('left')) {
                isResizingLeft = true;
            }
            else if (element.classList.contains('right')) {
                isResizingRight = true;
            }
            else if (element.classList.contains('bar-wrapper')) {
                isDragging = true;
            }
            if (element.classList.contains('planned')) {
                draggingPlanned = true;
            }
            barWrapper.classList.add('active');
            xOnStart = e.offsetX;
            parentBarId = barWrapper.getAttribute('data-id');
            const ids = [
                parentBarId,
                ...this.getAllDependentTasks(parentBarId),
            ];
            bars = ids.map((id) => this.getBar(id));
            this.barBeingDragged = parentBarId;
            bars.forEach((bar) => {
                var _a;
                const $bar = draggingPlanned ? ((_a = bar.$plannedBar) !== null && _a !== void 0 ? _a : bar.$bar) : bar.$bar;
                $bar.ox = $bar.getX();
                $bar.oy = $bar.getY();
                $bar.owidth = $bar.getWidth();
                $bar.finaldx = 0;
            });
        });
        $.on(this.$svg, 'mousemove', (e) => {
            if (!actionInProgress())
                return;
            const dx = e.offsetX - xOnStart;
            bars.forEach((bar) => {
                const $bar = bar.$bar;
                $bar.finaldx = this.getSnapPosition(dx);
                if (isResizingLeft) {
                    if (parentBarId === bar.task.id) {
                        bar.updateBarPosition({
                            x: $bar.ox + $bar.finaldx,
                            width: $bar.owidth - $bar.finaldx
                        });
                    }
                    else {
                        bar.updateBarPosition({
                            x: $bar.ox + $bar.finaldx
                        });
                    }
                }
                else if (isResizingRight) {
                    if (parentBarId === bar.task.id) {
                        bar.updateBarPosition({
                            width: $bar.owidth + $bar.finaldx
                        });
                    }
                }
                else if (isDragging) {
                    bar.updateBarPosition({ x: $bar.ox + $bar.finaldx });
                }
            });
        });
        document.addEventListener('mouseup', () => {
            if (isDragging || isResizingLeft || isResizingRight) {
                bars.forEach((bar) => bar.group.classList.remove('active'));
            }
            isDragging = false;
            isResizingLeft = false;
            isResizingRight = false;
            draggingPlanned = false;
        });
        $.on(this.$svg, 'mouseup', () => {
            this.barBeingDragged = null;
            bars.forEach((bar) => {
                const $bar = bar.$bar;
                if (!$bar.finaldx)
                    return;
                bar.dateChanged();
            });
        });
        this.bindBarProgress();
    }
    /**
     *
     */
    bindBarProgress() {
        let xOnStart = 0;
        let isResizing = null;
        let bar = null;
        let $barProgress = null;
        let $bar = null;
        // @ts-ignore sorcery.
        $.on(this.$svg, 'mousedown', '.handle.progress', (e, handle) => {
            isResizing = true;
            xOnStart = e.offsetX;
            const $barWrapper = $.closest('.bar-wrapper', handle);
            const id = $barWrapper.getAttribute('data-id');
            bar = this.getBar(id);
            $barProgress = bar.$barProgress;
            $bar = bar.$bar;
            $barProgress.finaldx = 0;
            $barProgress.owidth = $barProgress.getWidth();
            $barProgress.minDx = -$barProgress.getWidth();
            $barProgress.maxDx = $bar.getWidth() - $barProgress.getWidth();
        });
        $.on(this.$svg, 'mousemove', (e) => {
            if (!isResizing)
                return;
            let dx = e.offsetX - xOnStart;
            if (dx > $barProgress.maxDx) {
                dx = $barProgress.maxDx;
            }
            if (dx < $barProgress.minDx) {
                dx = $barProgress.minDx;
            }
            const $handle = bar.$handleProgress;
            $.attr($barProgress, 'width', $barProgress.owidth + dx);
            $.attr($handle, 'points', String(bar.getProgressPolygonPoints()));
            $barProgress.finaldx = dx;
        });
        $.on(this.$svg, 'mouseup', () => {
            isResizing = false;
            if (!($barProgress && $barProgress.finaldx))
                return;
            bar.progressChanged();
        });
    }
    /**
     *
     * @param task_id
     */
    getAllDependentTasks(task_id) {
        let out = [];
        let toProcess = [task_id];
        while (toProcess.length) {
            const deps = toProcess.reduce((acc, curr) => acc.concat(this.dependencyMap[curr]), []);
            out = out.concat(deps);
            toProcess = deps.filter((d) => !toProcess.includes(d));
        }
        return out.filter(Boolean);
    }
    /**
     *
     * @param dx
     */
    getSnapPosition(dx) {
        const odx = dx;
        let rem;
        let position;
        if (this.isView(VIEW_MODE.WEEK)) {
            rem = dx % (this.options.columnWidth / 7);
            position = odx
                - rem
                + (rem < this.options.columnWidth / 14
                    ? 0
                    : this.options.columnWidth / 7);
        }
        else if (this.isView(VIEW_MODE.MONTH)) {
            rem = dx % (this.options.columnWidth / 30);
            position = odx
                - rem
                + (rem < this.options.columnWidth / 60
                    ? 0
                    : this.options.columnWidth / 30);
        }
        else {
            rem = dx % this.options.columnWidth;
            position = odx
                - rem
                + (rem < this.options.columnWidth / 2
                    ? 0
                    : this.options.columnWidth);
        }
        return position;
    }
    /**
     *
     */
    unselectAll() {
        Array.from(this.$svg.querySelectorAll('.bar-wrapper'))
            .forEach((el) => {
            el.classList.remove('active');
        });
    }
    /**
     *
     * @param modes
     */
    isView(modes) {
        if (typeof modes === 'string') {
            return this.options.viewMode === modes;
        }
        if (Array.isArray(modes)) {
            return modes.some((mode) => this.options.viewMode === mode);
        }
        return false;
    }
    /**
     *
     * @param id
     */
    getTask(id) {
        return this.tasks.find((task) => task.id === id);
    }
    /**
     *
     * @param id
     */
    getBar(id) {
        return this.bars.find((bar) => bar.task.id === id);
    }
    /**
     *
     * @param event
     * @param args
     */
    triggerEvent(event, args) {
        var _a;
        // @ts-ignore
        (_a = this.options[`on${event}`]) === null || _a === void 0 ? void 0 : _a.apply(null, args);
    }
    /**
       * Gets the oldest starting date from the list of tasks
       *
       * @returns Date
       * @memberof Gantt
       */
    getOldestStartingDate() {
        return this.tasks
            .map((task) => task.resultStartResolved)
            .reduce((prev_date, cur_date) => (cur_date <= prev_date ? cur_date : prev_date));
    }
    /**
       * Clear all elements from the parent svg element
       *
       * @memberof Gantt
       */
    clear() {
        this.$svg.innerHTML = '';
    }
    /**
     *
     * @param sortFn
     */
    setSortKey(sortFn) {
        this.sortKey = sortFn !== null && sortFn !== void 0 ? sortFn : ((a, b) => a.id.localeCompare(b.id));
        this.sortTasks();
    }
    /**
     *
     */
    sortTasks() {
        const updatedTasks = this.tasks.sort(this.sortKey).map((task, newIndex) => {
            task.indexResolved = newIndex;
            return task;
        });
        this.refresh(updatedTasks);
    }
}
Gantt.VIEW_MODE = VIEW_MODE;
//# sourceMappingURL=index.js.map