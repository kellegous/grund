/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="common.ts" />
/// <reference path="raf.ts" />

module grd {

interface Rect {
  x : number;
  y : number;
  width : number;
  height : number;
}

interface Size {
  width : number;
  height : number;
}

interface Pnt {
  x : number;
  y : number;
}

// returns the required source rectangle to paint an image using a 'cover'
// strategy.
var computeCover = function(src : Size, dst : Size) : Rect {
  var sar = src.width / src.height;
  var dar = dst.width / dst.height;

  if (sar > dar) {
    // top/bottom anchored.
    var w = src.height * dar;
    return {
      x : (src.width - w) / 2,
      y : 0,
      width : w,
      height : src.height
    };
  } else {
    // left/right anchored.
    var h = src.width/dar;
    return {
      x : 0,
      y : (src.height - h) / 2,
      width : src.width,
      height : h
    };
  }
};


// returns the scale coefficient to scale the image to the dst container.
var computeScale = function(src : Size, dst : Size) : number {
  var sar = src.width / src.height;
  var dar = dst.width / dst.height;
  return (sar > dar)
    ? dst.height / src.height
    : dst.width / src.width;
};


// A simple event dispatcher
class Signal {
  listeners : { (args : any[]) : void; } [] = [];

  tap(l : (arg : any[]) => void) : void {
    this.listeners = this.listeners.slice(0);
    this.listeners.push(l);
  }

  untap(l : (arg : any[]) => void) : void {
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


// create a new fullscreen canvas
var newCanvas = function() : CanvasRenderingContext2D {
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


// load an image over the network
var loadImage = function(url : string,
    whenDone : (im : HTMLImageElement) => void) : HTMLImageElement {
  var im = <HTMLImageElement>document.createElement('img');
  im.src = url;
  im.addEventListener('load', () => {
    whenDone(im);
  }, false);
  im.addEventListener('error', () => {
    whenDone(null);
  });
  return im;
};


// Uses a worker to apply a sobel filter to an image
class Edger {
  private worker : Worker = new Worker('edger.js');
  private id = 0;
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
    }, false);
  }

  submit(data : ImageData, cb : (data : ImageData) => void) : Edger {
    this.cb[this.id] = cb;
    this.worker.postMessage({
      id: this.id,
      data: data
    });
    this.id++;
    return this;
  }

  cancel() : Edger {
    this.cb = [];
    return this;
  }
}


// simple model class
class Model {
  // the original image resource
  original : HTMLImageElement;

  // the scaled image
  image : HTMLCanvasElement;

  // the pixels of the scaled image
  pixels : ImageData;

  // a user given description of the image
  desc : any;

  // a signal raised with the model reloads pixel data
  modelDidLoad = new Signal;

  // cache of the image stride (for internal calculations)
  private stride : number;

  // load an image from the url
  loadFrom(url : string, desc : any) : void {
    loadImage(url, (im) => {
      this.original = im;
      this.desc = desc;
      this.reload();
    });
  }

  // process the original image into pixels
  reload() : void {
    var original = this.original;
    var f = computeScale(original, {
      width: window.innerWidth,
      height: window.innerHeight
    });

    var w = f * original.width,
        h = f * original.height;

    var canvas = $(document.createElement('canvas'))
      .attr('width', w)
      .attr('height', h).get(0);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(original, 0, 0, original.width, original.height,
      0, 0, w, h);

    this.image = canvas;
    this.pixels = ctx.getImageData(0, 0, w, h);
    this.stride = canvas.width * 4;

    this.modelDidLoad.raise(this);
  }

  width() : number {
    return this.pixels.width;
  }

  height() : number {
    return this.pixels.height;
  }

  colorAt(x : number, y : number, dst : Rgb) : Rgb {
    x |= 0;
    y |= 0;
    var ix = (this.stride * y + x * 4) | 0,
        px = this.pixels.data;
    // if (px[ix + 3] != 255) {
    //   console.log(x, y, px[ix], px[ix + 1], px[ix + 2], px[ix + 3]);
    // }
    return Rgb.set(px[ix], px[ix + 1], px[ix + 2], dst);
  }

  gradientAt(x : number, y : number, dst : Vec) : Vec {
    x |= 0;
    y |= 0;
    dst.j = -convolve(this.pixels, x, y, Dy) * 0.25;
    dst.i = -convolve(this.pixels, x, y, Dx) * 0.25;
    return dst;
  }
}


// updates the screen according to the model changes
class View {
  static MINI_HEIGHT = 300;
  static PIXEL_SIZE = 30;
  static MAX_MAG = Math.sqrt(255 * 255 + 255 * 255);

