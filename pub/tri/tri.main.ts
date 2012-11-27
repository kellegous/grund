/// <reference path="../../lib/jquery.d.ts" />

interface Result {
  Name : string;
}

interface Results {
  Year : number;
  Results : Result[];
}

$(document).ready(() => {
  $.getJSON('dat/all.json', (results : Results[]) => {
    results.forEach((x) => {
      console.log(x);
    });
  });
});