/// <reference path="../../lib/jquery.d.ts" />

function calculateAlphabetSize(password) : number {
  var alphabet = 0, lower = false, upper = false, numbers = false, symbols1 = false, symbols2 = false, other = '', c;
  
  for(var i = 0; i < password.length; i++) {
    c = password[i];
    if(!lower && 'abcdefghijklmnopqrstuvwxyz'.indexOf(c) >= 0) {
      alphabet += 26;
      lower = true;
    }
    else if(!upper && 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(c) >= 0) {
      alphabet += 26;
      upper = true;
    }
    else if(!numbers && '0123456789'.indexOf(c) >= 0) {
      alphabet += 10;
      numbers = true;
    }
    else if(!symbols1 && '!@#$%^&*()'.indexOf(c) >= 0) {
      alphabet += 10;
      symbols1 = true;
    }
    else if(!symbols2 && '~`-_=+[]{}\\|;:\'",.<>?/'.indexOf(c) >= 0) {
      alphabet += 22;
      symbols2 = true;
    }
    else if(other.indexOf(c) === -1) {
      alphabet += 1;
      other += c;
    }
  }
  
  return alphabet;
}

function calculateEntropy(password) : number {
  if(password.length === 0) return 0;
  var entropy = password.length * Math.log(calculateAlphabetSize(password)) / Math.log(2);
  //return Math.round(entropy * 100) / 100;
  return entropy;
}
  
$(document).ready(() => {
  var ent = $('#ent');
  var pwd = $('#pwd').focus()
    .on('keyup', (e : KeyboardEvent) => {
      ent.text(calculateEntropy(pwd.val()).toFixed(2));
    });
});