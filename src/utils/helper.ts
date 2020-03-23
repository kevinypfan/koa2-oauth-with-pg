export var delay = function(s) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, s);
  });
};
