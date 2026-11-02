/**
 * Polyfill browser canvas and matrix APIs for Node.js server environments.
 * Required by pdfjs-dist / pdf-parse when running in Node.js container runtimes.
 */

if (typeof globalThis.DOMMatrix === "undefined") {
  class DOMMatrixPolyfill {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    is2D = true;
    isIdentity = true;

    constructor(init?: any) {
      if (Array.isArray(init)) {
        if (init.length === 6) {
          this.a = init[0];
          this.m11 = init[0];
          this.b = init[1];
          this.m12 = init[1];
          this.c = init[2];
          this.m21 = init[2];
          this.d = init[3];
          this.m22 = init[3];
          this.e = init[4];
          this.m41 = init[4];
          this.f = init[5];
          this.m42 = init[5];
          this.is2D = true;
        } else if (init.length === 16) {
          this.m11 = init[0];
          this.m12 = init[1];
          this.m13 = init[2];
          this.m14 = init[3];
          this.m21 = init[4];
          this.m22 = init[5];
          this.m23 = init[6];
          this.m24 = init[7];
          this.m31 = init[8];
          this.m32 = init[9];
          this.m33 = init[10];
          this.m34 = init[11];
          this.m41 = init[12];
          this.m42 = init[13];
          this.m43 = init[14];
          this.m44 = init[15];
          this.a = init[0];
          this.b = init[1];
          this.c = init[4];
          this.d = init[5];
          this.e = init[12];
          this.f = init[13];
          this.is2D = false;
        }
      }
    }

    multiply(other: any) {
      return this;
    }
    translate(tx = 0, ty = 0, tz = 0) {
      return this;
    }
    scale(scaleX = 1, scaleY?: number, scaleZ = 1) {
      return this;
    }
    rotate(rotX = 0, rotY?: number, rotZ?: number) {
      return this;
    }
    inverse() {
      return this;
    }
    transformPoint(point: any) {
      return point;
    }
    toFloat32Array() {
      return new Float32Array([
        this.m11, this.m12, this.m13, this.m14,
        this.m21, this.m22, this.m23, this.m24,
        this.m31, this.m32, this.m33, this.m34,
        this.m41, this.m42, this.m43, this.m44,
      ]);
    }
    toFloat64Array() {
      return new Float64Array([
        this.m11, this.m12, this.m13, this.m14,
        this.m21, this.m22, this.m23, this.m24,
        this.m31, this.m32, this.m33, this.m34,
        this.m41, this.m42, this.m43, this.m44,
      ]);
    }
  }

  (globalThis as any).DOMMatrix = DOMMatrixPolyfill;
}

if (typeof globalThis.ImageData === "undefined") {
  class ImageDataPolyfill {
    width = 0;
    height = 0;
    data = new Uint8ClampedArray(0);
    constructor(width = 0, height = 0) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  }
  (globalThis as any).ImageData = ImageDataPolyfill;
}

if (typeof globalThis.Path2D === "undefined") {
  class Path2DPolyfill {
    constructor(_path?: any) {}
    addPath(_path: any, _transform?: any) {}
    closePath() {}
    moveTo(_x: number, _y: number) {}
    lineTo(_x: number, _y: number) {}
    bezierCurveTo(_cp1x: number, _cp1y: number, _cp2x: number, _cp2y: number, _x: number, _y: number) {}
    quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number) {}
    arc(_x: number, _y: number, _radius: number, _startAngle: number, _endAngle: number, _counterclockwise?: boolean) {}
    arcTo(_x1: number, _y1: number, _x2: number, _y2: number, _radius: number) {}
    ellipse(_x: number, _y: number, _radiusX: number, _radiusY: number, _rotation: number, _startAngle: number, _endAngle: number, _counterclockwise?: boolean) {}
    rect(_x: number, _y: number, _w: number, _h: number) {}
  }
  (globalThis as any).Path2D = Path2DPolyfill;
}

export {};
