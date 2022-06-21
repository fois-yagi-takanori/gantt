import '../src/gantt.scss';
import * as stringUtils from './utils/string.utils';
import { $, createSVG } from './utils/svg.utils';
import { DateInfo } from './domain/dateInfo';
import { Options } from './domain/options';
import { ResolvedTask } from './domain/resolvedTask';
import { Task } from './domain/task';
import Arrow from './app/arrow';
import Bar from './app/bar';
import Popup, { PopupOptions } from './app/popup';
import Split from 'split-grid';
import dateUtils from './utils/date.utils';

export type ViewMode = 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year';

const VIEW_MODE: {
  QUARTER_DAY: 'Quarter Day',
  HALF_DAY: 'Half Day',
  DAY: 'Day',
  WEEK: 'Week',
  MONTH: 'Month',
  YEAR: 'Year',
} = {
  QUARTER_DAY: 'Quarter Day',
  HALF_DAY: 'Half Day',
  DAY: 'Day',
  WEEK: 'Week',
  MONTH: 'Month',
  YEAR: 'Year',
};

/**
 *
 * @param task
 */
function generateId(task: ResolvedTask): string {
  return (
    `${task.name
    }_${Math.random()
      .toString(36)
      .slice(2, 12)}`
  );
}

/**
 *
 */
export default class Gantt {
  private $svg: SVGElement;

  private $columnSvg: SVGElement;

  private $container: HTMLDivElement;

  private $columnContainer: HTMLDivElement;

  private popupWrapper: HTMLDivElement;

  public options: Options;

  private tasks: ResolvedTask[];

  private dependencyMap: Record<string, string[]>;

  public ganttStart: null | Date;

  private ganttEnd: null | Date;

  private dates: Date[];

  public barBeingDragged?: string;

  private layers: Record<string, SVGElement>;

  private columnLayers: Record<string, SVGElement>;

  private bars: Bar[];

  private arrows: Arrow[];

  private popup: Popup;

  private sortKey: (a: ResolvedTask, b: ResolvedTask) => number;

  static VIEW_MODE: { QUARTER_DAY: 'Quarter Day'; HALF_DAY: 'Half Day'; DAY: 'Day'; WEEK: 'Week'; MONTH: 'Month'; YEAR: 'Year' };

