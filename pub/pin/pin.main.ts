/// <reference path="../../lib/jquery.d.ts" />


// todo: expand this this for arbitrary grids

interface Rect {
  X : number;
  Y : number;
  W : number;
  H : number;
}

interface Size {
  X : number;
  Y : number;
}

interface Pin {
  File : string;
  SmSize : Size;
  LgSize : Size;
}

interface View {
  Pin : Pin;
  Elem : JQuery;
  Size : Size;
  Used : boolean;
}

var GridSizes = [{X : 4, Y : 1},
                 {X : 3, Y : 1},
                 {X : 2, Y : 1},
                 {X : 3, Y : 2},
                 {X : 1, Y : 1},
                 {X : 2, Y : 3},
                 {X : 1, Y : 2},
                 {X : 1, Y : 3},
                 {X : 1, Y : 4}];

var Render = function(views : View[]) : void {
  var y = 0;
  views.forEach((v) => {
    console.log(v.Size.X);
    v.Elem.css('top', y)
      .css('left', 0)
      .css('width', v.Size.X)
      .css('height', v.Size.Y);
    y += v.Size.Y;
  });
}

var GridOf = function(size : number) : (views : View[]) => void {
  var sizes = GridSizes.map((g) => {
    return {
      X : g.X * size,
      Y : g.Y * size,
      R : g.X / g.Y
    }
  });

  var GridSizeOf = function(size : Size) : Size {
    var pr = size.X / size.Y;
    var sz = sizes[0];
    var mn = Math.abs(sz.R - pr);
    for (var i = 1, n = sizes.length; i < n; ++i) {
      var df = Math.abs(sizes[i].R - pr);
      if (df >= mn)
        continue;
      sz = sizes[i];
      mn = df;
    }
    return sz;
  }

  var FindFit = function(views : View[], rect : Rect) : View {
    for (var i = 0, n = views.length; i < n; ++i) {
      var view = views[i];
      if (view.Used)
        continue;
      if (view.Size.X <= rect.W && view.Size.Y <= rect.H)
        return view;
    }
    return null;
  }

  var FindUnused = function(views : View[]) : View {
    for (var i = 0, n = views.length; i < n; ++i) {
      if (!views[i].Used)
        return views[i];
    }
    return null;
  }

  var Position = function(view : View,
      x : number,
      y : number,
      w : number,
      h : number) {
    view.Elem.css('top', y + 10)
      .css('left', x + 10)
      .css('width', w - 20)
      .css('height', h - 20);
    view.Used = true;
  }

  var Place = function(a : View[], b : View[], r : Rect) {
    var reg : Size;

    // find something w/ proper aspect ratio or just force fit something
    // if there isn't a match
    var fit = FindFit(a, r);
    if (fit) {
      reg = fit.Size;
    } else {
      fit = FindUnused(a);
      if (!fit)
        return;

      reg = {X : r.W, Y : r.H};

      // shows force fits.
      // fit.Elem.css('border', '2px dashed #f00');
    }

    // place that as an anchor
    Position(fit, r.X, r.Y, reg.X, reg.Y);

    // if we have space to the right, place stuff there
    if (reg.X < r.W) {
      // notice that a and b are swapped to provide visual variety
      Place(b, a, {
        X : r.X + reg.X,
        Y : r.Y,
        W : r.W - reg.X,
        H : r.H
      });
    }

    // if we have space below us, place stuff there
    if (reg.Y < r.H) {
      Place(b, a, {
        X : r.X,
        Y : r.Y + reg.Y,
        W : reg.X,
        H : r.H - reg.Y
      });
    }
  }

  return (views : View[]) => {
    // reset the views
    views.forEach((v : View) => {
      v.Size = GridSizeOf(v.Size)
      v.Used = false;
    });

    // sort by width (todo: doesn't give good variety)
    // var byWidth = views.slice(0).sort((a, b) => {
    //   return b.Size.X - a.Size.X;
    // });
    var byWidth = views;

    // sort by height
    var byHeight = views.slice(0).sort((a, b) => {
      return b.Size.Y - a.Size.Y;
    });

    var byHeight = views;

    var r = {X : 0, Y : 0, W : 4 * size, H : 4 * size};

    var c = 0;
    while (FindUnused(byHeight) != null) {
      var fit = FindFit(byHeight, r);
      if (!fit)
        return;

      // alternate between anchoring the left and right sides of a region with a
      // fitting object.
      if ((c & 1) == 0) {
        // start on the left
        Position(fit, r.X, r.Y, fit.Size.X, fit.Size.Y);
        Place(byWidth, byHeight, {
          X : fit.Size.X,
          Y : r.Y,
          W : r.W - fit.Size.X,
          H : fit.Size.Y
        });
      } else {
        // start on the right
        Position(fit, r.W - fit.Size.X, r.Y, fit.Size.X, fit.Size.Y);
        Place(byWidth, byHeight, {
          X : r.X,
          Y : r.Y,
          W : r.W - fit.Size.X,
          H : fit.Size.Y
        });
      }
      r.Y += fit.Size.Y;
      c++;
    }
  };
}

var ToastTimer = -1;
var Toast = function(title : string, text : string) {
  var n = $('#notif');
  $('.titl', n).text(title);
  $('.text', n).text(text);

  var Tick = function() {
    n.fadeOut(500);
    ToastTimer = -1;
  };

  if (ToastTimer >= 0) {
    clearTimeout(ToastTimer);
    ToastTimer = setTimeout(Tick, 1000);
    return;
  }

  n.fadeIn(500, () => {
    ToastTimer = setTimeout(Tick, 1500);
  });
}

$.getJSON('pins.json', (pins : Pin[]) => {
  var body = $(document.body);
  var views = pins.map((p : Pin) => {
    return {
      Pin : p,
      Size : p.LgSize,
      Used : false,
      Elem : $(document.createElement('div'))
        .addClass('pin')
        .css('background-image', 'url("c/' + p.File + '")')
        .appendTo(body)
    }
  });

  var Layout = function() {
    var s = Date.now();
    GridOf((window.innerWidth - 20) / 4)(views);
    setTimeout(() => {
      Toast('4x grid of ' + views.length + ' items.',
        '( in ' + (Date.now() - s) + 'ms )');
    }, 0);
  };

  Layout();
  $(window).on('resize', Layout);
});
