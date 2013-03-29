/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="common.ts" />

// standard raf polyfill
(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
        || window[vendors[x]+'CancelRequestAnimationFrame'];
  }
  
  if (!window.requestAnimationFrame)
    window['requestAnimationFrame'] = function(callback, element) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = window.setTimeout(function() { callback(currTime + timeToCall); },
    timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}());

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

var txRotate = function(e : JQuery, deg : number) : JQuery {
  var t = 'rotate(' + deg + 'deg)';
  return e.css('-webkit-transform', t)
    .css('-moz-transform', t)
    .css('-o-transform', t)
    .css('-ms-transform', t);
}

var txTranslate = function(e : JQuery, tx : number, ty : number, deg : number) : JQuery {
  var t = 'translate(' + tx + 'px,' + ty + 'px) rotate(' + deg + 'deg)';
  return e.css('-webkit-transform', t)
    .css('-moz-transform', t)
    .css('-o-transform', t)
    .css('-ms-transform', t);
}

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
  private showing = true;

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
    txRotate(this.cnv, c);
    this.tRot = d;

    if (this.tRot - this.cRot > 180) {
      this.cRot += 360;
    } else if (this.tRot - this.cRot < -180) {
      this.cRot -= 360;
    }

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
      txTranslate(this.elm, this.x, this.y, this.cRot);
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
      this.rotateTo(180, 225);
    } else if (b && l) {
      this.rotateTo(0, 45);
    } else if (b && r) {
      this.rotateTo(0, 315);
    } else if (t) {
      this.rotateTo(180, 180);
    } else if (l) {
      this.rotateTo(-90, 90);
    } else if (r) {
      this.rotateTo(90, 270);
    } else {
      this.rotateTo(0, 0);
    }

    txTranslate(this.elm, x, y, this.cRot);
  }


  show() : void {
    if (this.showing) {
      return;
    }
    this.showing = true;
    this.elm.fadeIn(200);
  }

  hide() : void {
    if (!this.showing) {
      return;
    }
    this.showing = false;
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


class Model {
  image : HTMLImageElement;
  data  : ImageData;

  private desc : string;
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

  gradientAt(x : number, y : number, dst : Vec) : Vec {
    dst.j = -convolve(this.data, x, y, Dx) * 0.25;
    dst.i = -convolve(this.data, x, y, Dy) * 0.25;
    return dst;
  }

  loadFrom(url : string, desc : string) : void {
    this.desc = desc;
    LoadImage(url, (im) => {
      this.image = im;
      this.reload();
    });
  }

  reload() : void {
    this.data = this.imageNeedsData(this.image);
    this.stride = this.data.width * 4;
    this.imageDidLoad.raise(this, 'http://www.flickr.com/photos/' + this.desc);
  }

  width() : number {
    return this.data.width;
  }

  height() : number {
    return this.data.height;
  }
}


class View {
  private bg = new Bg;
  private ctx = Canvas();
  private dropper : Dropper;

  private menuShowing = false;
  private edgesShowing = false;
  private dropperEnabled = true;

  private ctrlTop : number;

  private im : HTMLImageElement;

  private escKey : (e : KeyboardEvent) => void;
  private clickOut : (e : Event) => void;

  constructor(private model : Model) {
    this.dropper = new Dropper(model);

    // listen for loads
    model.imageDidLoad.wireTo((args : any[]) => {
      this.imageDidLoad(args[0], args[1]);
    });

    // patch up the menu so that images show
    var picks = $('#menu > .pick').each((i, e) => {
      var j = $(e);
      j.css('background-image', 'url(' + j.attr('data-url') + ')');
    });


    this.ctrlTop = $('#ctrl').get(0).getBoundingClientRect().top;

    this.escKey =  (e : KeyboardEvent) => {
      if (e.keyCode != 27 /* esc */) {
        return;
      }
      this.hideMenu();
    };

    this.clickOut = (e: Event) => {
      var m = $('#menu').get(0);
      if (m == e.target || $.contains(m, <HTMLElement>e.target)) {
        return;
      }
      this.hideMenu();
    };

    // bind event handlers
    this.bind();

    var f = $(picks.get(0));
    model.loadFrom(f.attr('data-url'), f.attr('data-id'));
  }

  paint() : void {
    var canvas = this.ctx.canvas,
        im = this.im,
        w = canvas.width,
        h = canvas.height;
    var rect = Cover(im, canvas);
    this.ctx.drawImage(im,
      rect.x, rect.y, rect.w, rect.h,
      0, 0, w, h);
  }

  imageNeedsData(im : HTMLImageElement) : ImageData {
    var ctx = this.ctx,
        canvas = ctx.canvas,
        w = window.innerWidth,
        h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    this.im = im;
    this.paint();
    return ctx.getImageData(0, 0, w, h);
  }

  private bind() : void {
    var view = this;

    // toggle dropper
    $('#hide-dropper').click(function(e) {
      var enabled = view.dropperEnabled;
      if (enabled) {
        view.dropperEnabled = false;
        $(this).text('Show Dropper');
      } else {
        view.dropperEnabled = true;
        $(this).text('Hide Dropper');
      }
    });

    // show filter
    $('#mask-filter').click(function(e) {
      if (view.edgesShowing) {
        view.hideEdges();
        $(this).text('Highlight Edges');
      } else {
        view.showEdges();
        $(this).text('Restore Original');
      }
    });

    $('#pick-image').click(function(e) {
      if (view.menuShowing) {
        view.hideMenu();
      } else {
        view.showMenu();
      }
    });

    $('#menu').click((e) => {
      var t = $(e.target);
      if (!t.hasClass('pick')) {
        return;
      }
      this.model.loadFrom(t.attr('data-url'), t.attr('data-id'));
      this.hideMenu();
    });

    // have the dropper track the mouse
    $(document).on('mousemove', (e) => {
      if (this.im == null) {
        return;
      }

      var x = e.pageX,
          y = e.pageY;
      if (y >= this.ctrlTop || !this.dropperEnabled || this.menuShowing) {
        this.dropper.hide();
        return;
      }

      this.dropper.show();
      this.dropper.renderAt(x, y);
    });

    // have resizes reload the model
    $(window).on('resize', (e) => {
      this.model.reload();
    });
  }

  private showEdges() : void {
    this.edgesShowing = true;
    this.bg.cancel().submit(this.model.data, (d) => {
      var ctx = this.ctx,
          model = this.model,
          w = model.width(),
          h = model.height();

      var nim = $(document.createElement('canvas'))
        .attr('width', w)
        .attr('height', h)
        .get(0).getContext('2d');
      nim.putImageData(d, 0, 0);

      ctx.save();
      ctx.drawImage(ctx.canvas, 0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(nim.canvas, 0, 0, w, h);
      ctx.restore();
    });
  }

  private hideEdges() : void {
    this.edgesShowing = false;
    this.bg.cancel();
    this.paint();
  }

  private showMenu() : void {
    // TODO(knorton): Install dismisser
    var pr = $('#pick-image').get(0).getBoundingClientRect();
    $('#menu').css('bottom', 100)
      .css('left', pr.left + pr.width / 2 - 408 / 2)
      .addClass('active');
    document.addEventListener('click', this.clickOut, true);
    document.addEventListener('keydown', this.escKey, true);
    this.menuShowing = true;
  }

  private hideMenu() : void {
    $('#menu').removeClass('active');
    document.removeEventListener('click', this.clickOut, true);
    document.removeEventListener('keydown', this.escKey, true);
    this.menuShowing = false;
  }

  private imageDidLoad(model : Model, url : string) : void {
    if (this.edgesShowing) {
      this.showEdges();
    }

    $('#attr').attr('href', url).text(url);
  }
}


class Bg {
  private worker : Worker = new Worker('edger.js');
  private id : number = 0;
  private cb : { (data : ImageData) : void; }[] = [];

  constructor() {
    this.worker.addEventListener('message', (e : MessageEvent) => {
      var id = e.data.id;
      var cb = this.cb[id];
      if (!cb) {
        return;
      }

      this.cb[id] = null;
      cb(e.data.data);
    });
  }

  submit(data : ImageData, cb : (data : ImageData) => void) : Bg {
    this.cb[this.id] = cb;
    this.worker.postMessage({
      id: this.id,
      data: data
    });
    this.id++;
    return this;
  }

  cancel() : Bg {
    this.cb = [];
    return this;
  }
}

// var IMAGE = '305742748_3d66ddddc8_o.jpg';
// var IMAGE = 'test.jpg';
// var IMAGE = '5773391228_821cbd4596_o.jpg';
var IMAGE = '7800614334_54207fa424_h.jpg';

var model = new Model((im) => {
  return view.imageNeedsData(im);
});
var view = new View(model);

}