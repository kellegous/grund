/// <reference path="../../lib/jquery.d.ts" />

interface P {
  X : number;
  Y : number;
}


var StdPath = function(w : number, h : number) : P[] {
  var y = h / 2;
  var p = [];
  var n = 40;
  var dx = w / n;
  for (var i = 0; i <= n; i++) {
    y += (0.5 - Math.random()) * 20;
    p.push({
      X : dx * i,
      Y : y,
    });
  }
  return p;
}


var Render = function(ctx : CanvasRenderingContext2D, path : P[]) {
  ctx.beginPath();
  ctx.moveTo(path[0].X, path[1].Y);
  for (var i = 1, n = path.length; i < n; ++i) {
    ctx.lineTo(path[i].X, path[i].Y);
  }
  ctx.stroke();
}


$(document).ready(() => {
  var c = $('canvas');

  var Resize = function(event) {
    c.attr('width', window.innerWidth)
      .attr('height', window.innerHeight);
  };

  $(window).on('resize', Resize);
  Resize(null);

  var ctx = c.get(0).getContext("2d");
  ctx.strokeStyle = '#09f';
  Render(ctx,
    StdPath(window.innerWidth, window.innerHeight));
});