var Windowsill = require('../windowsill');
var merge = require('deepmerge');

var Desktopical = function(opts) {
  this.opts = {
    appPath: "./apps/"
  };
  if(!opts) opts = {};
  merge(this.opts, opts);

  this.workspaces = [];
  this.applications = {};
  this.runningApps = [];

  this.addWorkspace();
};
Desktopical.prototype.addWorkspace = function() {
  var workspace = new Windowsill.Workspace();
  this.workspaces.push(workspace);
  return workspace;
};
Desktopical.prototype.registerApplication = function(app) {
  if(!app.shortname)
    throw new Error("Applications must have a unique shortname");
  if(!app.name)
    throw new Error("Applications must have a name");
  if(!app.descriptions)
    throw new Error("Applications must have a description");
  if(!app instanceof EventEmitter)
    throw new Error("Applications must inherit EventEmitter");
};
module.exports = Desktopical;