  /**
   * コンストラクタ
   *
   * @param {(string | HTMLElement | SVGElement | unknown)} wrapper - ラッパー
   * @param {Task[]} tasks - タスク一覧
   * @param {Options} options - オプション
   * @memberof Gantt
   */
  constructor(
    wrapper: string | HTMLElement | SVGElement | unknown,
    tasks: Task[],
    options: Options,
  ) {
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
  setupWrapper(elementReference: string | HTMLElement | SVGElement | unknown): void {
    let svgElement;
    let wrapperElement;
    const gutterElement = document.createElement('div');

    let resolvedElementReference: HTMLElement | SVGElement | unknown;

    // CSS Selector is passed
    if (typeof elementReference === 'string') {
      resolvedElementReference = document.querySelector(elementReference);
    } else {
      resolvedElementReference = elementReference;
    }

    // get the SVGElement
    if (resolvedElementReference instanceof HTMLElement) {
      wrapperElement = resolvedElementReference;
      svgElement = resolvedElementReference.querySelector('svg');
    } else if (resolvedElementReference instanceof SVGElement) {
      svgElement = resolvedElementReference;
    } else {
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
    } else {
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
   *
   * @param options
   */
  setupOptions(options: Options): void {
    const defaultOptions: Options = {
      headerHeight: 50,
      columnWidth: 30,
      step: 24,
      viewModes: [...Object.values(VIEW_MODE)] as ViewMode[],
      barHeight: 20,
      barCornerRadius: 3,
      arrowCurve: 5,
      padding: 18,
      viewMode: 'Day',
      dateFormat: 'YYYY-MM-DD',
      popupTrigger: 'click',
      customPopupHtml: null,
      language: 'ja',
      columnNames: new Array<string>(),
      columnKeys: new Array<string>(),
      columnWidthForColumns: 120,
    };
    this.options = { ...defaultOptions, ...options };
  }

  /**
   *
   * @param tasks
   */
  setupTasks(tasks: Task[]): void {
    // prepare tasks
    this.tasks = tasks.map((task, i): ResolvedTask => {
      let dependencies: string[];

      // dependencies
      if (typeof task.dependencies === 'string') {
        dependencies = task.dependencies
          .split(',')
          .map((d) => d.trim())
          .filter((d) => d);
      } else if (dependencies) {
        dependencies = task.dependencies;
      } else {
        dependencies = [];
      }

      const resolvedTask: ResolvedTask = {
        ...task,
        startResolved: dateUtils.parse(task.planStartDate),
        endResolved: dateUtils.parse(task.planEndDate),
        indexResolved: i,
        dependencies,
        columnNames: this.options.columnNames,
      };

      // make task invalid if duration too large
      if (dateUtils.diff(resolvedTask.endResolved, resolvedTask.startResolved, 'year') > 10) {
        resolvedTask.end = null;
      }

      // cache index

      // invalid dates
      if (!resolvedTask.planStartDate && !resolvedTask.planEndDate) {
        const today = dateUtils.today();
        resolvedTask.startResolved = today;
        resolvedTask.endResolved = dateUtils.add(today, 2, 'day');
      }

      if (!resolvedTask.planStartDate && resolvedTask.planEndDate) {
        resolvedTask.startResolved = dateUtils.add(resolvedTask.endResolved, -2, 'day');
      }

      if (resolvedTask.planStartDate && !resolvedTask.planEndDate) {
        resolvedTask.endResolved = dateUtils.add(resolvedTask.startResolved, 2, 'day');
      }

      // if hours is not set, assume the last day is full day
      // e.g: 2018-09-09 becomes 2018-09-09 23:59:59
      const taskEndValues = dateUtils.getDateValues(resolvedTask.endResolved);
      if (taskEndValues.slice(3)
        .every((d) => d === 0)) {
        resolvedTask.endResolved = dateUtils.add(resolvedTask.endResolved, 24, 'hour');
      }

      // invalid flag
      if (!resolvedTask.planStartDate || !resolvedTask.planEndDate) {
        resolvedTask.invalid = true;
      }

      // uids
      if (!resolvedTask.id) {
        resolvedTask.id = generateId(resolvedTask);
      }

      // Planned start/finish.
      if (task.plannedStart || task.plannedEnd) {
        resolvedTask.hasPlanned = true;
        resolvedTask.plannedStartResolved = dateUtils.parse(task.plannedStart || task.planStartDate);
        resolvedTask.plannedEndResolved = dateUtils.parse(task.plannedEnd || task.planEndDate);

        // if hours is not set, assume the last day is full day
        // e.g: 2018-09-09 becomes 2018-09-09 23:59:59
        const plannedTaskEndValues = dateUtils.getDateValues(resolvedTask.plannedEndResolved);
        if (plannedTaskEndValues.slice(3)
          .every((d) => d === 0)) {
          resolvedTask.plannedEndResolved = dateUtils.add(resolvedTask.plannedEndResolved, 24, 'hour');
        }
      }

      return resolvedTask;
    });

    this.setupDependencies();
  }

  /**
   *
   */
  setupDependencies(): void {
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
  refresh(tasks: Task[]): void {
    this.setupTasks(tasks);
    this.changeViewMode();
  }

  /**
   *
   * @param mode
   */
  changeViewMode(mode: ViewMode = this.options.viewMode): void {
    this.updateViewScale(mode);
    this.setupDates();
    this.render();
    // fire viewmode_change event
    this.triggerEvent('ViewChange', [mode]);
  }

  /**
   *
   * @param view_mode
   */
  updateViewScale(view_mode: ViewMode): void {
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
  setupDates(): void {
    this.setupGanttDates();
    this.setupDateValues();
  }

  /**
   *
   */
  setupGanttDates(): void {
    this.ganttStart = null;
    this.ganttEnd = null;

    this.tasks.forEach((task) => {
      // set global start and end date
      if (!this.ganttStart || task.startResolved < this.ganttStart) {
        this.ganttStart = task.startResolved;
      }
      if (task.plannedStartResolved
        && (!this.ganttStart || task.plannedStartResolved > this.ganttStart)) {
        this.ganttStart = task.plannedStartResolved;
      }
      if (!this.ganttEnd || task.endResolved > this.ganttEnd) {
        this.ganttEnd = task.endResolved;
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
    } else if (this.isView(VIEW_MODE.MONTH)) {
      this.ganttStart = dateUtils.startOf(this.ganttStart, 'year');
      this.ganttEnd = dateUtils.add(this.ganttEnd, 1, 'year');
    } else if (this.isView(VIEW_MODE.YEAR)) {
      this.ganttStart = dateUtils.add(this.ganttStart, -2, 'year');
      this.ganttEnd = dateUtils.add(this.ganttEnd, 2, 'year');
    } else {
      this.ganttStart = dateUtils.add(this.ganttStart, -1, 'month');
      this.ganttEnd = dateUtils.add(this.ganttEnd, 1, 'month');
    }
  }

  /**
   *
   */
  setupDateValues(): void {
    this.dates = [];
    let currentDate: Date | null = null;

    while (currentDate === null || currentDate < this.ganttEnd) {
      if (!currentDate) {
        currentDate = dateUtils.clone(this.ganttStart);
      } else if (this.isView(VIEW_MODE.YEAR)) {
        currentDate = dateUtils.add(currentDate, 1, 'year');
      } else if (this.isView(VIEW_MODE.MONTH)) {
        currentDate = dateUtils.add(currentDate, 1, 'month');
      } else {
        currentDate = dateUtils.add(
          currentDate,
          this.options.step,
          'hour',
        );
      }
      this.dates.push(currentDate);
    }
  }

  /**
   *
   */
  bindEvents(): void {
    this.bindGridClick();
    this.bindBarEvents();
  }

  /**
   *
   */
  render(): void {
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
  setupLayers(): void {
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
   *
   */
  makeGrid(): void {
    this.makeGridBackground();
    this.makeGridRows();
    this.makeGridHeader();
    this.makeColumnsGridHeader();
    this.makeGridTicks();
    this.makeGridHighlights();
  }

  /**
   *
   */
  makeGridBackground(): void {
    const gridWidth = this.dates.length * this.options.columnWidth;
    const columnGridWidth = this.options.columnNames.length * this.options.columnWidthForColumns;
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
   *
   */
  makeGridRows(): void {
    const rowsLayer = createSVG('g', { append_to: this.layers.grid });
    const linesLayer = createSVG('g', { append_to: this.layers.grid });
    const columnsRowsLayer = createSVG('g', { append_to: this.columnLayers.grid });
    const columnsLinesLayer = createSVG('g', { append_to: this.columnLayers.grid });

    const rowWidth = this.dates.length * this.options.columnWidth;
    const rowHeight = this.options.barHeight + this.options.padding;
    const columnRowWidth = this.options.columnNames.length * this.options.columnWidthForColumns;

    let rowY = this.options.headerHeight + this.options.padding / 2;

    this.tasks.forEach((task) => {
      task.gridRow = createSVG('rect', {
        x: 0,
        y: rowY,
        width: rowWidth,
        height: rowHeight,
        class: 'grid-row',
        append_to: rowsLayer,
      });
      task.gridRow = createSVG('rect', {
        x: 0,
        y: rowY,
        width: columnRowWidth,
        height: rowHeight,
        class: 'grid-row',
        append_to: columnsRowsLayer,
      });

      task.gridRow = createSVG('line', {
        x1: 0,
        y1: rowY + rowHeight,
        x2: rowWidth,
        y2: rowY + rowHeight,
        class: 'row-line',
        append_to: linesLayer,
      });

      task.gridRow = createSVG('line', {
        x1: 0,
        y1: rowY + rowHeight,
        x2: columnRowWidth,
        y2: rowY + rowHeight,
        class: 'row-line',
        append_to: columnsLinesLayer,
      });

      rowY += this.options.barHeight + this.options.padding;
    });
  }

  /**
   *
   */
  makeGridHeader(): void {
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
  makeColumnsGridHeader(): void {
    const headerWidth = this.options.columnNames.length * this.options.columnWidthForColumns;
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
  makeGridTicks(): void {
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
      if (
        this.isView(VIEW_MODE.WEEK)
        && date.getDate() >= 1
        && date.getDate() < 8
      ) {
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
      } else {
        tickX += this.options.columnWidth;
      }
    });
  }

  /**
   *
   */
  makeGridHighlights(): void {
    // highlight today's date
    if (this.isView(VIEW_MODE.DAY)) {
      const x = (dateUtils.diff(dateUtils.today(), this.ganttStart, 'hour')
        / this.options.step)
        * this.options.columnWidth;
      const y = 0;

      const width = this.options.columnWidth;
      const height = (this.options.barHeight + this.options.padding)
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
  makeDates(): void {
    for (let i = 0; i < this.getDatesToDraw().length; i += 1) {
      const date = this.getDatesToDraw()[i];
      createSVG('text', {
        x: date.lower_x,
        y: date.lower_y,
        innerHTML: date.lower_text,
        class: 'lower-text',
        append_to: this.layers.date,
      });

      if (date.upper_text) {
        const $upperText = createSVG('text', {
          x: date.upper_x,
          y: date.upper_y,
          innerHTML: date.upper_text,
          class: 'upper-text',
          append_to: this.layers.date,
        }) as SVGGraphicsElement;

        // remove out-of-bound dates
        if (
          $upperText.getBBox().right > (<SVGGraphicsElement>this.layers.grid).getBBox().width
        ) {
          $upperText.remove();
        }
      }
    }

    let x = 60;
    this.options.columnNames.forEach((column) => {
      createSVG('text', {
        x,
        y: 50,
        innerHTML: column,
        class: 'lower-text',
        append_to: this.columnLayers.date,
      });
      x += 120;
    });

    this.tasks.forEach((task: ResolvedTask) => {
      const posY = 15
        + this.options.headerHeight
        + this.options.padding
        + task.indexResolved * (this.options.barHeight + this.options.padding);
      x = 60;
      this.options.columnKeys.forEach((columnKey) => {
        createSVG('text', {
          x,
          y: posY,
          innerHTML: stringUtils.getDefaultString(String(task[columnKey])),
          class: 'lower-text',
          append_to: this.columnLayers.date,
        });
        x += 120;
      });
    });
  }

  /**
   *
   */
  getDatesToDraw(): DateInfo[] {
    let lastDate: Date = null;

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
  getDateInfo(date: Date, lastDate: Date, i: number): DateInfo {
    if (!lastDate) {
      // eslint-disable-next-line no-param-reassign
      lastDate = dateUtils.add(date, 1, 'year');
    }
    const dateText = {
      'Quarter Day_lower': dateUtils.format(
        date,
        'HH',
        this.options.language,
      ),
      'Half Day_lower': dateUtils.format(
        date,
        'HH',
        this.options.language,
      ),
      Day_lower:
        date.getDate() !== lastDate.getDate()
          ? dateUtils.format(date, 'D', this.options.language)
          : '',
      Week_lower:
        date.getMonth() !== lastDate.getMonth()
          ? dateUtils.format(date, 'D MMM', this.options.language)
          : dateUtils.format(date, 'D', this.options.language),
      Month_lower: dateUtils.format(date, 'MMMM', this.options.language),
      Year_lower: dateUtils.format(date, 'YYYY', this.options.language),
      'Quarter Day_upper':
        date.getDate() !== lastDate.getDate()
          ? dateUtils.format(date, 'D MMM', this.options.language)
          : '',
      'Half Day_upper':
        // eslint-disable-next-line no-nested-ternary
        date.getDate() !== lastDate.getDate()
          ? date.getMonth() !== lastDate.getMonth()
            ? dateUtils.format(date, 'D MMM', this.options.language)
            : dateUtils.format(date, 'D', this.options.language)
          : '',
      Day_upper:
        date.getMonth() !== lastDate.getMonth()
          ? dateUtils.format(date, 'MMMM', this.options.language)
          : '',
      Week_upper:
        date.getMonth() !== lastDate.getMonth()
          ? dateUtils.format(date, 'MMMM', this.options.language)
          : '',
      Month_upper:
        date.getFullYear() !== lastDate.getFullYear()
          ? dateUtils.format(date, 'YYYY', this.options.language)
          : '',
      Year_upper:
        date.getFullYear() !== lastDate.getFullYear()
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
      upper_text: dateText[`${this.options.viewMode}_upper`],
      lower_text: dateText[`${this.options.viewMode}_lower`],
      upper_x: basePos.x + xPos[`${this.options.viewMode}_upper`],
      upper_y: basePos.upper_y,
      lower_x: basePos.x + xPos[`${this.options.viewMode}_lower`],
      lower_y: basePos.lower_y,
    };
  }

  /**
   *
   */
  makeBars(): void {
    this.bars = this.tasks.map((task) => {
      const bar = new Bar(this, task);
      this.layers.bar.appendChild(bar.group);

      return bar;
    });
  }

  /**
   *
   */
  makeArrows(): void {
    this.arrows = [];
    this.tasks.forEach((task) => {
      const arrows = task.dependencies
        .map((task_id) => {
          const dependency = this.getTask(task_id);
          if (!dependency) return null;
          const arrow = new Arrow(
            this,
            this.bars[dependency.indexResolved], // from_task
            this.bars[task.indexResolved], // to_task
          );
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
  mapArrowsOnBars(): void {
    this.bars.forEach((bar) => {
      // eslint-disable-next-line no-param-reassign
      bar.arrows = this.arrows.filter((arrow) => (
        arrow.fromTask.task.id === bar.task.id
        || arrow.toTask.task.id === bar.task.id
      ));
    });
  }

  /**
   *
   */
  setWidth(): void {
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
  setScrollPosition(): void {
    const { parentElement } = this.$svg;
    if (!parentElement) return;

    const hoursBeforeFirstTask = dateUtils.diff(
      this.getOldestStartingDate(),
      this.ganttStart,
      'hour',
    );

    parentElement.scrollLeft = (hoursBeforeFirstTask
      / this.options.step)
      * this.options.columnWidth
      - this.options.columnWidth;
  }

  /**
   *
   */
  bindGridClick(): void {
    $.on(
      this.$svg,
      this.options.popupTrigger,
      '.grid-row, .grid-header',
      () => {
        this.unselectAll();
        this.hidePopup();
      },
    );
  }

  // eslint-disable-next-line max-lines-per-function
  bindBarEvents(): void {
    let isDragging = false;
    let xOnStart = 0;
    let isResizingLeft = false;
    let isResizingRight = false;
    let parentBarId: string | Bar = null;
    let draggingPlanned = false;
    let bars: Bar[] = []; // instanceof Bar
    this.barBeingDragged = null;

    function actionInProgress(): boolean {
      return isDragging || isResizingLeft || isResizingRight;
    }

    // @ts-ignore Weird sorcery. I don't touch it and it keeps working.
    $.on(this.$svg, 'mousedown', '.bar-wrapper, .bar-progress, .handle', (e, element) => {
      const barWrapper = $.closest('.bar-wrapper', element);

      if (element.classList.contains('left')) {
        isResizingLeft = true;
      } else if (element.classList.contains('right')) {
        isResizingRight = true;
      } else if (element.classList.contains('bar-wrapper')) {
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
        const $bar = draggingPlanned ? (bar.$plannedBar ?? bar.$bar) : bar.$bar;
        $bar.ox = $bar.getX();
        $bar.oy = $bar.getY();
        $bar.owidth = $bar.getWidth();
        $bar.finaldx = 0;
      });
    });

    $.on(this.$svg, 'mousemove', (e: MouseEvent) => {
      if (!actionInProgress()) return;
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
          } else {
            bar.updateBarPosition({
              x: $bar.ox + $bar.finaldx
            });
          }
        } else if (isResizingRight) {
          if (parentBarId === bar.task.id) {
            bar.updateBarPosition({
              width: $bar.owidth + $bar.finaldx
            });
          }
        } else if (isDragging) {
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
        if (!$bar.finaldx) return;
        bar.dateChanged();
        bar.setActionCompleted();
      });
    });

    this.bindBarProgress();
  }

  /**
   *
   */
  bindBarProgress(): void {
    let xOnStart = 0;
    let isResizing: boolean = null;
    let bar: Bar = null;
    let $barProgress: SVGElement = null;
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
      $barProgress.min_dx = -$barProgress.getWidth();
      $barProgress.max_dx = $bar.getWidth() - $barProgress.getWidth();
    });

    $.on(this.$svg, 'mousemove', (e: MouseEvent) => {
      if (!isResizing) return;
      let dx = e.offsetX - xOnStart;

      if (dx > $barProgress.max_dx) {
        dx = $barProgress.max_dx;
      }
      if (dx < $barProgress.min_dx) {
        dx = $barProgress.min_dx;
      }

      const $handle = bar.$handleProgress;
      $.attr($barProgress, 'width', $barProgress.owidth + dx);
      $.attr($handle, 'points', String(bar.getProgressPolygonPoints()));
      $barProgress.finaldx = dx;
    });

    $.on(this.$svg, 'mouseup', () => {
      isResizing = false;
      if (!($barProgress && $barProgress.finaldx)) return;
      bar.progressChanged();
      bar.setActionCompleted();
    });
  }

  /**
   *
   * @param task_id
   */
  getAllDependentTasks(task_id: string): string[] {
    let out: string[] = [];
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
  getSnapPosition(dx: number): number {
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
    } else if (this.isView(VIEW_MODE.MONTH)) {
      rem = dx % (this.options.columnWidth / 30);
      position = odx
        - rem
        + (rem < this.options.columnWidth / 60
          ? 0
          : this.options.columnWidth / 30);
    } else {
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
  unselectAll(): void {
    Array.from(this.$svg.querySelectorAll('.bar-wrapper'))
      .forEach((el) => {
        el.classList.remove('active');
      });
  }

  /**
   *
   * @param modes
   */
  isView(modes: ViewMode | ViewMode[]): boolean {
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
  getTask(id: string): ResolvedTask {
    return this.tasks.find((task) => task.id === id);
  }

  /**
   *
   * @param id
   */
  getBar(id: string): Bar {
    return this.bars.find((bar) => bar.task.id === id);
  }

  /**
   *
   * @param options
   */
  showPopup(options: PopupOptions): void {
    if (!this.popup) {
      this.popup = new Popup(
        this.popupWrapper,
        this.options.customPopupHtml,
      );
    }
    this.popup.show(options);
  }

  /**
   *
   */
  hidePopup(): void {
    if (this.popup) this.popup.hide();
  }

  /**
   *
   * @param event
   * @param args
   */
  triggerEvent(event: string, args: unknown): void {
    // @ts-ignore
    this.options[`on${event}`]?.apply(null, args);
  }

  /**
     * Gets the oldest starting date from the list of tasks
     *
     * @returns Date
     * @memberof Gantt
     */
  getOldestStartingDate(): Date {
    return this.tasks
      .map((task) => task.startResolved)
      .reduce((prev_date, cur_date) => (cur_date <= prev_date ? cur_date : prev_date),);
  }

  /**
     * Clear all elements from the parent svg element
     *
     * @memberof Gantt
     */
  clear(): void {
    this.$svg.innerHTML = '';
  }

  /**
   *
   * @param sortFn
   */
  setSortKey(sortFn?: (a: ResolvedTask, b: ResolvedTask) => number): void {
    this.sortKey = sortFn ?? ((a, b): number => a.id.localeCompare(b.id));
    this.sortTasks();
  }

  /**
   *
   */
  sortTasks(): void {
    const updatedTasks = this.tasks.sort(this.sortKey).map((task, newIndex) => {
      task.indexResolved = newIndex;

      return task;
    });
    this.refresh(updatedTasks);
  }
}

Gantt.VIEW_MODE = VIEW_MODE;
