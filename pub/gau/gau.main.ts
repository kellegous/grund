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
    y += (0.5 - Math.random()) * 40;
    p.push({
      X : dx * i,
      Y : y,
    });
  }
  return p;
}


var RadPath = function(w : number, h : number) : P[] {
  var c = 0;
  var y = 0;
  var x = 0;
  var p = [];
  var dx = w / 50;
  var dt = 1.1 * Math.PI;
  p.push({X : x, Y : y});
  while (x < w) {
    c++;
    if (c > 1000) {
      console.log('bad');
      return p;
    }
    var t = dt / 2 - Math.random() * dt;
    x += Math.cos(t) * dx;
    y += Math.sin(t) * dx;
    p.push({X : x, Y : y});
  }
  return p;
}


var Render = function(ctx : CanvasRenderingContext2D, path : P[]) {
  ctx.beginPath();
  ctx.moveTo(path[0].X, path[0].Y);
  for (var i = 1, n = path.length; i < n; ++i) {
    ctx.lineTo(path[i].X, path[i].Y);
  }
  ctx.stroke();

  ctx.fillStyle = '#fff';
  path.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.X, p.Y, 4, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();
  })
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
  var n = 4;
  var dy = window.innerHeight / n;
  ctx.strokeStyle = '#09f';
  for (var i = 0; i < n; ++i) {
    ctx.save();
    ctx.translate(0, dy * i + dy / 2);
    Render(ctx,
      RadPath(window.innerWidth, window.innerHeight));
    ctx.restore();
  }
});