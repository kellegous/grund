whenReady= (f) ->
  if document.readyState == 'complete'
    f()
  else
    window.addEventListener('DOMContentLoaded', f, false)

query= (selector) -> document.querySelector(selector)

newElement= (name, className) ->
  c = document.createElement(name)
  c.className = className if className
  c

xhrGet= (url, didGet, didFail) ->
  r = new XMLHttpRequest
  r.open('GET', url, true)
  r.onreadystatechange = ->
    if r.readyState == 4
      if r.status == 200
        didGet r
      else
        didFail r
  r.send(null)
  
