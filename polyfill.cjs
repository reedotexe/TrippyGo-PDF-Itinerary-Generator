/**
 * Early-boot Polyfill for Node.js V8 runtime.
 * Preloaded via `node -r ./polyfill.cjs server.js`
 * Provides browser graphics APIs expected by pdfjs-dist / pdf-parse.
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

    constructor(init) {
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

    multiply() {
      return this;
    }
    translate() {
      return this;
    }
    scale() {
      return this;
    }
    rotate() {
      return this;
    }
    inverse() {
      return this;
    }
    transformPoint(point) {
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

  globalThis.DOMMatrix = DOMMatrixPolyfill;
  if (typeof global !== "undefined") {
    global.DOMMatrix = DOMMatrixPolyfill;
  }
}

if (typeof globalThis.ImageData === "undefined") {
  class ImageDataPolyfill {
    constructor(width = 0, height = 0) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  }
  globalThis.ImageData = ImageDataPolyfill;
  if (typeof global !== "undefined") {
    global.ImageData = ImageDataPolyfill;
  }
}

if (typeof globalThis.Path2D === "undefined") {
  class Path2DPolyfill {
    constructor() {}
    addPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    arcTo() {}
    ellipse() {}
    rect() {}
  }
  globalThis.Path2D = Path2DPolyfill;
  if (typeof global !== "undefined") {
    global.Path2D = Path2DPolyfill;
  }
}
