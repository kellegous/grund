createCanvas= (parent) ->
  b = parent.getBoundingClientRect()
  c = newElement('canvas')
  s = c.style
  s.width = "#{b.width}px"
  s.height = "#{b.height}px"
  parent.appendChild(c)


findRanges= (stations)->
  minX = maxX = stations[0].lat
  minY = maxY = stations[0].lon
  for d in stations 
    maxX = Math.max maxX, d.lat
    minX = Math.max minX, d.lat
    maxY = Math.max maxY, d.lon
    minY = Math.min minY, d.lon
  [[minX, maxX], [minY, maxY]]


layout= (stations, width)->
  ranges = findRanges stations

  latRange = ranges[0]
  lonRange = ranges[1]

  latOffset = latRange[0]
  lonOffset = lonRange[1]

  f = width / (lonRange[1] - lonRange[0])

  for i in [0...stations.length]
    s = stations[i]
    v =
      x : (s.lon - lonOffset) * f,
      y: (latRange[i] - s.lat) * f,
      station: s


render= (canvas, stations) ->
  ctx = canvas.getContext '2d'
  ctx.clearRect 0, 0, canvas.width, canvas.height
  objs = layout stations, canvas.width
  console.log objs[0]


main= ->
  xhrGet('stations.json', (r) ->
    data = JSON.parse(r.responseText)
    console.log data.length
    render createCanvas(query('#screen')), JSON.parse(r.responseText))
