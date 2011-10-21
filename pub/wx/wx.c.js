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

function render(canvas, stations) {
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var objs = layout(stations, canvas.width);
  ctx.fillStyle = '#ff0';
  objs.forEach(function(o) {
    ctx.beginPath();
    ctx.arc(o.x, o.y, 2, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
  });
}

function main() {
  xhrGet('stations.json',
    function(r) {
      render(createCanvas(query('#screen')), JSON.parse(r.responseText));
    },
    function(r) {
      console.error(r);
    });
}

whenReady(main)
})();
