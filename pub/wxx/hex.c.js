(function(){

var d = document;
const SVGNS = "http://www.w3.org/2000/svg";
Node.prototype.attr = function(k, v) {
  this.setAttribute(k, v);
  return this;
}
Node.prototype.add = function() {
  for (var i = 0, n = arguments.length; i < n; ++i)
    this.appendChild(arguments[i]);
  return this;
}
SVGDocument.prototype.create = function(name) {
  return this.createElementNS(SVGNS, name);
}

function points(c) {
  var a = c / 2;
  var b = Math.sin(Math.PI / 3) * c;
  var p = [
    [0, b],
    [a, 0],
    [a + c, 0],
    [2 * c, b],
    [a + c, 2 * b],
    [a, 2 * b]
  ];
  return p.map(function(x) {
    return x.join(',');
  }).join(' ');
}

function translate(obj, dx, dy) {
  return d.create('g')
      .attr('transform', 'translate(' + dx + ', ' + dy + ')')
      .add(obj);
}

function newHex(c) {
  return d.create('polygon')
      .attr('style', 'stroke:black;fill:transparent;stroke-width:1')
      .attr('points', points(c));
}

function domDidLoad() {
  var c = 50;
  var a = c / 2;
  var b = Math.sin(Math.PI / 3) * c;
  d.documentElement.add(
    translate(newHex(c), 0, 0),
    translate(newHex(c), a + c, b));
}

addEventListener('DOMContentLoaded', domDidLoad, false);
})();