  main = newCanvas();
  mini : CanvasRenderingContext2D;
  edge : HTMLCanvasElement;

  edger = new Edger();

  rect : Rect;

  dragging : bool = false;

  edgesShowing = false;

  showingTip = true;

  rectForMousing : ClientRect;

  private escKey : (e : KeyboardEvent) => void;
  private clickOut : (e : Event) => void;

  private static uiForMini(view : View) : CanvasRenderingContext2D {
    var p = {x : 0, y : 0};
    var viewAt = (e : MouseEvent) => {
      view.viewAt(e.pageX - view.rectForMousing.left,
        e.pageY - view.rectForMousing.top);
    };

    var b = $(document.createElement('canvas'))
      .attr('width', View.MINI_HEIGHT)
      .attr('height', View.MINI_HEIGHT)
      .click((e : MouseEvent) => {
        viewAt(e);
      })
      .on('mousedown', (e) => {
        view.dragging = true;
        viewAt(e);
      })
      .on('mousemove', (e) => {
        if (view.dragging) {
          viewAt(e);
        }
      })
      .on('mouseup', (e) => {
        view.dragging = false;
      });

    var c = $(document.createElement('div'))
      .addClass('ctrl')
      .append(
        $(document.createElement('button'))
          .addClass('pick-image')
          .text('Change Image')
          .click((e) => {
            view.showMenu(<HTMLElement>e.target);
          }),
        $(document.createElement('button'))
          .addClass('show-edges')
          .text('Highlight Edges')
          .click(function(e : Event) : void {
            if (view.edgesShowing) {
              $(this).text('Highlight Edges');
              view.hideEdges();
            } else {
              $(this).text('Hide Edges');
              view.showEdges();
            }
          }));

    var a = $(document.createElement('div'))
      .attr('id', 'mini')
      .css('position', 'absolute')
      .css('bottom', 10)
      .css('right', 10)
      .css('z-index', 2)
      .append(c, b)
      .appendTo(document.body);

    return b.get(0).getContext('2d');
  }


  constructor(public model : Model) {
    model.modelDidLoad.tap(() => {
      var i = this.model.image,
          r = i.width/i.height,
          w = window.innerWidth,
          h = window.innerHeight;

      this.rect = {
        x : 0,
        y : 0,
        width: window.innerWidth / View.PIXEL_SIZE,
        height: window.innerHeight / View.PIXEL_SIZE
      };

      $('#mini').animate({opacity:1}, 200);

      // resize the main canvas
      $(this.main.canvas)
        .attr('width', w)
        .attr('height', h);

      // resize the mini canvas
      $(this.mini.canvas)
        .attr('width', r * View.MINI_HEIGHT)
        .attr('height', View.MINI_HEIGHT);

      // fucking firefox
      this.rectForMousing = this.mini.canvas.getBoundingClientRect();

      // clear any edge buffer
      this.edge = null;

      // paint everything
      this.paint();

      // give credit for the image
      var desc = 'http://www.flickr.com/photos/' + model.desc;
      $('#attr').attr('href', desc)
        .text(desc);

      // if edges is showing, load them
      if (this.edgesShowing) {
        this.showEdges();
      }

      if (this.showingTip) {
        this.showTip();
      }
    });

    this.mini = View.uiForMini(this);

    this.bind();
  }


  private bind() : void {
    // on resize, ask the model to reload to recomposite at
    // the new window size.
    $(window).on('resize', () => {
      this.model.reload();
    });

    $('#menu').click((e) => {
      var t = $(e.target);
      if (!t.hasClass('pick')) {
        return;
      }
      this.model.loadFrom(t.attr('data-url'), t.attr('data-id'));
      this.hideMenu();
    });

    this.escKey = (e : KeyboardEvent) => {
      if (e.keyCode != 27 /* esc */) {
        return;
      }
      this.hideMenu();
    };

    this.clickOut = (e : Event) => {
      var m = $('#menu').get(0);
      if (m == e.target || $.contains(m, <HTMLElement>e.target)) {
        return;
      }
      this.hideMenu();
    };
  }


  private showTip() : void {
    var mini = this.mini,
        w = mini.canvas.width,
        h = mini.canvas.height;
    this.showingTip = false;
    var tip = $(document.createElement('div'))
      .attr('id', 'tip')
      .css('position', 'absolute')
      .css('width', w)
      .css('height', h)
      .css('bottom', 10)
      .css('right', 10)
      .text('Drag the viewport around...')
      .appendTo(document.body);
    
    var hide = () => {
      tip.fadeOut(300, () => {
        tip.remove();
      });
    };

    setTimeout(hide, 2000);
    tip.on('mouseover', hide);
  }


