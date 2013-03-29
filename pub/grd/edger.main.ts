/// <reference path="common.ts" />

addEventListener('message', (e : MessageEvent) => {
  var g : any = self,
      im = e.data.data,
      px = im.data,
      w = im.width,
      h = im.height,
      st = w * 4,
      v = new Vec;

  var now = Date.now();
  for (var j = 0; j < h; j++) {
    for (var i = 0; i < w; i++) {
      v.j = -convolve(im, i, j, Dx);
      v.i = -convolve(im, i, j, Dy);
      var m = Vec.mag(v.i, v.j);
      px[st * j + 4 * i + 3] = 50 + (m * 205 / 255);
    }
  }

  for (var i = 0; i < px.length; i += 4) {
    px[i] = px[i+1] = px[i+2] = 0;
  }

  g.postMessage({
    id: e.data.id,
    data: im,
    time: Date.now() - now
  });
});