if (!window.jQuery) {
    throw new Error("[jswm.js] jQuery has not been loaded");
} else if (!window.TBI) {
    throw new Error("[jswm.js] base.js has not been loaded");
} else if (!window.TBI.Util) {
    throw new Error("[jswm.js] util.js has not been loaded");
} else {

function JSWM(rootElement) {
    this.settings = {
        menubar: {
            enabled: true
        },
        windowList: {
            enabled: true
        },
        windows: {
            lockToScreen: true,
            defaults: {
                x: 200,
                y: 200,
                width: 350,
                height: 180,
                macStyleHeader: false,
                bound: false,
                minimise: true,
                maximise: true,
                resize: true,
                workspace: 0
            }
        }
    };

    this.rootElement = rootElement;

    this.workspaces = [];
    this.Workspace = function () {
        this.windows = [];
        this.element = document.createElement("li");
    }
    this.createWorkspace = function () {
        var newWorkspace = new this.Workspace();
        this.rootElement.gecn("workspaces")[0].appendChild(newWorkspace.element);
        this.workspaces.push(newWorkspace);
    }
    this.cleanWorkspaces = function () {
        for (var w=0;w<this.workspaces.length;w++) {
            var workspace = this.workspaces[w];
            var markedForDeletion = [];
            for (var i=0;i<workspace.windows.length;i++) {
                var currWin = workspace.windows[i];
                if (currWin.closed) {
                    currWin.element.remove();
                    markedForDeletion.push(i);
                }
            }
            for (var i=0;i<markedForDeletion.length;i++) workspace.windows.remove(markedForDeletion[i]);
        }
    }
    this.createWorkspace();

    this.getAllWindows = function () {
        var windows = [];
        for (var w=0;w<this.workspaces.length;w++) windows = windows.concat(this.workspaces[w].windows);
        return windows;
    }
    this.getWindowById = function (id) {
        var windows = this.getAllWindows();
        for (var i=0;i<windows.length;i++)
            if (windows[i].id == id) return windows[i];
        return null;
    }
    this.getSelectedWindow = function () {
        var windows = this.getAllWindows();
        for (var i=0;i<windows.length;i++)
            if (windows[i].selected) return windows[i];
        return null;
    }

    this.objectOverride = function (original, override) {
        for (var prop in override) if (original.hasOwnProperty(prop)) {
            if (typeof override[prop] == "object" && typeof original[prop] == "object")
                this.objectOverride(original[prop], override[prop]);
            else original[prop] = override[prop];
        }
        return original;
    }
    this.attachWindowToWorkspace = function (workspaceNumber, win) {
        this.workspaces[workspaceNumber].element.appendChild(win.element);
        this.workspaces[workspaceNumber].windows.push(win);
    }

    this.createWindow = function (title, content, icon, options) {
        options = this.objectOverride(this.settings.windows.defaults, options);

        var newWindow = new this.Window(this, title, content, icon, options);
        this.attachWindowToWorkspace(options.workspace, newWindow);
        this.selectWindow(newWindow.id);
        if (this.settings.windowList.enabled) this.updateWindowList(this.rootElement.gecn("window-list")[0]);
        return newWindow;
    }
    this.closeWindow = function (id) {
        var win = this.getWindowById(id);
        if (isNull(win)) return;

        win.close();
        if (this.settings.windowList.enabled) this.updateWindowList(this.rootElement.gecn("window-list")[0]);
        new TBI.Timer(function (win) {
            return function () {
                win.closed = true;
                win.wm.cleanWorkspaces();
            }
        }(win), 200, false);
    }
    this.clearWindowSelection = function () {
        var selected = this.getSelectedWindow();
        if (!isNull(selected)) selected.selected = false;

        this.updateWindowList();
    }
    this.minimiseWindow = function (id) {
        this.clearWindowSelection();

        var win = this.getWindowById(id);
        $(win.element).toggleClass("minimised", true);
    }
    this.selectWindow = function (id) {
        this.clearWindowSelection();

        var win = this.getWindowById(id);
        win.selected = true;
        $(win.element).toggleClass("minimised", false);

        var maxZIndex = 0;
        var windows = this.getAllWindows();
        for (var i=0;i<windows.length;i++) {
            var zIndex = windows[i].element.getStyle("zIndex");
            if (parseInt(zIndex).toString() == zIndex) maxZIndex = Math.max(parseInt(zIndex), maxZIndex);
        }
        win.element.style.zIndex = maxZIndex + 1;

        this.updateWindowList();
    }

    this.Window = function (wm, title, content, icon, options) {
        console.log(options);
        this.wm = wm;
        this.id = generateUUID();

        var win = document.createElement("div");
        win.id = this.id;
        // using homogenous style property
        // "<x>%" = interpreted literally
        // "<x>px" = interpreted literally
        // <x>, where <x> <= 1 = interpreted as "<x>%"
        // <x>, where <x> > 1 = interpreted as "<x>px"
        function setHomogenStyleProperty(name, value) {
            value = value.toString();
            if (value.search("%") != -1 || value.search("px") != -1)
                win.style[name] = value;
            else if (Math.abs(parseFloat(value)) <= 1)
                win.style[name] = (Math.abs(parseFloat(value)) * 100) + "%";
            else win.style[name] = parseFloat(value) + "px";
        }
        setHomogenStyleProperty("left", options.x);
        setHomogenStyleProperty("top", options.y);
        setHomogenStyleProperty("width", options.width);
        setHomogenStyleProperty("height", options.height);
        win.className = "window";

        var header = document.createElement("div");
            header.className = "window-header";
            if (options.macStyleHeader) header.className += " mac-style";

            if (!isNull(icon)) {
                var iconEl = document.createElement("img");
                iconEl.className = "window-icon";
                iconEl.src = icon;
                iconEl.alt = title;
                header.appendChild(iconEl);
            }

            var titleEl = document.createElement("h2");
                titleEl.className = "window-title";
                titleEl.innerHTML = title;

                var buttonEl = document.createElement("div");
                    buttonEl.className = "window-header-buttons";

                    var closeButton = document.createElement("div");
                        closeButton.className = "window-header-close";
                    buttonEl.appendChild(closeButton);
                    if (options.minimise) {
                        var minButton = document.createElement("div");
                            minButton.className = "window-header-minimise";
                        buttonEl.appendChild(minButton);
                    }
                    if (options.maximise) {
                        var maxButton = document.createElement("div");
                            maxButton.className = "window-header-maximise";
                        buttonEl.appendChild(maxButton);
                    }
                titleEl.appendChild(buttonEl);
            header.appendChild(titleEl);

            // when the drag begins...
            header.onmousedown = function (win) { return function (event) {
                win.beginPos = new Vector2D(event.clientX, event.clientY); // mouse position on drag start
                win.beginStyle = new Vector2D(parseFloat(win.style.left), parseFloat(win.style.top)); // window offset on drag start
            }; }(win);
            // on drag
            header.onmousemove = function (win) { return function (event) {
                var prevPos = win.beginPos; // mouse position on drag start

                // if the drag has begun (i.e. win.beginPos has been set)
                if (!isNull(prevPos)) {
                    // if the window is maximised...
                    if (win.className.search(/^(max|min)imised| (max|min)imised |(max|min)imised$/) != -1)
                        // un-maximise it
                        $(win).toggleClass("maximised", false);

                    // instant transition
                    $(win).css("transition", "0s all");

                    // current mouse position
                    var currPos = new Vector2D(event.clientX, event.clientY);
                    // window offset on drag start
                    var prevStyle = win.beginStyle;

                    // (to be) current window offset, calculated here
                    var currStyle = new Vector2D(
                        // drag start offset + difference of start and current cursor positions
                        prevStyle.x + currPos.x - prevPos.x,
                        prevStyle.y + currPos.y - prevPos.y
                    );
                    var minDims = new Vector2D(
                        parseInt(getComputedStyle(win).minWidth),
                        parseInt(getComputedStyle(win).minHeight)
                    );
                    if (options.bound) {
                        currStyle.x = Math.min(Math.max(currStyle.x, 0), (window.innerWidth - minDims.x));
                        currStyle.y = Math.min(Math.max(currStyle.y, 0), (window.innerHeight - minDims.y));
                    }

                    // set the window offset
                    win.style.left = currStyle.x + "px";
                    win.style.top = currStyle.y + "px";

                    // width of the hotzone on the top of the screen
                    var topsidePadding = 8;
                    // if the window is inside the hotzone...
                    if (currStyle.y <= topsidePadding) {
                        // mark it as "ready to maximise" (and use some CSS magic to do a cool effect)
                        $(win).toggleClass("max-ready", true);
                    // otherwise don't mark it
                    } else $(win).toggleClass("max-ready", false);

                    if (options.bound) {
                        win.style.maxWidth = window.innerWidth - currStyle.x + "px";
                        win.style.maxHeight = window.innerHeight - currStyle.y + "px";
                    } else {
                        win.style.maxWidth = "100%";
                        win.style.maxHeight = "100%";
                    }

                    // mark the window as "moving" (this is so the CSS ::after cursor retention hack works)
                    $(win).toggleClass("moving", true);
                }
            }; }(win);
            // when the drag ends
            header.onmouseup = function (win) { return function (event) {
                // unset the drag start variables (signalling that the drag has stopped)
                win.beginPos = undefined;
                win.beginStyle = undefined;

                // regular smooth transition
                $(win).css("transition", "0.2s all");
                // if the window has been marked "ready to maximise"...
                if (win.className.search(/^max\-ready| max\-ready |max\-ready$/) != -1 &&
                    // and the mouse has deliberately been released
                    event.type == "mouseup") {
                    // maximise the window
                    $(win).toggleClass("maximised", true);
                }

                // unset the flagging classes
                $(win).toggleClass("max-ready", false);
                $(win).toggleClass("moving", false);
            }; }(win);
            // end drag when mouse inadvertently leaves the window (along with when the drag is actually being ended)
            header.onmouseleave = header.onmouseup;

        win.appendChild(header);

        var contentEl = document.createElement("div");
            contentEl.className = "window-content";

            var bodyEl = document.createElement("div");
                bodyEl.className = "window-body";
                bodyEl.innerHTML = content;
            contentEl.appendChild(bodyEl);
        win.appendChild(contentEl);

        if (options.resize) {
            win.className += " resizable";
            var resizerEl = document.createElement("div");
                resizerEl.className = "window-resizer";
                resizerEl.onmousedown = function (event) {
                    var win = $(this).parent();
                    this.origWidth = parseInt(getComputedStyle(win[0]).width);
                    this.origHeight = parseInt(getComputedStyle(win[0]).height);
                    this.origX = event.clientX;
                    this.origY = event.clientY;

                    win.toggleClass("resizing", true);
                    win.css("transition", "0s all");
                };
                resizerEl.onmouseup = function () {
                    this.origWidth = this.origHeight =
                    this.origX = this.origY = null;

                    $(this).parent().toggleClass("resizing", false);
                    $(this).parent().css("transition", "0.2s all");
                };
                resizerEl.onmouseleave = resizerEl.onmouseup;
                resizerEl.onmousemove = function (event) {
                    if (!isNull(this.origWidth)) {
                        var win = $(this).parent();
                        win[0].style.width = (event.clientX - this.origX) + this.origWidth + "px";
                        win[0].style.height = (event.clientY - this.origY) + this.origHeight + "px";
                    }
                };
            win.appendChild(resizerEl);
        }

        this.title = title;
        this.content = content;
        this.icon = icon;
        this.element = win;
        this.options = options;

        this.closing = false;
        this.closed = false;
        this.close = function () {
            this.closing = true;
            $(this.element).toggleClass("closing", true);
        }

        $(this.element).mousedown(function (wm, minButton) {
            return function (event) {
                if (event.originalEvent.target != minButton)
                    wm.selectWindow(this.id);
            }
        }(this.wm, minButton));

        if (options.minimise) $(minButton).click(function (wm, id) {
            return function () { wm.minimiseWindow(id); }
        }(this.wm, this.id));

        if (options.maximise) $(maxButton).click(function (parent) {
            return function () { $(parent).toggleClass("maximised"); }
        }(this.element));

        $(closeButton).click(function (wm, id) {
            return function () { wm.closeWindow(id); }
        }(this.wm, this.id));
    }

    this.updateWindowList = function (windowList) {
        if (isNull(windowList)) windowList = $(".window-list")[0];

        for (var w=0;w<this.workspaces.length;w++) {
            for (var i=0;i<this.workspaces[w].windows.length;i++) {
                var currWindow = this.workspaces[w].windows[i];
                var match = $(windowList).find("li[data-window-id='"+currWindow.id+"']");

                if (match.length == 0) {
                    var windowListEl = document.createElement("li");
                    windowListEl.title = currWindow.title;
                    windowListEl.setAttribute("data-window-id", currWindow.id);

                    if (!isNull(currWindow.icon)) {
                        var windowListIcon = document.createElement("img");
                        windowListIcon.src = currWindow.icon;
                        windowListIcon.alt = currWindow.title;
                        windowListEl.appendChild(windowListIcon);
                    }

                    var windowListSpan = document.createElement("span");
                        windowListSpan.innerHTML = currWindow.title;
                    windowListEl.appendChild(windowListSpan);

                    windowList.appendChild(windowListEl);

                    $(windowListEl).click(function (wm, id, winList) {
                        return function () {
                            wm.selectWindow(id);
                            wm.updateWindowList(winList);
                        };
                    }(currWindow.wm, currWindow.id, windowList));

                    match = $(windowListEl);
                }

                if (currWindow.closing) match.remove();
                match.toggleClass("selected", currWindow.selected);

                if (match.find("span").length > 0 && currWindow.title != match.find("span")[0].innerHTML)
                    match.find("h2")[0].innerHTML = currWindow.title;

                if (match.find("img").length > 0 && currWindow.icon != match.find("img")[0].src)
                    match.find("img")[0].src = currWindow.icon;
            }
        }
    }
}
var wm;
$(document).on("pageload", function () {
    wm = new JSWM(gebi("desktop"));
    wm.createWindow("JSWM Desktop", "<p>Here, we see a window with text inside of it.</p>", "../assets/res/icons/desktop.svg", {
        x: 200,
        y: 200,
        width: 600,
        height: 300
    });
    wm.createWindow("JSWM Windows", "<p>This is another paragraph.</p>", "../assets/res/icons/windows.svg", {
        x: 600,
        y: 100,
        width: 600,
        height: 150
    });
    $("#start-menu").click(function () { $(this).toggleClass("active"); });
    $("#launch-window").click(function () {
        var creationWindow = wm.createWindow("Window Creation", $("#template-window-launcher").html(), $(this).find("img")[0].src, {
            x: 400,
            y: 300,
            width: 600,
            height: 450
        });
        var el = creationWindow.element;
        $(el).find(".wl-submit").click(function () {
            // get stuff from class name
            function gsfcn(className) { return $(el).find(".wl-"+className).val(); };
            // isNull / not a number
            function isn(val) { return isNull(val) || isNaN(val); }
            wm.createWindow(gsfcn("window-title"), gsfcn("window-content"), gsfcn("window-icon"), {
                x: isn(gsfcn("window-x")) ? 0 : parseInt(gsfcn("window-x")),
                y: isn(gsfcn("window-y")) ? 0 : parseInt(gsfcn("window-y")),
                width: isn(gsfcn("window-width")) ? 200 : parseInt(gsfcn("window-width")),
                height: isn(gsfcn("window-height")) ? 200 : parseInt(gsfcn("window-height"))
            });
        });
    });
});

}
