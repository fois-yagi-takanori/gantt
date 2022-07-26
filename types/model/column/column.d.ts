export interface Column {
    columnType: ColumnType;
    label: string;
    fieldName: string;
}
export declare type ColumnType = 'label' | 'select' | 'text' | 'calendar';
