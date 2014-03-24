
interface WorkerGlobalScope extends EventTarget {
  postMessage(m : any) : void;
}

// note: this is a hack. lib.d.ts declares self to be a Window ... which would work
// except the signature for postMessage does not match (it requires a domain parameter).
// this is just a way to alias 'self' as a type I can actually use. The cast to any
// is essentially a reinterpret_cast.
var scope : WorkerGlobalScope = <any>self;

interface Resp {
  After : number;
  Distr : number[];
}

interface Req {
  Id : number;
  Total : number;
  RespondEvery : number;
}

var Zeros = function(n : number) {
  var z : number[] = [];
  z.length = n;
  for (var i = 0; i < n; ++i)
    z[i] = 0;
  return z;
};

var RandInt = function() : number {
  return ~~(Math.floor(Math.random() * 4294967296) - 2147483648);
};

var Respond = function(id : number, count : number, incr : number) : void {
  var r = {After: 0, Distr: Zeros(32)};

  var Run = function() {
    for (var i = 0; i < incr; ++i) {
      var n = RandInt();
      // todo: update the distr.
      r.After++;
      if (r.After == count) {
        scope.postMessage(r);
        return;
      }
    }

    scope.postMessage(r);
    setTimeout(Run, 0);
  };
  setTimeout(Run, 0);
};

scope.addEventListener('message', (e : any) => {
  var req = <Req>e;
  Respond(req.Id, req.Total, req.RespondEvery);
}, false);