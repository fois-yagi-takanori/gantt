/**
 * 文字列の判定処理
 *  NULL,空文字、未定義
 *
 * @param str 対象文字列
 * @returns
 */
export function isNullOrEmpty(str: string): boolean {
  return str === null || str === '' || str === undefined || String(str) === 'undefined';
}

/**
 * 対象文字列がNULLであれば、デフォルト文字列を返却
 *
 * @param targetStr
 * @param defaultStr
 * @returns
 */
export function getDefaultString(targetStr: string, defaultStr?: string): string {
  if (!isNullOrEmpty(targetStr)) {
    return targetStr;
  }

  if (isNullOrEmpty(defaultStr)) {
    return '';
  }

  return defaultStr;
}
