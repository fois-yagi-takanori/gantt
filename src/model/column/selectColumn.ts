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
export class SelectColumn implements SelectColumnProps {
  element?: HTMLElement;
  options?: SelectOption[];
  columnType: ColumnType;
  label: string;
  fieldName: string;

  onChange?: () => void;

  static createElement(options: SelectOption[]): HTMLElement {
    const parentElement = document.createElement('foreignObject');
    const selectElement = document.createElement('select');
    parentElement.setAttribute('width', '100');
    parentElement.setAttribute('height', '100');
    selectElement.classList.add('form-select');

    options.forEach((selectOption: SelectOption) => {
      const optionElement = document.createElement('option');
      optionElement.text = selectOption.label;
      optionElement.value = selectOption.value;
      selectElement.options.add(optionElement);
    });

    parentElement.appendChild(selectElement);

    return parentElement;
  };

  constructor() {

  }
  attributes: CreateSVGAttrs;
}