function whenReady(f) {
  if (document.readyState == 'complete') {
    f();
    return;
  }
  window.addEventListener('DOMContentLoaded', f, false);
}

function query(selector) {
  return document.querySelector(selector);
}

function newElement(name, className) {
  var c = document.createElement(name);
  if (className)
    c.className = className
  return c;
}

function xhrGet(url, didGet, didFail) {
  var r = new XMLHttpRequest;
  r.open('GET', url, true);
  r.onreadystatechange = function() {
    if (r.readyState == 4) {
      if (r.status == 200)
        didGet(r);
      else
        didFail(r);
    }
  }
  r.send(null);
}

// Monkey patched shortcuts.
Node.prototype.attr = function(k, v) {
  this.setAttribute(k, v);
  return this;
}
Node.prototype.add = function() {
  for (var i = 0, n = arguments.length; i < n; ++i)
    this.appendChild(arguments[i]);
  return this;
}
Document.prototype.create = function(name) {
  return this.createElement(name);
}

// SVG.
SVGDocument.prototype.create = function(name) {
  return this.createElementNS("http://www.w3.org/2000/svg", name); 
}
