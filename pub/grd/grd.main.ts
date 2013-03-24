/// <reference path="../../lib/jquery.d.ts" />
module grd {

interface Rect {
  x : number;
  y : number;
  w : number;
  h : number;
}

interface Size {
  width : number;
  height : number;
}

var LoadImage = function(url : string,
    whenDone : (im : HTMLImageElement) => void) : HTMLImageElement {
  var im = <HTMLImageElement>document.createElement('img');
  im.src = url;
  im.addEventListener('load', () => {
    whenDone(im);
  }, false);
  im.addEventListener('error', () => {
    whenDone(null);
  }, false);
  return im;
};

var Canvas = function() : CanvasRenderingContext2D {
  var w = window.innerWidth,
      h = window.innerHeight;
  var canvas = $(document.createElement('canvas'))
    .attr('width', w)
    .attr('height', h)
    .css('position', 'absolute')
    .css('top', 0)
    .css('left', 0)
    .appendTo($(document.body));
  return canvas.get(0).getContext('2d');
};


// Returns the required source rectangle to paint an image using a 'cover'
// strategy.
var Cover = function(src : Size, dst : Size) : Rect {
  var sar = src.width / src.height;
  var dar = dst.width / dst.height;

  if (sar > dar) {
    // top/bottom anchored.
    var w = src.height * dar;
    return {
      x : (src.width - w) / 2,
      y : 0,
      w : w,
      h : src.height
    };
  } else {
    // left/right anchored.
    var h = src.width/dar;
    return {
      x : 0,
      y : (src.height - h) / 2,
      w : src.width,
      h : h
    };
  }
};

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

var DROPPER_WIDTH = 200;
var DROPPER_HEIGHT = 200;
var MAX_MAG = Math.sqrt(255 * 255 + 255 * 255);

// A dropper view component
class Dropper {

  private elm : JQuery;
  private cnv : JQuery;
  private ctx : CanvasRenderingContext2D;
  private x : number;
  private y : number;
  private sz : Size;

  private cRot : number = 0;
  private tRot : number = 0;
  private animator : number = -1;
  
  constructor(private model : Model) {
    var canv = $(document.createElement('canvas'))
      .attr('width', DROPPER_WIDTH)
      .attr('height', DROPPER_HEIGHT);
    var elem = $(document.createElement('div'))
      .addClass('dropper')
      .append(canv)
      .appendTo($(document.body));
    var arrw = $(document.createElement('div'))
      .addClass('arrow')
      .append($(document.createElement('div')))
      .appendTo(elem);
    this.elm = elem;
    this.cnv = canv;
    this.ctx = canv.get(0).getContext('2d');
    this.sz = elem.get(0).getBoundingClientRect();

    model.imageDidLoad.wireTo((model) => {
      this.renderAt(this.x, this.y);
    });
  }

  private rotateTo(c, d) : void {
    this.cnv.css('-webkit-transform', 'rotate(' + c + 'deg)');
    if (Math.abs(d - this.cRot) > 180) {
      d += 360;
    }

    this.tRot = d;
    if (this.animator != -1) {
      return;
    }

    var last = Date.now();
    var rate = 45 / 200;
    var f = () => {
      var elapsed = Date.now() - last,
          diff = this.tRot - this.cRot,
          magn = Math.min(rate * elapsed, Math.abs(diff));
      this.animator = -1;
      this.cRot += diff < 0 ? -magn : magn;
      this.elm.css('-webkit-transform', 'translate(' + this.x + 'px,' + this.y + 'px)'
        + ' rotate(' + this.cRot + 'deg)');
      if (Math.abs(this.cRot - this.tRot) > 0.1) {
        this.animator = requestAnimationFrame(f);
      }
    };

    requestAnimationFrame(f);
  }

  private moveTo(x : number, y : number) : void {
    this.x = x;
    this.y = y;

    var t = (y - this.sz.height) <= 0;
    var b = (y + this.sz.height) >= window.innerHeight;
    var l = (x - this.sz.width / 2) <= 0;
    var r = (x + this.sz.width / 2) >= window.innerWidth;

    if (t && l) {
      this.rotateTo(180, 135);
    } else if (t && r) {
      this.rotateTo(180, -135);
    } else if (b && l) {
      this.rotateTo(0, 45);
    } else if (b && r) {
      this.rotateTo(0, -45);
    } else if (t) {
      this.rotateTo(180, 180);
    } else if (l) {
      this.rotateTo(-90, 90);
    } else if (r) {
      this.rotateTo(90, -90);
    } else {
      this.rotateTo(0, 0);
    }

    // off the top?
    if (y - this.sz.height < 0) {
      console.log('off the top');
    }
    this.elm.css('-webkit-transform', 'translate(' + x + 'px,' + y + 'px)'
      + ' rotate(' + this.cRot + 'deg)');
  }


  show() : void {
    this.elm.fadeIn(200);
  }

  hide() : void {
    this.elm.fadeOut(200);
  }

  renderAt(x : number, y : number) : void {
    var elm = this.elm,
        ctx = this.ctx,
        model = this.model,
        dx = (DROPPER_WIDTH+1) / 5,
        dy = (DROPPER_HEIGHT+1) / 5,
        w = model.width(),
        h = model.height(),
        v = new Vec,
        c = new Rgb;

    // var ix = y * data.width * 4 + x * 4;
    this.moveTo(x, y);
    // elm.css('-webkit-transform', 'translate(' + x + 'px,' + y + 'px)');
  
    // fill the background
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, w, h);

