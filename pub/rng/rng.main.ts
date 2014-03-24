/// <reference path="../../lib/jquery.d.ts" />

// todo:
// 1 - the worker should receive a request to start generating the shit out of
//     random numbers with a value for status updates.

interface Req {
  Id : number;
  Total : number;
  RespondEvery : number;
}

var worker = new Worker('worker.js');

$(document).ready(() => {

  worker.addEventListener('message', (m : any) => {
    console.log('worker sayth: ', m);
  });

  worker.postMessage({
    Id : 0,
    Total: 1000,
    RespondEvery: 100
  });
});