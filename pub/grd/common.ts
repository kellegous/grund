// sobel filter kenels
var Dx = [
  [-1,  0,  1],
  [-2,  0,  2],
  [-1,  0,  1]
];

var Dy = [
  [-1, -2, -1],
  [ 0,  0,  0],
  [ 1,  2,  1]
];

// An overly simple Vector class
class Vec {
  i : number;
  j : number;

  static mag(i : number, j : number) : number {
    return Math.sqrt(i * i + j * j);
  }

  static normalize(i : number, j : number, dst : Vec) : Vec {
    var m = Vec.mag(i, j);
    dst.i = i / m;
    dst.j = j / m;
    return dst;
  }
}

// An overly simple rgb color model
class Rgb {
  r : number;
  g : number;
  b : number;

  static set(r : number, g : number, b : number, dst : Rgb) : Rgb {
    dst.r = r;
    dst.g = g;
    dst.b = b;
    return dst;
  }

  static luminance(r : number, g : number, b : number) : number {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  static invert(r : number, g : number, b : number, dst : Rgb) : Rgb {
    return Rgb.set(255-r, 255-g, 255-b, dst);
  }

  static gray(r : number, g : number, b : number, dst : Rgb) : Rgb {
    var l = Rgb.luminance(r, g, b);
    return Rgb.set(l, l, l, dst);
  }

  static css(r : number, g : number, b : number) : string {
    return 'rgb(' + (r|0) + ',' + (g|0) + ',' + (b|0) + ')';
  }
}

var convolve = function(data : ImageData, x : number, y : number, k : number[][]) : number {
  var s = 0,
      w = data.width,
      h = data.height,
      st = data.width * 4,
      px = data.data;
  for (var j = 0; j < 3; j++) {
    for (var i = 0; i < 3; i++) {
      var sx = x + i - 1,
          sy = y + j - 1,
          ix = st * sy + 4 * sx;
      if (sx >= w || sx < 0 || sy >= h || sy < 0) {
        continue;
      }

      var r = px[ix],
          g = px[ix + 1],
          b = px[ix + 2];
      s += k[j][i] * Rgb.luminance(r, g, b);
    }
  }

  return s;
};