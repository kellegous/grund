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
