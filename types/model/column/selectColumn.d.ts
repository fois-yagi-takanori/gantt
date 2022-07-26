import { ColumnType } from './column';
import { SelectColumnProps } from './selectColumnProps';
import { SelectOption } from './selectOption';
/**
 * リストボックスカラム
 *
 * @export
 * @class SelectColumn
 * @implements {SelectColumnProps}
 */
export default class SelectColumn implements SelectColumnProps {
    element: HTMLElement;
    options: SelectOption[];
    columnType: ColumnType;
    label: string;
    fieldName: string;
    onSelectChange: () => void;
    static createElement(options: SelectOption[]): HTMLElement;
    constructor();
}
