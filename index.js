var Windowsill = require('../windowsill');
var merge = require('deepmerge');

var Desktopical = function(opts) {
  this.opts = {};
  if(!opts) opts = {};
  merge(this.opts, opts);

  this.workspaces = [];
  this.applications = {};
  this.runningApps = [];

  this.element = document.createElement("div");
  this.element.className = "desktopical";
  this.addWorkspace();
};
Desktopical.prototype.addWorkspace = function() {
  var workspace = new Windowsill.Workspace();
  this.workspaces.push(workspace);
  if(this.workspaces.length == 1) {
    this.switchToWorkspace(0);
  }
  return workspace;
};
Desktopical.prototype.switchToWorkspace = function(index) {
  if(this.visibleWorkspace) {
    this.element.removeChild(this.workspaces[this.visibleWorkspace]);
  }
  this.visibleWorkspace = index;
  this.element.appendChild(this.workspaces[this.visibleWorkspace]);
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