  private showEdges() : void {
    this.edgesShowing = true;
    this.edger.cancel().submit(this.model.pixels, (d) => {
      var mini = this.mini,
          orig = this.model.image;

      var nim = $(document.createElement('canvas'))
        .attr('width', orig.width)
        .attr('height', orig.height)
        .get(0).getContext('2d');
      nim.putImageData(d, 0, 0);
      this.edge = nim.canvas;
      this.paintMini();
    });
  }


  private hideEdges() : void {
    this.edgesShowing = false;
    this.edger.cancel();
    this.edge = null;
    this.paintMini();
  }


  private showMenu(onButton : HTMLElement) : void {
    var rect = onButton.getBoundingClientRect();
    $('#menu')
      .css('bottom', window.innerHeight - rect.bottom + 60)
      .css('left', rect.left + rect.width / 2 - 408 / 2)
      .addClass('active');
    document.addEventListener('click', this.clickOut, true);
    document.addEventListener('keydown', this.escKey, true);
  }


  private hideMenu() : void {
    $('#menu').removeClass('active');
    document.removeEventListener('click', this.clickOut, true);
    document.removeEventListener('keydown', this.escKey, true);
  }


  private scale() : number {
    return this.mini.canvas.width / this.model.image.width;
  }


  private viewAt(x : number, y : number) : void {
    var rect = this.rect,
        f = this.scale();
    rect.x = Math.max(0, x / f - rect.width / 2);
    rect.y = Math.max(0, y / f - rect.height / 2);
    this.paint();
  }


  private paintMini() : void {
    var c = this.mini,
        i = this.model.image,
        r = this.rect,
        f = this.scale(),
        w = c.canvas.width,
        h = c.canvas.height;
    c.save();
    c.drawImage(i, 0, 0, i.width, i.height,
      0, 0, c.canvas.width, c.canvas.height);

    // if edges is turned on, draw the edges
    if (this.edge != null) {
      c.save();
      c.globalCompositeOperation = 'destination-in';
      c.drawImage(this.edge, 0, 0, i.width, i.height,
        0, 0, c.canvas.width, c.canvas.height);
      c.restore();
    }

    c.fillStyle = 'rgba(255,255,255,0.2)';
    c.fillRect(r.x * f, r.y * f, r.width * f, r.height * f);

    c.strokeStyle = '#f00';
    c.lineWidth = 2;
    c.strokeRect(r.x * f, r.y * f, r.width * f, r.height * f);

    c.restore();
  }


  paint() : void {
    this.paintMini();
    var ctx = this.main,
        model = this.model,
        r = this.rect,
        f = this.scale(),
        p = new Rgb,
        v = new Vec;
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (var j = 0; j < r.height; j++) {
      for (var i = 0; i < r.width; i++) {
        var x = i + r.x,
            y = j + r.y;
        // draw the pixel
        model.colorAt(x, y, p);
        ctx.fillStyle = Rgb.css(p.r, p.g, p.b);
        ctx.fillRect(i * View.PIXEL_SIZE,
          j * View.PIXEL_SIZE,
          View.PIXEL_SIZE - 1,
          View.PIXEL_SIZE - 1);

        // do not render gradients if we are dragging
        if (this.dragging) {
          continue;
        }

        // compute the gradient
        model.gradientAt(x, y, v);
        var m = 12 * Vec.mag(v.i, v.j) / View.MAX_MAG;
        Vec.normalize(v.i, v.j, v);

        Rgb.invert(p.r, p.g, p.b, p);
        Rgb.gray(p.r, p.g, p.b, p);
        var cx = i * View.PIXEL_SIZE + View.PIXEL_SIZE / 2,
            cy = j * View.PIXEL_SIZE + View.PIXEL_SIZE / 2,
            iv = Rgb.luminance(p.r, p.g, p.b) > 127 ? '#fff' : '#333';

        // draw the vector
        ctx.strokeStyle = iv;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (3 + m) * v.i, cy + (3 + m) * v.j);
        ctx.stroke();

        ctx.fillStyle = iv;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
}

interface Pick { url : string; des : string; }

var findPicks = function() : Pick[] {
  var r : Pick[] = [];
  $('#menu > .pick').each((i, e) => {
    $(e).css('background-image', 'url(' + e.getAttribute('data-url') + ')');
    r.push({
      url: e.getAttribute('data-url'),
      des: e.getAttribute('data-id')
    });
  });
  return r;
};

var model = new Model,
    view = new View(model),
    picks = findPicks();

model.loadFrom(picks[0].url, picks[1].des);

// don't allow browser to change the cursor on drag.
document.onselectstart = () => { return false; };

}