    // draw a 5x5 zoomed kernel
    for (var j = -2; j <= 2; j++) {
      for (var i = -2; i <= 2; i++) {
        var sx = (x + i),
            sy = (y + j);
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) {
          // paint it black.
          continue;
        }

        // draw the pixel
        model.colorAt(sx, sy, c);
        ctx.fillStyle = Rgb.css(c.r, c.g, c.b);
        ctx.fillRect((i + 2) * dx, (j + 2) * dy, dx - 1, dy - 1);

        // compute the gradient
        model.gradientAt(sx, sy, v);
        var m = 12 * Vec.mag(v.i, v.j) / MAX_MAG;
        Vec.normalize(v.i, v.j, v);

        Rgb.invert(c.r, c.g, c.b, c);
        Rgb.gray(c.r, c.g, c.b, c);
        var cx = (i + 2) * dx + dx / 2,
            cy = (j + 2) * dy + dy / 2,
            iv = Rgb.css(c.r, c.g, c.b);

        // draw the vector
        ctx.strokeStyle = iv;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (2 + m) * v.i, cy + (2 + m) * v.j);
        ctx.stroke();

        ctx.fillStyle = iv;
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
}

class Signal {
  listeners : { (args : any[]) : void; } [] = [];

  wireTo(l : (arg : any[]) => void) : void {
    this.listeners = this.listeners.slice(0);
    this.listeners.push(l);
  }

  unwireFrom(l : (arg : any[]) => void) : void {
    var ix = this.listeners.indexOf(l);
    if (ix == -1) {
      return;
    }

    this.listeners = this.listeners.slice(0);
    this.listeners.splice(ix, 1);
  }

  raise(...args : any[]) : void {
    this.listeners.forEach((l) => {
      l(args);
    });
  }
}


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

class Model {
  image : HTMLImageElement;
  data  : ImageData;
  imageNeedsData : (im : HTMLImageElement) => ImageData;

  private stride : number;

  imageDidLoad : Signal = new Signal;

  constructor(imageNeedsData : (im : HTMLImageElement) => ImageData) {
    this.imageNeedsData = imageNeedsData;
  }

  colorAt(x : number, y : number, dst : Rgb) : Rgb {
    var ix = this.stride * y + x * 4,
        px = this.data.data;
    return Rgb.set(px[ix], px[ix + 1], px[ix + 2], dst);
  }

  private kernel(x : number, y : number, k : number[][], c : Rgb) : number {
    var s = 0,
        w = this.width(),
        h = this.height();
    for (var j = 0; j < 3; j++) {
      for (var i = 0; i < 3; i++) {
        var sx = x + i - 1,
            sy = y + j - 1;
        if (sx >= w || sx < 0 || sy >= h || sy < 0) {
          continue;
        }
        this.colorAt(x + i - 1, y + j - 1, c);
        s += k[i][j] * Rgb.luminance(c.r, c.g, c.b);
      }
    }
    return s * 0.25;
  }

  gradientAt(x : number, y : number, dst : Vec) : Vec {
    var c = new Rgb;
    dst.j = -this.kernel(x, y, Dx, c);
    dst.i = -this.kernel(x, y, Dy, c);
    return dst;
  }

  loadFrom(url : string) : void {
    LoadImage(url, (im) => {
      this.image = im;
      this.reload();
    });
  }

  reload() : void {
    this.data = this.imageNeedsData(this.image);
    this.stride = this.data.width * 4;
    this.imageDidLoad.raise(this);
  }

  width() : number {
    return this.data.width;
  }

  height() : number {
    return this.data.height;
  }
}

var setupControls = (ctx : CanvasRenderingContext2D, model : Model) => {
  var ctrlActive = false,
      dropperActive = true;

  $('#ctrl')
    .on('mouseover', (e) => {
      ctrlActive = true;
      dropper.hide();
    })
    .on('mouseout', (e) => {
      ctrlActive = false;
      setTimeout(() => {
        if (ctrlActive || !dropperActive) {
          return;
        }

        dropper.show();
      }, 0);
    });

  $('#hide-dropper').click(function(e) {
    dropperActive = !dropperActive;
    $(this).text(dropperActive ? 'Hide Dropper' : 'Show Dropper');
  });

  $('#mask-filter').click(function(e) {
    var w = model.width(),
        h = model.height(),
        s = w * 4,
        d = ctx.createImageData(w, h),
        v = new Vec;
    // the buffer is initialized to full black.
    for (var j = 0; j < h; j++) {
      for (var i = 0; i < w; i++) {
        model.gradientAt(i, j, v);
        d.data[s * j + 4 * i + 3] = Vec.mag(v.i, v.j);
      }
    }
    console.log(d.data[0], d.data[1], d.data[2], d.data[3],
                d.data[4], d.data[5], d.data[6], d.data[7]);
  });
};


// var IMAGE = '305742748_3d66ddddc8_o.jpg';
// var IMAGE = 'test.jpg';
// var IMAGE = '5773391228_821cbd4596_o.jpg';
var IMAGE = '7800614334_54207fa424_h.jpg';

var context = Canvas(),
    model = new Model((im) => {
      var canvas = context.canvas,
          w = window.innerWidth,
          h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      var rect = Cover(im, canvas);
      context.drawImage(im,
        rect.x, rect.y, rect.w, rect.h,
        0, 0, w, h);
      return context.getImageData(0, 0, w, h);
    }),
    dropper = new Dropper(model);

model.loadFrom(IMAGE);
setupControls(context, model);

$(document).on('mousemove', (e) => {
  dropper.renderAt(e.pageX, e.pageY);
});

$(window).on('resize', (e) => {
  model.reload();
});

}