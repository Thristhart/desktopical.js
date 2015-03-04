var Windowsill = require('../windowsill');
var merge = require('deepmerge');
var Sortable = require('sortablejs');
var interact = require('interact.js');
var log = require('debug')('desktopical');
var util = require('util');


var Desktopical = function(opts) {
  this.opts = {
    taskBar: "bottom"
  };
  if(!opts) opts = {};
  this.opts = merge(this.opts, opts);

  this.workspaces = [];
  this.applications = {};
  this.runningApps = [];

  this.element = document.createElement("div");
  this.element.className = "desktopical desktop";
  this.addWorkspace();
  this.createTaskbar();

  this.tick();
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
    this.element.removeChild(this.workspace().element);
  }
  this.visibleWorkspace = index;
  this.element.appendChild(this.workspace().element);
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
  var window = this.workspaces[opts.workspace].createWindow(opts);
  if(this.taskbar) {
    this.createTaskbarButton(window, app);
  }
  return window;
};

Desktopical.prototype.workspace = function(index) {
  if(typeof index == "undefined" || index === null) {
    index = this.visibleWorkspace;
  }
  return this.workspaces[index];
};

Desktopical.prototype.createTaskbar = function() {
  if(!this.opts.taskBar)
    return;
  this.taskbar = document.createElement("ul");
  this.taskbar.className = "desktopical taskbar " + this.opts.taskBar;
  this.taskbarSortController = new Sortable(this.taskbar, {
    draggable: ".task"
  });
  interact(this.taskbar)
    .draggable({})
    .actionChecker(function(event, defaultAction, interactable, element) {
      if(event && event.target === element) {
        return defaultAction;
      }
    })
    .on("dragmove", function(event) {
      var quadrant = this.workspace().getCursorQuadrant();
      if(quadrant != this.opts.taskBar)
        this.moveTaskbar(quadrant);
    }.bind(this));
  this.element.className = "desktopical desktop taskbar_" + this.opts.taskBar;
  this.element.appendChild(this.taskbar);
};
Desktopical.prototype.moveTaskbar = function(newOrientation) {
  this.opts.taskBar = newOrientation;
  if(!this.taskbar) {
    this.createTaskbar();
  }
  else {
    this.taskbar.className = "desktopical taskbar " + this.opts.taskBar;
    this.element.className = "desktopical desktop taskbar_" + this.opts.taskBar;
  }
};
Desktopical.prototype.createTaskbarButton = function(window, app) {
  var buttonElement = document.createElement("li");
  buttonElement.className = "desktopical task " + app.constructor.shortname + "app";
  buttonElement.setAttribute("data-appid", app.constructor.shortname);
  buttonElement.innerText = window.title;
  buttonElement.addEventListener("click", function() {
    this.workspace().focus(window);
  }.bind(this));
  window.on("titleChange", function(oldTitle, newTitle) {
    buttonElement.innerHTML = newTitle;
  });
  this.taskbar.appendChild(buttonElement);
};

Desktopical.prototype.tick = function() {
  this.runningApps.forEach(function(appInstance) {
    appInstance.emit("tick");
  });
  requestAnimationFrame(this.tick.bind(this));
};
module.exports = Desktopical;
