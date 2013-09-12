/// <reference path="../../lib/jquery.d.ts" />

interface Station {
  x : number;
  y : number;
  lon : number;
  lat : number;
}

interface Model {
  rects : Rect[];
  stations : Station[];
}

class Rect {
  data : Station[] = [];

  constructor(public x : number, public y : number, public w : number, public h : number) {
  }

  contains(x : number, y : number) : boolean {
    return x >= this.x
      && y >= this.y
      && x <= (this.x + this.w)
      && y <= (this.y + this.h);
  }
}

var BuildModel = function(stations : Station[], w : number, h : number, size : number) : Model {
  var Transform = function(stations : Station[]) : Station[] {
    var minY : number;
    var maxY : number;
    var minX : number;
    var maxX : number;
    minY = maxY = stations[0].lat;
    minX = maxX = stations[0].lon;
    stations.forEach((s) => {
      maxY = Math.max(maxY, s.lat);
      minY = Math.min(minY, s.lat);
      maxX = Math.max(maxX, s.lon);
      minX = Math.min(minX, s.lon);
    });
    var f = w / (maxX - minX);
    stations.forEach((s) => {
      s.x = (s.lon - minX) * f;
      s.y = (maxY - s.lat) * f;
    });
    return stations;
  }

  var Grid = function(stations : Station[], w : number, h : number, size : number) : Model {
    var grid = [];
    var nx = ~~(w / size);
    var ny = ~~(h / size);
    grid.length = nx * ny;
    stations.forEach((s) => {
      var ix = ~~(s.x / size);
      var iy = ~~(s.y / size);
      var id = iy * nx + ix;
      var rect = grid[id];
      if (!rect)
        rect = grid[id] = new Rect(ix * size, iy * size, size, size);
      rect.data.push(s);
    });

    return {
      rects : grid.filter((r) => { return !!r; }),
      stations: stations
    };
  }

  return Grid(Transform(stations), w, h, size);
}


var Render = function(canvas : JQuery, model : Model) {
  var ctx = canvas.get(0).getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ff0';
  model.stations.forEach((s) => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  model.rects.forEach((r) => {
    ctx.fillRect(r.x, r.y, r.w - 1, r.h - 1);
  });
};

$(document).ready(() => {
  $.getJSON('stations.json', (data) => {
    var screen = $('#screen');
    var rect = screen.get(0).getBoundingClientRect();
    var w = rect.width - 4;
    var h = rect.height - 4;

    var canvas = $(document.createElement('canvas'))
      .attr('width', w)
      .attr('height', h)
      .appendTo(screen);
    var model = BuildModel(data, w, h, 20);
    Render(canvas, model);
  });
});