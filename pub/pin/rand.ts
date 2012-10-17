/// <reference path="jquery.d.ts" />

interface Rect {
  x : number;
  y : number;
  w : number;
  h : number;
}

interface Size {
  x : number;
  y : number;
}

interface View {
  x : number;
  y : number;
  e : JQuery;
}

interface Box {
  view : View;
  size : Size;
  used :  bool;
}

var gridSizes = [{x : 4, y : 1},
                 {x : 3, y : 1},
                 {x : 2, y : 1},
                 {x : 3, y : 2},
                 {x : 1, y : 1},
                 {x : 2, y : 3},
                 {x : 1, y : 2},
                 {x : 1, y : 3},
                 {x : 1, y : 4}];

var render = function(boxes : Box[]) : void {
  var y = 0;
  boxes.forEach((b : Box) => {
    b.view.e.css('left', 0)
      .css('width', b.size.x)
      .css('height', b.size.y - 12 /* border + spacing */)
      .css('top', y)
      .append($(document.createElement('div'))
        .text((b.size.x / b.size.y).toFixed(2)));
    y += b.size.y;
  });
}

var gridOf = function(size : number) : (views : View[]) => void {
  var sizes = gridSizes.map((g) => {
    return {
      x : g.x * size,
      y : g.y * size,
      ar : g.x / g.y
    };
  });

  var gridSizeOf = function(view : View) : Size {
    var pr = view.x / view.y;
    var sz = sizes[0];
    var mn = Math.abs((sz.x / sz.y) - pr);
    for (var i = 1, n = sizes.length; i < n; ++i) {
      var df = Math.abs((sizes[i].x / sizes[i].y) - pr);
      if (df >= mn)
        continue;
      sz = sizes[i];
      mn = df;
    }
    return sz;
  };

  var findFit = function(boxes : Box[], rect : Rect) : Box {
    for (var i = 0, n = boxes.length; i < n; ++i) {
      var box = boxes[i];
      if (box.used)
        continue;
      if (box.size.x <= rect.w && box.size.y <= rect.h)
        return box;
    }
    return null;
  }

  var findUnused = function(boxes : Box[]) : Box {
    for (var i = 0, n = boxes.length; i < n; ++i) {
      if (!boxes[i].used)
        return boxes[i];
    }
    return null;
  }

  var next = function(boxes : Box[]) : Box {
    while (boxes.length > 0) {
      var b = boxes.shift();
      if (b.used)
        continue;
      return b;
    }
    return null;
  }

  var place = function(a : Box[], b : Box[], r : Rect) {
    console.log('place: {' + r.x + ',' + r.y + ',' + r.w + ',' + r.h + '}');
    var fit = findFit(a, r);
    if (!fit) {
      console.log('forcing fit');
      fit = findUnused(a);
      if (!fit)
        return;
    }

    fit.view.e.css('top', r.y)
      .css('left', r.x)
      .css('width', fit.size.x)
      .css('height', fit.size.y);
    fit.used = true;

    console.log('fit: ' + fit.size.x + 'x' + fit.size.y);

    // pack what is left to the side
    // pack what is left on the bottom
    if (fit.size.x < r.w) {
      place(b, a, {
        x : r.x + fit.size.x,
        y : r.y,
        w : r.w - fit.size.x,
        h : r.h});
    }

    if (fit.size.y < r.h) {
      place(b, a, {
        x : r.x,
        y : r.y + fit.size.y,
        w : fit.size.x,
        h : r.h - fit.size.y});
    }
  }

  return (views : View[]) {
    console.log('size = ' + size);
    var boxes = views.map((v : View) => {
      return {
        view: v,
        size: gridSizeOf(v),
        used: false
      };
    });

    var byWidth = boxes.slice(0).sort((a, b) => {
      return b.size.x - a.size.x;
    });

    var byHeight = boxes.slice(0).sort((a, b) => {
      return b.size.y - a.size.y;
    });

    var r = {x : 0, y : 0, w : 4 * size, h : 4 * size};
    while (findUnused(byHeight) != null) {
      place(byHeight, byWidth, r);
      r.y += 4 * size;
      console.log('packed row');
    }
    // render(boxes);
  };
}

var randViews = function(n : number) : View[] {
  var body = $(document.body);
  var r = [];
  while (r.length < n) {
    r.push({
      x : 10 + (91 * Math.random()) | 0,
      y : 10 + (91 * Math.random()) | 0,
      e : $(document.createElement('div'))
        .addClass('view')
        .appendTo(body)
    });
  }
  return r;
};

$(document).ready(() => {
  var views = randViews(100);
  var layout = gridOf(window.innerWidth / 4);
  layout(views);
});