import { Column } from './column';
import { SelectOption } from './selectOption';
export interface SelectColumnProps extends Column {
    options: SelectOption[];
    onChange?: () => void;
}
