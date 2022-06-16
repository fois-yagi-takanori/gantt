/**
 * 文字列の判定処理
 *  NULL,空文字、未定義
 *
 * @param str 対象文字列
 * @returns
 */
export function isNullOrEmpty(str) {
    return str === null || str === '' || str === undefined;
}
/**
 * 対象文字列がNULLであれば、デフォルト文字列を返却
 *
 * @param targetStr
 * @param defaultStr
 * @returns
 */
export function getDefaultString(targetStr, defaultStr) {
    if (!isNullOrEmpty(targetStr)) {
        return targetStr;
    }
    if (isNullOrEmpty(defaultStr)) {
        return '';
    }
    if (defaultStr === 'undefined') {
        return '';
    }
    return defaultStr;
}
//# sourceMappingURL=string-utils.js.map