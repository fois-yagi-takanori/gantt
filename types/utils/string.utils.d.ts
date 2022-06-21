/**
 * 文字列の判定処理
 *  NULL,空文字、未定義
 *
 * @param str 対象文字列
 * @returns
 */
export declare function isNullOrEmpty(str: string): boolean;
/**
 * 対象文字列がNULLであれば、デフォルト文字列を返却
 *
 * @param targetStr
 * @param defaultStr
 * @returns
 */
export declare function getDefaultString(targetStr: string, defaultStr?: string): string;
