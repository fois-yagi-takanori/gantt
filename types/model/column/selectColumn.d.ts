import { ColumnType } from './column';
import { CreateSVGAttrs } from '../../utils/svg.utils';
import { SelectColumnProps } from './selectColumnProps';
import { SelectOption } from './selectOption';
/**
 * リストボックスカラム
 *
 * @export
 * @class SelectColumn
 * @implements {SelectColumnProps}
 */
export declare class SelectColumn implements SelectColumnProps {
    element?: HTMLElement;
    options?: SelectOption[];
    columnType: ColumnType;
    label: string;
    fieldName: string;
    onChange?: () => void;
    static createElement(options: SelectOption[]): HTMLElement;
    constructor();
    attributes: CreateSVGAttrs;
}
