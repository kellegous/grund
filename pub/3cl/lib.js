
var Lib = (function() {

  var allowUpDownControl = function(element, incr) {
    console.log(element);
    element.addEventListener('keydown', function(e) {
      switch (e.keyCode) {
      case 38:
        element.value = (parseFloat(element.value) + incr).toFixed(1);
        break;
      case 40:
        element.value = (parseFloat(element.value) - incr).toFixed(1);
        break;
      }
    });
  };


  var forEach = function(obj, fun) {
    for (var k in obj) {
      fun(k, obj[k]);
    }
  };


  var keys = function(obj) {
    if (Object.keys) {
      return Object.keys(obj);
    }

    var keys = [];
    for (var k in obj) {
      keys.push(key);
    }
    return keys;
  };


  return {
    allowUpDownControl: allowUpDownControl,
    forEach:            forEach,
    keys:               keys,
  };
})();