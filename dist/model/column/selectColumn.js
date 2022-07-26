/**
 * リストボックスカラム
 *
 * @export
 * @class SelectColumn
 * @implements {SelectColumnProps}
 */
export default class SelectColumn {
    constructor() {
    }
    static createElement(options) {
        const parentElement = document.createElement('foreignObject');
        const selectElement = document.createElement('select');
        parentElement.setAttribute('width', '100');
        parentElement.setAttribute('height', '100');
        selectElement.classList.add('form-select');
        options.forEach((selectOption) => {
            const optionElement = document.createElement('option');
            optionElement.text = selectOption.label;
            optionElement.value = selectOption.value;
            selectElement.options.add(optionElement);
        });
        parentElement.appendChild(selectElement);
        return parentElement;
    }
    ;
}
//# sourceMappingURL=selectColumn.js.map