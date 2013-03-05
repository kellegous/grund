
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


  return {
    allowUpDownControl: allowUpDownControl
  };
})();