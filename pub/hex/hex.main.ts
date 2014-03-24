/// <reference path="../../lib/jquery.d.ts" />

module hex {
var SVGNS = 'http://www.w3.org/2000/svg';

var HEXPATH = [
  'M67.258,149c-2.615,0-6.505-0.462-10.191-2.658l-46.181-27.56',
  'C5.066,115.312,1,108.152,1,101.373V48.331c0-6.802,4.093-13.96,9.951-17.41l46.38-27.313C60.981,1.454,64.845,1,67.442,1',
  'c2.586,0,6.431,0.45,10.082,2.59l46.774,27.396c5.878,3.448,9.979,10.608,9.979,17.413v53.096c0,6.806-4.102,13.964-9.974,17.41',
  'l-47.021,27.517C74.423,148.104,70.95,149,67.258,149L67.258,149z'
].join('');

var $create = function(type : string, ns? : string) : JQuery {
  return $(ns ? document.createElementNS(ns, type) : document.createElement(type));
}

var hex = function(url : string) : JQuery {
  var svg = $create('svg', SVGNS)
    .attr('width', '150')
    .attr('height', '160')
    .attr('viewBox', '0 0 150 160');

  $create('g', SVGNS)
    .append($create('clipPath')
      .attr('id', 'hex')
      .append($create('path', SVGNS)
        .attr('d', HEXPATH)))
    .appendTo(svg);

  $create('path', SVGNS)
    .attr('d', HEXPATH)
    .attr('fill', 'none')
    .attr('stroke', '#09f')
    .attr('stroke-miterlimit', '10')
    .appendTo(svg);

  var img = $create('image', SVGNS)
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('clip-path', 'url(#hex)')
    .appendTo(svg);

  img.get(0).setAttributeNS('http://www.w3.org/1999/xlink', 'href', url);

  return svg;
}

$('.human').each((i, e) => {
  var q = $(e);
  // $create('div')
  //   .css('background-image', 'url(' + q.attr('data-name') + '_2x.jpg)')
  //   .addClass('face')
  //   .appendTo(q);

  var h = hex(q.attr('data-name') + '_2x.jpg')
    .attr('class', 'hex')
    .appendTo(q);
});

}