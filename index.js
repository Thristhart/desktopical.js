var Windowsill = require('windowsill');
var Menuine = require('menuine');
var merge = require('deepmerge');
var Sortable = require('sortablejs');
var interact = require('interact.js');
var log = require('debug')('desktopical');
var util = require('util');


var Desktopical = function(opts) {
  this.opts = {
    taskBar: "bottom",
    menuEnabled: true,
    windowSpawnTransition: 300
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
  if(this.opts.menuEnabled) {
    workspace.element.addEventListener("click", function() {
      this.startMenu.hide();
    }.bind(this));
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
  var item = this.startMenu.subMenus[0].addItem({text: app.fullname});
  item.element.addEventListener("click", function() {
    this.run(app.shortname);
    this.startMenu.hide();
  }.bind(this));

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

  var workspace = this.workspaces[opts.workspace];
  var windowObject = workspace.createWindow(opts);
  var transitionDuration = this.opts.windowSpawnTransition;
  windowObject.element.style.transform += " scale(0.1)";
  windowObject.element.style.transition = "transform " + transitionDuration + "ms";
  // doing this forces the element to recgonize the scaling
  // so that we can now transition
  window.getComputedStyle(windowObject.element).transform; 
  windowObject.element.style.transform = windowObject.element.style.transform.replace("scale(0.1)", "scale(1)");
  setTimeout(function() {
    windowObject.element.style.transition = "none";
  }, transitionDuration);
  if(this.taskbar) {
    this.createTaskbarButton(windowObject, app);
    // we do this redundantly because the button didn't exist when we last focused the window
    workspace.focus(windowObject);
  }
  return windowObject;
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

  if(this.opts.menuEnabled) {
    this.createMenuButton();
  }
  this.element.className = "desktopical desktop taskbar_" + this.opts.taskBar;
  this.element.appendChild(this.taskbar);
};
Desktopical.prototype.createMenuButton = function() {
  this.menuButton = document.createElement("button");
  this.menuButton.className = "desktopical menuButton";
  this.taskbar.appendChild(this.menuButton);
  this.startMenu = new Menuine();
  this.element.appendChild(this.startMenu.element);
  this.startMenu.addSubmenu({text: "Apps"}, new Menuine());
  this.menuButton.addEventListener("click", function() {
    this.startMenu.toggle();
  }.bind(this));
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
  if(this.startMenu) {
    if(newOrientation == "right") {
      this.startMenu.setDirection("left");
    }
    else {
      this.startMenu.setDirection("right");
    }
    this.startMenu.render();
  }

};
Desktopical.prototype.createTaskbarButton = function(window, app) {
  var buttonElement = document.createElement("li");
  buttonElement.className = "desktopical task " + app.constructor.shortname + "app";
  buttonElement.setAttribute("data-appid", app.constructor.shortname);
  buttonElement.innerHTML = window.title;
  buttonElement.addEventListener("click", function() {
    this.workspace().focus(window);
  }.bind(this));
  window.on("titleChange", function(oldTitle, newTitle) {
    buttonElement.innerHTML = newTitle;
  });
  window.on("focus", function() {
    buttonElement.classList.add("focused");
  });
  window.on("blur", function() {
    buttonElement.classList.remove("focused");
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
