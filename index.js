var Windowsill = require('../windowsill');
var merge = require('deepmerge');
var log = require('debug')('desktopical');
var util = require('util');

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

Desktopical.Application = require('./lib/application.js');

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
    this.element.removeChild(this.workspaces[this.visibleWorkspace].element);
  }
  this.visibleWorkspace = index;
  this.element.appendChild(this.workspaces[this.visibleWorkspace].element);
  log("Switched to workspace %d", index);
};
Desktopical.prototype.registerApplication = function(app) {
  if(!app.shortname || this.applications[app.shortname])
    throw new Error("Applications must have a unique shortname");
  if(!app.fullname)
    throw new Error("Applications must have a full name");
  if(!app.description)
    throw new Error("Applications must have a description");

  util.inherits(app, Desktopical.Application);
  this.applications[app.shortname] = app;

  log("Registered new application: <%s> - '%s'", app.shortname, app.fullname);
};
Desktopical.prototype.run = function(app) {
  var instance;
  if(app instanceof Desktopical.Application) {
    instance = new app(this);
  }
  if((typeof app) === "string") {
    instance = new this.applications[app](this);
  }
  if(!instance)
    throw new Error("Unknown/unregistered app " + app);
  this.runningApps.push(instance);
  return instance;
};
Desktopical.prototype.createWindow = function(app, opts) {
  if(!opts) opts = {};
  opts = merge({
    workspace: this.visibleWorkspace
  }, opts);
  log(this.workspaces, opts);
  var window = this.workspaces[opts.workspace].createWindow(opts);
  return window;
};
module.exports = Desktopical;
