import { ColumnType } from './column';
import { CreateSVGAttrs } from './../../utils/svg.utils';
import { LabelColumnProps } from './labelColumnProps';
/**
 * ラベルカラム
 *
 * @export
 * @class LabelColumn
 * @implements {LabelColumnProps}
 */
export declare class LabelColumn implements LabelColumnProps {
    onClick?: () => void;
    columnType: ColumnType;
    label: string;
    fieldName: string;
    attributes?: CreateSVGAttrs;
    constructor();
}
