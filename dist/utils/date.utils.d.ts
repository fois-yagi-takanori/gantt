export declare type Language = 'ja';
declare const _default: {
    /**
     *
     * @param date
     * @param date_separator
     * @param time_separator
     */
    parse(date: String | Date, date_separator?: string, time_separator?: RegExp): Date | null;
    /**
     *
     * @param date
     * @param with_time
     */
    toString(date: Date, with_time?: boolean): string;
    /**
     *
     * @param date
     * @param format_string
     * @param lang
     */
    format(date: Date, format_string?: string, lang?: Language): string;
    /**
     *
     * @param dateA
     * @param dateB
     * @param scale
     */
    diff(dateA: number | Date, dateB: number | Date, scale?: string): number;
    /**
     *
     */
    today(): Date;
    /**
     *
     */
    now(): Date;
    /**
     *
     * @param date
     * @param qty
     * @param scale
     */
    add(date: Date, qty: string | number, scale: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'): Date;
    /**
     *
     * @param date
     * @param scale
     */
    startOf(date: Date, scale: string): Date;
    /**
     *
     * @param date
     */
    clone(date: Date): Date;
    /**
     *
     * @param date
     */
    getDateValues(date: Date): number[];
    /**
     *
     * @param date
     */
    getDaysInMonth(date: Date): number;
};
export default _default;
