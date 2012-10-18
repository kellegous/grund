(function(){
#include "common.js"

// Model.
function Model() {
}
Model.create = function(stations, width, height, size) {
}

function main() {
  xhrGet('stations.json',
    function(r) {
    },
    function(r) {
    });
}

whenReady(main);
})();
