(function() {

var ProbOfLos = function(i, n) {
  var r = 1;
  d3.range(1, i).forEach(function(x) {
    r *= 1 - (x / n);
  });
  return r;
}

var ProbOfWin = function(i, n) {
  return 1 - ProbOfLos(i, n);
};

var ExpectedValue = function(i, n) {
  var pw = ProbOfWin(i, n);
  return 100 * pw - i;
};

var margin = {top: 20, right: 20, bottom: 30, left: 50};
var width = 600 - margin.left - margin.right;
var height = 400 - margin.top - margin.bottom;

var Graph = function(n, id, y, data) {
  var x = d3.scale.linear()
    .domain([1, n])
    .range([0, width]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom');
  var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left');

  var svg = d3.select(id)
    .append('svg:svg')
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  svg.append('g')
    .attr('class', 'xaxis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);
  svg.append('g')
    .attr('class', 'yaxis')
    .call(yAxis);
  svg.append('svg:path')
    .datum(d3.range(1, n + 1))
    .attr('stroke', '#09f')
    .attr('stroke-width', 1)
    .attr('fill', 'none')
    .attr('d', d3.svg.line()
      .x(function(d) {
        return x(d);
      })
      .y(function(d, i) {
        return y(data[i]);
      }));
  return {
    x : x,
    y : y,
    svg: svg
  };
}

var N = 100;
Graph(N, '#g1',
  d3.scale.linear()
    .domain([0, 1])
    .range([height, 0]),
  d3.range(1, N + 1).map(function(d) {
    return ProbOfWin(d, N);
  }));

var g = Graph(N, '#g2',
  d3.scale.linear()
    .domain([-1, N])
    .range([height, 0]),
  d3.range(1, N + 1).map(function(d) {
    return ExpectedValue(d, N);
  }));

var m = d3.range(1, N + 1).reduce(function(c, d, i) {
  var e = ExpectedValue(d, N);
  return (e > c[1]) ? [i + 1, e] : c;
}, [0, -1]);

g.svg.append('line')
  .attr('stroke', '#ccc')
  .attr('fill', 'none')
  .attr('stroke-width', 1)
  .attr('x1', g.x(m[0]))
  .attr('x2', g.x(m[0]))
  .attr('y1', g.y(0))
  .attr('y2', g.y(m[1]));
g.svg.append('circle')
  .attr('stroke', '#09f')
  .attr('fill', '#fff')
  .attr('stroke-width', 1)
  .attr('cx', g.x(m[0]))
  .attr('cy', g.y(m[1]))
  .attr('r', 3)
})();