(function(){
#include "common.js"

function createCanvas(parent) {
  var b = parent.getBoundingClientRect();
  var c = newElement('canvas');
  c.setAttribute('width', b.width - 4);
  c.setAttribute('height', b.height - 4);
  return parent.appendChild(c);
}

function Pt(x, y) {
  this.x = x;
  this.y = y;
}

function Rect(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.data = [];
}
Rect.prototype.contains = function(x, y) {
  return x >= this.x
    && y >= this.y
    && x <= (this.x + this.w)
    && y <= (this.y + this.h);
}

function buildModel(stations, width, height, size) {
  // compute a function capable of transforming pts.
  function transform(stations) {
    var minY, maxY, minX, maxX;
    minY = maxY = stations[0].lat
    minX = maxX = stations[0].lon
    stations.forEach(function(s) {
      maxY = Math.max(maxY, s.lat);
      minY = Math.min(minY, s.lat);
      maxX = Math.max(maxX, s.lon);
      minX = Math.min(minX, s.lon);
    });
    var f = width / (maxX - minX);
    stations.forEach(function(s) {
      s.x = (s.lon - minX) * f;
      s.y = (maxY - s.lat) * f;
    });
    return stations;
  }
  // compute the list of rects.
  function grid(stations, width, height, size) {
    var grid = [];
    var nx = ~~(width / size);  // number of rects along x
    var ny = ~~(height / size); // number of rects along y
    grid.length = nx * ny;
    stations.forEach(function(s) {
      var ix = ~~(s.x / size);
      var iy = ~~(s.y / size);
      var id = iy * nx + ix;
      var rect = grid[id];
      if (!rect)
        rect = grid[id] = new Rect(ix * size, iy * size, size, size);
      rect.data.push(s);
    });
    for (var i = 0, n = grid.length; i < n; ++i) {
      if (!grid[i])
        continue;
      var ix = i % nx;
      var iy = ~~(i / nx);
      console.log(i + " ==> " + ix + ", " + iy); 
    }
    return {
      rects: grid.filter(function(r) { return !!r; }),
      stations: stations
    };
  }
  return grid(transform(stations), width, height, size);
}

function layout(stations, width) {
  // Computes a transform function.
  function computeTx(stations) {
    var minY, maxY, minX, maxX;
    minY = maxY = stations[0].lat
    minX = maxX = stations[0].lon
    stations.forEach(function(s) {
      maxY = Math.max(maxY, s.lat);
      minY = Math.min(minY, s.lat);
      maxX = Math.max(maxX, s.lon);
      minX = Math.min(minX, s.lon);
    });
    var f = width / (maxX - minX);
    return function(pt) {
      return new Pt(
        (pt.x - minX) * f,
        (maxY - pt.y) * f);
    }
  }
  var tx = computeTx(stations);
  return stations.map(function(s) {
    return tx(new Pt(s.lon, s.lat));
  });
}

function render(canvas, model) {
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ff0';
  model.stations.forEach(function(o) {
    ctx.beginPath();
    ctx.arc(o.x, o.y, 2, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  model.rects.forEach(function(o) {
    ctx.fillRect(o.x, o.y, o.w - 1, o.h - 1);
  });
}

function main() {
  xhrGet('stations.json',
    function(r) {
      var canvas = createCanvas(query('#screen'));
      var model = buildModel(JSON.parse(r.responseText), canvas.width, canvas.height, 20);
      render(canvas, model);
    },
    function(r) {
      console.error(r);
    });
}

whenReady(main)
})();
