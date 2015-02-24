var events = require('events');
var util = require('util');
var log = require('debug')('desktopical:application:base');

var Application = function() {
  this.on("focused", function() {
    log("Focused");
  });
};

util.inherits(Application, events.EventEmitter);

module.exports = Application;
