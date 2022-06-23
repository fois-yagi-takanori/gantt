export {};

declare global {
  interface SVGElement {
    getX(): number;
    getY(): number;
    getWidth(): number;
    getHeight(): number;
    getEndX(): number;
    ox: number;
    oy: number;
    owidth: number;
    oheight: number;
    finaldx: number;
    minDx: number;
    maxDx: number;
  }
}
