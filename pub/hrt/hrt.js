$(document).ready(function() {
  var n = 0;
  var c = $('#c').text('' + n);

  $('#a').click(function(e) {
    var x = $('div', this).show()
      .css('opacity', 1)
      .css('left', '')
      .css('right', '')
      .css('top', '')
      .css('bottom', '')
      .animate({
        left: -20,
        right: -20,
        top: -20,
        bottom: -20,
        opacity: 0.1
      }, 200, function() {
        x.hide();
        c.text('' + (++n));
      });
  });
});