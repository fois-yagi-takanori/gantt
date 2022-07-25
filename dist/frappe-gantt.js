var Gantt = (function (Split) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var Split__default = /*#__PURE__*/_interopDefaultLegacy(Split);

    /**
     * 文字列の判定処理
     *  NULL,空文字、未定義
     *
     * @param str 対象文字列
     * @returns
     */
    function isNullOrEmpty(str) {
        return str === null || str === '' || str === undefined || String(str) === 'undefined';
    }
    /**
     * 対象文字列がNULLであれば、デフォルト文字列を返却
     *
     * @param targetStr
     * @param defaultStr
     * @returns
     */
    function getDefaultString(targetStr, defaultStr) {
        if (!isNullOrEmpty(targetStr)) {
            return targetStr;
        }
        if (isNullOrEmpty(defaultStr)) {
            return '';
        }
        return defaultStr;
    }

    /**
     *
     * @param expr
     * @param con
     */
    function $(expr, con) {
        return typeof expr === 'string'
            ? (con || document).querySelector(expr)
            : expr || null;
    }
    $.on = (element, event, selector, callback) => {
        if (typeof selector === 'function' || typeof selector === 'object') {
            // eslint-disable-next-line no-param-reassign
            callback = selector;
            $.bind(element, event, callback);
        }
        else {
            $.delegate(element, event, selector, callback);
        }
    };
    $.off = (element, event, handler) => {
        element.removeEventListener(event, handler);
    };
    $.bind = (element, event, callback) => {
        event.split(/\s+/).forEach((e) => {
            element.addEventListener(e, callback);
        });
    };
    $.delegate = (element, event, selector, callback) => {
        // eslint-disable-next-line func-names
        element.addEventListener(event, function (e) {
            // @ts-ignore
            const delegatedTarget = e.target.closest(selector);
            if (delegatedTarget) {
                // @ts-ignore
                e.delegatedTarget = delegatedTarget;
                // @ts-ignore
                callback.call(this, e, delegatedTarget);
            }
        });
    };
    $.closest = (selector, element) => {
        if (!element)
            return null;
        if (element.matches(selector)) {
            return element;
        }
        return $.closest(selector, element.parentElement);
    };
    $.attr = (element, attr, value) => {
        if (!value && typeof attr === 'string') {
            return element.getAttribute(attr);
        }
        if (typeof attr === 'object') {
            Object.keys(attr).forEach((key) => {
                $.attr(element, key, attr[key]);
            });
            return null;
        }
        element.setAttribute(attr, value);
        return null;
    };
    /**
     *
     * @param name
     */
    function cubicBezier(name) {
        return {
            ease: '.25 .1 .25 1',
            linear: '0 0 1 1',
            'ease-in': '.42 0 1 1',
            'ease-out': '0 0 .58 1',
            'ease-in-out': '.42 0 .58 1',
        }[name];
    }
    /**
     *
     * @param tag
     * @param attrs
     */
    function createSVG(tag, attrs) {
        const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.keys(attrs).forEach((attr) => {
            if (attr === 'append_to') {
                const parent = attrs.append_to;
                parent.appendChild(elem);
            }
            else {
                const val = attrs[attr];
                if (attr === 'innerHTML') {
                    elem.innerHTML = val;
                }
                else {
                    elem.setAttribute(attr, val);
                }
            }
        });
        return elem;
    }
    /**
     *
     * @param svgElement
     * @param attr
     * @param from
     * @param to
     * @param dur
     * @param begin
     */
    function getAnimationElement(svgElement, attr, from, to, dur = '0.4s', begin = '0.1s') {
        const animEl = svgElement.querySelector('animate');
        if (animEl) {
            $.attr(animEl, {
                attributeName: attr,
                from,
                to,
                dur,
                begin: `click + ${begin}`, // artificial click
            });
            return svgElement;
        }
        const animateElement = createSVG('animate', {
            attributeName: attr,
            from,
            to,
            dur,
            begin,
            calcMode: 'spline',
            values: `${from};${to}`,
            keyTimes: '0; 1',
            keySplines: cubicBezier('ease-out'),
        });
        svgElement.appendChild(animateElement);
        return svgElement;
    }
    /**
     *
     * @param svgElement
     * @param attr
     * @param from
     * @param to
     */
    function animateSVG(svgElement, attr, from, to) {
        const animatedSvgElement = getAnimationElement(svgElement, attr, from, to);
        if (animatedSvgElement === svgElement) {
            // triggered 2nd time programmatically
            // trigger artificial click event
            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
            });
            // const event = document.createEvent('HTMLEvents') as MouseEvent;
            // event.initEvent('click', true, true);
            // event.eventName = 'click';
            animatedSvgElement.dispatchEvent(event);
        }
    }

    /**
     *
     */
    class Arrow {
        /**
         * コンストラクタ
         *
         * @param gantt
         * @param fromTask
         * @param toTask
         */
        constructor(gantt, fromTask, toTask) {
            this.gantt = gantt;
            this.fromTask = fromTask;
            this.toTask = toTask;
            this.calculatePath();
            this.draw();
        }
        /**
         *
         */
        calculatePath() {
            let startX = this.fromTask.$bar.getX() + this.fromTask.$bar.getWidth() / 2;
            const condition = () => this.toTask.$bar.getX() < startX + this.gantt.options.padding
                && startX > this.fromTask.$bar.getX() + this.gantt.options.padding;
            while (condition()) {
                startX -= 10;
            }
            const startY = this.gantt.options.headerHeight
                + this.gantt.options.barHeight
                + (this.gantt.options.padding + this.gantt.options.barHeight)
                    * this.fromTask.task.indexResolved
                + this.gantt.options.padding;
            const endX = this.toTask.$bar.getX() - this.gantt.options.padding / 2;
            const endY = this.gantt.options.headerHeight
                + this.gantt.options.barHeight / 2
                + (this.gantt.options.padding + this.gantt.options.barHeight)
                    * this.toTask.task.indexResolved
                + this.gantt.options.padding;
            const fromIsBelowTo = this.fromTask.task.indexResolved > this.toTask.task.indexResolved;
            const curve = this.gantt.options.arrowCurve;
            const clockwise = fromIsBelowTo ? 1 : 0;
            const curveY = fromIsBelowTo ? -curve : curve;
            const offset = fromIsBelowTo
                ? endY + this.gantt.options.arrowCurve
                : endY - this.gantt.options.arrowCurve;
            this.path = `
            M ${startX} ${startY}
            V ${offset}
            a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curveY}
            L ${endX} ${endY}
            m -5 -5
            l 5 5
            l -5 5`;
            if (this.toTask.$bar.getX()
                < this.fromTask.$bar.getX() + this.gantt.options.padding) {
                const down1 = this.gantt.options.padding / 2 - curve;
                const down2 = this.toTask.$bar.getY()
                    + this.toTask.$bar.getHeight() / 2
                    - curveY;
                const left = this.toTask.$bar.getX() - this.gantt.options.padding;
                this.path = `
                M ${startX} ${startY}
                v ${down1}
                a ${curve} ${curve} 0 0 1 -${curve} ${curve}
                H ${left}
                a ${curve} ${curve} 0 0 ${clockwise} -${curve} ${curveY}
                V ${down2}
                a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curveY}
                L ${endX} ${endY}
                m -5 -5
                l 5 5
                l -5 5`;
            }
        }
        /**
         *
         */
        draw() {
            this.element = createSVG('path', {
                d: this.path,
                'data-from': this.fromTask.task.id,
                'data-to': this.toTask.task.id,
            });
        }
        /**
         *
         */
        update() {
            this.calculatePath();
            this.element.setAttribute('d', this.path);
        }
    }

    const YEAR = 'year';
    const MONTH = 'month';
    const DAY = 'day';
    const HOUR = 'hour';
    const MINUTE = 'minute';
    const SECOND = 'second';
    const MILLISECOND = 'millisecond';
    const monthNames = {
        ja: [
            '1月',
            '2月',
            '3月',
            '4月',
            '5月',
            '6月',
            '7月',
            '8月',
            '9月',
            '10月',
            '11月',
            '12月',
        ],
    };
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
    /**
     *
     * @param maybeStr
     * @param targetLength
     * @param padString
     */
    function padStart(maybeStr, targetLength, padString) {
        const str = `${maybeStr}`;
        let truncatedLength = Math.trunc(targetLength);
        let paddedString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (str.length > truncatedLength) {
            return String(str);
        }
        truncatedLength -= str.length;
        if (targetLength > paddedString.length) {
            paddedString += paddedString.repeat(truncatedLength / paddedString.length);
        }
        return paddedString.slice(0, truncatedLength) + String(str);
    }
    var dateUtils = {
        /**
         *
         * @param date
         * @param date_separator
         * @param time_separator
         */
        parse(date, date_separator = '-', time_separator = /[.:]/) {
            if (date instanceof Date) {
                return date;
            }
            if (typeof date === 'string') {
                const parts = date.split(' ');
                const dateParts = parts[0]
                    .split(date_separator)
                    .map((val) => parseInt(val, 10));
                const timeParts = parts[1] && parts[1].split(time_separator);
                // month is 0 indexed
                dateParts[1] -= 1;
                let values = dateParts;
                if (timeParts && timeParts.length) {
                    if (timeParts.length === 4) {
                        timeParts[3] = `0.${timeParts[3]}`;
                        timeParts[3] = parseFloat(timeParts[3]) * 1000;
                    }
                    values = values.concat(timeParts.map((v) => Number(v)));
                }
                // @ts-ignore
                return new Date(...values);
            }
            return null;
        },
        /**
         *
         * @param date
         * @param with_time
         */
        toString(date, with_time = false) {
            if (!(date instanceof Date)) {
                throw new TypeError('Invalid argument type');
            }
            const vals = this.getDateValues(date).map((val, i) => {
                if (i === 1) {
                    // add 1 for month
                    // eslint-disable-next-line no-param-reassign
                    val += 1;
                }
                if (i === 6) {
                    return padStart(`${val}`, 3, '0');
                }
                return padStart(`${val}`, 2, '0');
            });
            const dateString = `${vals[0]}-${vals[1]}-${vals[2]}`;
            const timeString = `${vals[3]}:${vals[4]}:${vals[5]}.${vals[6]}`;
            return dateString + (with_time ? ` ${timeString}` : '');
        },
        /**
         *
         * @param date
         * @param format_string
         * @param lang
         */
        format(date, format_string = 'YYYY-MM-DD HH:mm:ss.SSS', lang = 'ja') {
            if (!Object.keys(monthNames).includes(lang)) {
                throw new Error('Invalid Language');
            }
            const values = this.getDateValues(date).map((d) => padStart(d, 2, 0));
            const formatMap = {
                YYYY: values[0],
                MM: padStart(+values[1] + 1, 2, 0),
                DD: values[2],
                HH: values[3],
                mm: values[4],
                ss: values[5],
                SSS: values[6],
                D: values[2],
                MMMM: monthNames[lang][+values[1]],
                MMM: monthNames[lang][+values[1]],
            };
            let str = format_string;
            const formattedValues = [];
            Object.keys(formatMap)
                .sort((a, b) => b.length - a.length) // big string first
                .forEach((key) => {
                if (str.includes(key)) {
                    str = str.replace(key, `$${formattedValues.length}`);
                    formattedValues.push(formatMap[key]);
                }
            });
            formattedValues.forEach((value, i) => {
                str = str.replace(`$${i}`, value);
            });
            return str;
        },
        /**
         *
         * @param dateA
         * @param dateB
         * @param scale
         */
        diff(dateA, dateB, scale = DAY) {
            const milliseconds = Number(dateA) - Number(dateB);
            const seconds = milliseconds / 1000;
            const minutes = seconds / 60;
            const hours = minutes / 60;
            const days = hours / 24;
            const months = days / 30;
            const years = months / 12;
            if (!scale.endsWith('s')) {
                // eslint-disable-next-line no-param-reassign
                scale += 's';
            }
            return Math.floor({
                milliseconds,
                seconds,
                minutes,
                hours,
                days,
                months,
                years,
            }[scale]);
        },
        /**
         *
         */
        today() {
            const vals = this.getDateValues(new Date()).slice(0, 3);
            // @ts-ignore
            return new Date(...vals);
        },
        /**
         *
         */
        now() {
            return new Date();
        },
        /**
         *
         * @param date
         * @param qty
         * @param scale
         */
        add(date, qty, scale) {
            const numQty = typeof qty === 'string' ? parseInt(qty, 10) : qty;
            const vals = [
                date.getFullYear() + (scale === YEAR ? numQty : 0),
                date.getMonth() + (scale === MONTH ? numQty : 0),
                date.getDate() + (scale === DAY ? numQty : 0),
                date.getHours() + (scale === HOUR ? numQty : 0),
                date.getMinutes() + (scale === MINUTE ? numQty : 0),
                date.getSeconds() + (scale === SECOND ? numQty : 0),
                date.getMilliseconds() + (scale === MILLISECOND ? numQty : 0),
            ];
            // @ts-ignore
            return new Date(...vals);
        },
        /**
         *
         * @param date
         * @param scale
         */
        startOf(date, scale) {
            const scores = {
                [YEAR]: 6,
                [MONTH]: 5,
                [DAY]: 4,
                [HOUR]: 3,
                [MINUTE]: 2,
                [SECOND]: 1,
                [MILLISECOND]: 0,
            };
            /**
             *
             * @param newScale
             */
            function shouldReset(newScale) {
                const maxScore = scores[scale];
                return scores[newScale] <= maxScore;
            }
            const vals = [
                date.getFullYear(),
                shouldReset(YEAR) ? 0 : date.getMonth(),
                shouldReset(MONTH) ? 1 : date.getDate(),
                shouldReset(DAY) ? 0 : date.getHours(),
                shouldReset(HOUR) ? 0 : date.getMinutes(),
                shouldReset(MINUTE) ? 0 : date.getSeconds(),
                shouldReset(SECOND) ? 0 : date.getMilliseconds(),
            ];
            // @ts-ignore
            return new Date(...vals);
        },
        /**
         *
         * @param date
         */
        clone(date) {
            // @ts-ignore
            return new Date(...this.getDateValues(date));
        },
        /**
         *
         * @param date
         */
        getDateValues(date) {
            return [
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                date.getHours(),
                date.getMinutes(),
                date.getSeconds(),
                date.getMilliseconds(),
            ];
        },
        /**
         *
         * @param date
         */
        getDaysInMonth(date) {
            const numDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            const month = date.getMonth();
            if (month !== 1) {
                return numDays[month];
            }
            // Feb
            const year = date.getFullYear();
            if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
                return 29;
            }
            return 28;
        },
    };

    /**
     * バークラス
     */
    class Bar {
        /**
         *
         * @param gantt
         * @param task
         */
        constructor(gantt, task, index) {
            this.prepareHelpers = () => {
                /* eslint-disable func-names */
                /**
                 *
                 */
                SVGElement.prototype.getX = function () {
                    return +this.getAttribute('x');
                };
                /**
                 *
                 */
                SVGElement.prototype.getY = function () {
                    return +this.getAttribute('y');
                };
                /**
                 *
                 */
                SVGElement.prototype.getWidth = function () {
                    return +this.getAttribute('width');
                };
                /**
                 *
                 */
                SVGElement.prototype.getHeight = function () {
                    return +this.getAttribute('height');
                };
                /**
                 *
                 */
                SVGElement.prototype.getEndX = function () {
                    return this.getX() + this.getWidth();
                };
                /* eslint-enable func-names */
            };
            this.updateAttr = (element, attr, value) => {
                const numValue = Number(value);
                if (!Number.isNaN(numValue)) {
                    element.setAttribute(attr, String(value));
                }
                return element;
            };
            this.currentIndex = index;
            this.setDefaults(gantt, task);
            this.prepare();
            this.draw();
            this.bind();
        }
        /**
         *
         * @param gantt
         * @param task
         */
        setDefaults(gantt, task) {
            this.gantt = gantt;
            this.task = task;
        }
        /**
         *
         */
        prepare() {
            this.prepareValues();
            this.prepareHelpers();
        }
        /**
         *
         */
        prepareValues() {
            this.invalid = this.task.invalid;
            this.height = this.gantt.options.barHeight;
            this.x = this.computeX();
            this.y = this.computeY();
            this.cornerRadius = this.gantt.options.barCornerRadius;
            this.duration = dateUtils.diff(this.task.resultEndResolved, this.task.resultStartResolved, 'hour')
                / this.gantt.options.step;
            this.width = this.gantt.options.columnWidth * this.duration;
            this.progressWidth = this.gantt.options.columnWidth
                * this.duration
                * (this.task.progress / 100) || 0;
            this.group = createSVG('g', {
                class: `bar-wrapper ${this.task.customClass || ''}`,
                'data-id': this.task.id,
            });
            this.barGroup = createSVG('g', {
                class: 'bar-group',
                append_to: this.group,
            });
            this.handleGroup = createSVG('g', {
                class: 'handle-group',
                append_to: this.group,
            });
            this.plannedX = this.computeX(true);
            this.plannedY = this.computeY();
            this.plannedDuration = dateUtils.diff(this.task.plannedEndResolved, this.task.plannedStartResolved, 'hour')
                / this.gantt.options.step;
            this.plannedWidth = this.gantt.options.columnWidth * this.plannedDuration;
            this.plannedHandleGroup = createSVG('g', {
                class: 'handle-group',
                append_to: this.group,
            });
        }
        /**
         * 描画処理
         */
        draw() {
            this.drawBar();
            this.drawPlannedBar();
            this.drawProgressBar();
            this.drawLabel();
            this.drawResizeHandles();
        }
        /**
         * バー描画
         */
        drawBar() {
            this.$bar = createSVG('rect', {
                x: this.x,
                y: this.y + this.height,
                width: this.width,
                height: this.height,
                rx: this.cornerRadius,
                ry: this.cornerRadius,
                class: 'bar bar-actual',
                append_to: this.barGroup,
            });
            if (this.task.resultBarColor) {
                this.$bar.style.fill = this.task.resultBarColor;
            }
            animateSVG(this.$bar, 'width', 0, this.width);
            if (this.invalid) {
                this.$bar.classList.add('bar-invalid');
            }
        }
        /**
         * 予定バー描画
         */
        drawPlannedBar() {
            this.$plannedBar = createSVG('rect', {
                x: this.plannedX,
                y: this.plannedY,
                width: this.plannedWidth,
                height: this.height,
                rx: this.cornerRadius,
                ry: this.cornerRadius,
                class: 'bar planned',
                append_to: this.barGroup,
            });
            this.$plannedBar.style.fill = this.task.planColor;
            animateSVG(this.$plannedBar, 'width', 0, this.plannedWidth);
            if (this.invalid) {
                this.$plannedBar.classList.add('bar-invalid');
            }
        }
        /**
         *
         */
        drawProgressBar() {
            if (this.invalid)
                return;
            this.$barProgress = createSVG('rect', {
                x: this.x,
                y: this.y + this.height,
                width: this.progressWidth,
                height: this.height,
                rx: this.cornerRadius,
                ry: this.cornerRadius,
                class: 'bar-progress',
                append_to: this.barGroup,
            });
            if (this.task.progressColor)
                this.$barProgress.style.fill = this.task.progressColor;
            animateSVG(this.$barProgress, 'width', 0, this.progressWidth);
        }
        /**
         * タスク名表示
         */
        drawLabel() {
            const text = createSVG('text', {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2 + 20,
                innerHTML: this.task.name,
                class: 'bar-label',
                append_to: this.barGroup,
            });
            if (this.task.labelColor)
                text.style.fill = this.task.labelColor;
            // labels get BBox in the next tick
            requestAnimationFrame(() => this.updateLabelPosition());
        }
        /**
         *
         */
        drawResizeHandles() {
            if (this.invalid)
                return;
            const bar = this.$bar;
            const handleWidth = 8;
            createSVG('rect', {
                x: bar.getX() + bar.getWidth() - 9,
                y: bar.getY() + 1,
                width: handleWidth,
                height: this.height - 2,
                rx: this.cornerRadius,
                ry: this.cornerRadius,
                class: 'handle right',
                append_to: this.handleGroup,
            });
            createSVG('rect', {
                x: bar.getX() + 1,
                y: bar.getY() + 1,
                width: handleWidth,
                height: this.height - 2,
                rx: this.cornerRadius,
                ry: this.cornerRadius,
                class: 'handle left',
                append_to: this.handleGroup,
            });
            if (this.task.hasPlanned) {
                const plannedBar = this.$plannedBar;
                createSVG('rect', {
                    x: plannedBar.getX() + plannedBar.getWidth() - 9,
                    y: plannedBar.getY() + 1,
                    width: handleWidth,
                    height: this.height - 2,
                    rx: this.cornerRadius,
                    ry: this.cornerRadius,
                    class: 'handle right planned',
                    append_to: this.plannedHandleGroup,
                });
                createSVG('rect', {
                    x: plannedBar.getX() + 1,
                    y: plannedBar.getY() + 1,
                    width: handleWidth,
                    height: this.height - 2,
                    rx: this.cornerRadius,
                    ry: this.cornerRadius,
                    class: 'handle left planned',
                    append_to: this.plannedHandleGroup,
                });
            }
            if (this.task.progress && this.task.progress < 100) {
                this.$handleProgress = createSVG('polygon', {
                    points: this.getProgressPolygonPoints()
                        .join(','),
                    class: 'handle progress',
                    append_to: this.handleGroup,
                });
            }
        }
        /**
         *
         */
        getProgressPolygonPoints() {
            const barProgress = this.$barProgress;
            return [
                barProgress.getEndX() - 5,
                barProgress.getY() + barProgress.getHeight(),
                barProgress.getEndX() + 5,
                barProgress.getY() + barProgress.getHeight(),
                barProgress.getEndX(),
                barProgress.getY() + barProgress.getHeight() - 8.66,
            ];
        }
        /**
         *
         */
        bind() {
            if (this.invalid)
                return;
            this.setupHoverEvent();
        }
        /**
         *
         * @param root0
         * @param root0.x
         * @param root0.width
         */
        updateBarPosition({ x = null, width = null }) {
            const bar = this.$bar;
            if (x) {
                // get all x values of parent task
                const xs = this.task.dependencies.map((dep) => this.gantt.getBar(dep)
                    .$bar
                    .getX());
                // child task must not go before parent
                // @ts-ignore
                const validX = xs.reduce((_prev, curr) => x >= curr, x);
                if (!validX) {
                    // eslint-disable-next-line no-param-reassign
                    width = null;
                    return;
                }
                this.updateAttr(bar, 'x', x);
            }
            if (width && width >= this.gantt.options.columnWidth) {
                this.updateAttr(bar, 'width', width);
            }
            this.updateLabelPosition();
            this.updateHandlePosition();
            this.updateProgressbarPosition();
            this.updateArrowPosition();
        }
        /**
         *
         */
        dateChanged() {
            {
                let changed = false;
                const { newStartDate, newEndDate, } = this.computeStartEndDate();
                if (Number(this.task.resultStartResolved) !== Number(newStartDate)) {
                    changed = true;
                    this.task.resultStartResolved = newStartDate;
                }
                if (Number(this.task.resultEndResolved) !== Number(newEndDate)) {
                    changed = true;
                    this.task.resultEndResolved = newEndDate;
                }
                if (changed) {
                    this.gantt.triggerEvent('DateChange', [
                        this.task,
                        newStartDate,
                        dateUtils.add(newEndDate, -1, 'second'),
                        false,
                    ]);
                }
            }
            if (this.task.hasPlanned) {
                let changed = false;
                const { newStartDate, newEndDate, } = this.computeStartEndDate(true);
                if (Number(this.task.plannedStartResolved) !== Number(newStartDate)) {
                    changed = true;
                    this.task.plannedStartResolved = newStartDate;
                }
                if (changed) {
                    this.gantt.triggerEvent('DateChange', [
                        this.task,
                        newStartDate,
                        dateUtils.add(newEndDate, -1, 'second'),
                        true,
                    ]);
                }
            }
        }
        /**
         *
         */
        progressChanged() {
            const newProgress = this.computeProgress();
            this.task.progress = newProgress;
            this.gantt.triggerEvent('ProgressChange', [this.task, newProgress]);
        }
        /**
         *
         * @param planned
         */
        computeStartEndDate(planned = false) {
            const bar = planned ? this.$plannedBar : this.$bar;
            const xInUnits = Math.round(bar.getX() / this.gantt.options.columnWidth);
            const newStartDate = dateUtils.add(this.gantt.ganttStart, xInUnits * this.gantt.options.step, 'hour');
            const widthInUnits = bar.getWidth() / this.gantt.options.columnWidth;
            const newEndDate = dateUtils.add(newStartDate, widthInUnits * this.gantt.options.step, 'hour');
            return {
                newStartDate,
                newEndDate,
            };
        }
        /**
         *
         */
        computeProgress() {
            const progress = (this.$barProgress.getWidth() / this.$bar.getWidth()) * 100;
            return parseInt(String(progress), 10);
        }
        /**
         *
         * @param planned
         */
        computeX(planned = false) {
            const { step, columnWidth, } = this.gantt.options;
            const taskStart = planned ? this.task.plannedStartResolved : this.task.resultStartResolved;
            const { ganttStart } = this.gantt;
            let diff = dateUtils.diff(taskStart, ganttStart, 'hour');
            let x = (diff / step) * columnWidth;
            if (this.gantt.isView('Month')) {
                diff = dateUtils.diff(taskStart, ganttStart, 'day');
                x = (diff * columnWidth) / 30;
            }
            return x;
        }
        /**
         *
         */
        computeY() {
            return (this.gantt.options.headerHeight
                + this.gantt.options.padding
                + this.task.indexResolved * (this.height + this.gantt.options.padding + 20));
        }
        /**
         *
         * @param dx
         */
        getSnapPosition(dx) {
            const odx = dx;
            let rem;
            let position;
            if (this.gantt.isView('Week')) {
                rem = dx % (this.gantt.options.columnWidth / 7);
                position = odx
                    - rem
                    + (rem < this.gantt.options.columnWidth / 14
                        ? 0
                        : this.gantt.options.columnWidth / 7);
            }
            else if (this.gantt.isView('Month')) {
                rem = dx % (this.gantt.options.columnWidth / 30);
                position = odx
                    - rem
                    + (rem < this.gantt.options.columnWidth / 60
                        ? 0
                        : this.gantt.options.columnWidth / 30);
            }
            else {
                rem = dx % this.gantt.options.columnWidth;
                position = odx
                    - rem
                    + (rem < this.gantt.options.columnWidth / 2
                        ? 0
                        : this.gantt.options.columnWidth);
            }
            return position;
        }
        /**
         *
         */
        updateProgressbarPosition() {
            this.$barProgress.setAttribute('x', String(this.$bar.getX()));
            this.$barProgress.setAttribute('width', String(this.$bar.getWidth() * (this.task.progress / 100)));
        }
        /**
         *
         */
        updateLabelPosition() {
            const bar = this.$bar;
            const label = this.group.querySelector('.bar-label');
            if (label.getBBox().width > bar.getWidth()) {
                label.classList.add('big');
                label.setAttribute('x', String(bar.getX() + bar.getWidth() + 5));
            }
            else {
                label.classList.remove('big');
                label.setAttribute('x', String(bar.getX() + bar.getWidth() / 2));
            }
        }
        /**
         *
         */
        updateHandlePosition() {
            const bar = this.$bar;
            const plannedBar = this.$plannedBar;
            if (this.task.hasPlanned) {
                this.plannedHandleGroup
                    .querySelector('.handle.left')
                    .setAttribute('x', String(plannedBar.getX() + 1));
                this.plannedHandleGroup
                    .querySelector('.handle.right')
                    .setAttribute('x', String(plannedBar.getEndX() - 9));
            }
            this.handleGroup
                .querySelector('.handle.left')
                .setAttribute('x', String(bar.getX() + 1));
            this.handleGroup
                .querySelector('.handle.right')
                .setAttribute('x', String(bar.getEndX() - 9));
            const handle = this.group.querySelector('.handle.progress');
            if (handle) {
                handle.setAttribute('points', this.getProgressPolygonPoints()
                    .join(','));
            }
        }
        /**
         *
         */
        updateArrowPosition() {
            this.arrows = this.arrows || [];
            this.arrows.forEach((arrow) => {
                arrow.update();
            });
        }
        /**
         *
         */
        setupHoverEvent() {
            $.on(this.task.gridRow, 'mousemove', () => {
                // Mouse is not hovering over any elements.
                this.setHover(false, false);
            });
            $.on(this.group, 'mousemove', (e) => {
                let mainHover = false;
                let plannedHover = false;
                const bar = this.$bar;
                if (e.buttons % 2 === 1) {
                    this.setHover(false, false);
                    return;
                }
                if (e.offsetX >= bar.getX() && e.offsetX <= bar.getEndX()) {
                    mainHover = true;
                    // if (e.offsetX <= this.computeX() + this.progressWidth) {
                    //   progressHover = true;
                    // }
                }
                if (this.task.hasPlanned) {
                    const plannedBar = this.$plannedBar;
                    if (e.offsetX >= plannedBar.getX() && e.offsetX <= plannedBar.getEndX()) {
                        plannedHover = true;
                    }
                }
                this.setHover(mainHover, plannedHover);
            });
        }
        /**
         *
         * @param main
         * @param planned
         */
        setHover(main, planned) {
            if (main) {
                this.interactionTarget = 'main';
                this.handleGroup.classList.add('visible');
                if (this.plannedHandleGroup)
                    this.plannedHandleGroup.classList.remove('visible');
            }
            else if (planned) {
                this.interactionTarget = 'planned';
                this.handleGroup.classList.remove('visible');
                if (this.plannedHandleGroup)
                    this.plannedHandleGroup.classList.add('visible');
            }
            else {
                this.interactionTarget = null;
                this.handleGroup.classList.remove('visible');
                if (this.plannedHandleGroup)
                    this.plannedHandleGroup.classList.remove('visible');
            }
        }
    }

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
    class Gantt {
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
            Split__default["default"]({
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
            this.tasks.forEach((task) => {
                const posY = 15
                    + this.options.headerHeight
                    + this.options.padding
                    + task.indexResolved * (this.options.barHeight + this.options.padding + 20);
                x = 60;
                this.options.columns.forEach((column) => {
                    createSVG('text', {
                        x,
                        y: posY,
                        innerHTML: getDefaultString(String(task[column.fieldName])),
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

    return Gantt;

})(Split);
//# sourceMappingURL=frappe-gantt.js.map
