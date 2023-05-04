/*globals window: true, jQuery:true, console: true, document: true, Hammer: true*/
if (!Crux) {var Crux = {};}
(function () {
    "use strict";
    window.log = console.log.bind(console);

    Crux.gridSize = 16;
    Crux.regexNumbersOnly = new RegExp("[^0-9]", "g");

    Crux.Widget = function (styles) {
        var widget = {};

        widget.name = "";

        widget.x = 0;
        widget.y = 0;
        widget.w = 0;
        widget.h = 0;

        widget.mum = null;
        widget.children = [];
        widget.handlers = [];

        widget.ui = jQuery(document.createElement("div"));
        widget.ui.addClass("widget");
        widget.ui.addClass(styles);

        widget.one = function (name, func, node) {
            if (!node) {
                node = Crux.crux;
            }
            widget.handlers.push({node: node, name: name, func: func});
            node.ui.one(name, func);
            return widget;
        };

        widget.on = function (name, func, node) {
            if (!node) {
                node = Crux.crux;
            }
            widget.handlers.push({node: node, name: name, func: func});
            node.ui.on(name, func);
            return widget;
        };

        widget.off = function () {
            var i;
            for (i = 0; i < widget.handlers.length; i += 1) {
                widget.handlers[i].node.ui.off(widget.handlers[i].name, widget.handlers[i].func);
            }
            widget.handlers = [];
            return widget;
        };

        widget.addChild = function (child) {
            child.mum = widget;
            widget.children.push(child);
            widget.ui.append(child.ui);
            return widget;
        };

        widget.removeChild = function (child) {
            var i;
            var pos = widget.children.indexOf(child);
            if (pos < 0) {
                log("Warning: attempting to remove child that is not a child.");
                return;
            }

            for (i = child.children.length - 1; i >= 0; i--) {
                child.removeChild(child.children[i]);
            }

            child.off();
            child.preRemove();
            child.ui.remove();
            child.mum = null;
            widget.children.splice(pos, 1);
            return widget;
        };

        widget.roost = function (mum) {
            mum.addChild(widget);
            widget.postRoost();
            return widget;
        };

        widget.preRemove = function () {
            // override when needed
        };

        widget.postRoost = function () {
            // override when needed
        };

        widget.style = function (styles) {
            widget.ui.attr("class", "widget " + styles);
            return widget;
        };

        widget.addStyle = function (style) {
            widget.ui.addClass(style);
            return widget;
        };

        widget.removeStyle = function (style) {
            widget.ui.removeClass(style);
            return widget;
        };

        widget.pos = function (x, y) {
            if (x === undefined && y === undefined) {
                widget.x = widget.ui.position().left;
                widget.y = widget.ui.position().top;
                return {x: widget.x, y:widget.y};
            }

            widget.x = x;
            widget.y = y;
            widget.ui.css('left', x + 'px');
            widget.ui.css('top', y + 'px');
            return widget;
        };

        widget.size = function (w, h) {
            if (w === undefined && h === undefined) {
                widget.w = widget.ui.outerWidth(true);
                widget.h = widget.ui.outerHeight(true);
                return {w: widget.w, h: widget.h};
            }

            if (w){
                widget.w = w;
                widget.ui.css('width', w + 'px');
            }

            if (h) {
                widget.h = h;
                widget.ui.css('height', h + 'px');
            }
            return widget;
        };

        widget.place = function (x, y, w, h) {
            widget.pos(x,y);
            if (w !== undefined && h !== undefined) {
                widget.size(w,h);
            }
            return widget;
        };

        widget.grid = function (x, y, w, h) {
            widget.pos(x * Crux.gridSize, y * Crux.gridSize);
            if (w !== undefined && h !== undefined) {
                widget.size(w * Crux.gridSize, h * Crux.gridSize);
            }
            return widget;
        };

        widget.nudge = function (x, y, w, h) {
            widget.x += x;
            widget.y += y;
            widget.ui.css('left', widget.x + 'px');
            widget.ui.css('top', widget.y + 'px');

            widget.w += w;
            widget.h += h;
            widget.ui.css('width', widget.w + 'px');
            widget.ui.css('height', widget.h + 'px');
            return widget;
        };

        widget.inset = function (x) {
            widget.nudge(x, x, -x*2, -x*2);
            return widget;
        };

        widget.trigger = function (ek, ed) {
            widget.ui.trigger(ek, ed);
            return widget;
        };

        widget.hide = function () {
            widget.ui.css("display", "none");
            return widget;
        };

        widget.show = function () {
            widget.ui.css("display", "block");
            return widget;
        };

        widget.tt = function (key) {
            // add a native tool tip
            widget.ui.attr("title", Crux.localise(key));
            return widget;
        };

        return widget;
    };

    Crux.addTransforms = function (widget) {
        widget.tanimate = function (delay, duration, kind, props, callback) {
            delay = delay * 1000;
            // note: to chain animate and transition calls there must be some
            // delay otherwise the two css calls will be ignored.
            if (delay < 20) delay = 20;

            window.setTimeout(function () {
                widget.transition(duration, kind);
                widget.transform(props);
            }, delay);

            if (callback) window.setTimeout(callback, delay + duration*1000);
            return widget;
        };

        widget.transition = function (time, kind) {
            var kinds = ["ease", "ease-in", "ease-out", "ease-in-out", "linear"];
            if (kinds.indexOf(kind) < 0) {
                console.log("invalid transition kind!");
                return widget;
            }
            var styleString = "all " + time + "s " + kind;
            widget.ui.css({
                "-webkit-transition": styleString,
                "transition"        : styleString,
                });
            return widget;
        };

        widget.transform = function (props) {
            if (props.x !== undefined) widget.tx = props.x;
            if (props.y !== undefined) widget.ty = props.y;
            if (props.z !== undefined) widget.tz = props.z;
            if (props.sx !== undefined) widget.tsx = props.sx;
            if (props.sy !== undefined) widget.tsy = props.sy;
            if (props.sz !== undefined) widget.tsz = props.sz;
            if (props.rx !== undefined) widget.trx = props.rx;
            if (props.ry !== undefined) widget.try = props.ry;
            if (props.rz !== undefined) widget.trz = props.rz;
            if (props.ox !== undefined) widget.tox = props.ox;
            if (props.oy !== undefined) widget.toy = props.oy;

            if (props.s !== undefined) {
                widget.tsx = props.s;
                widget.tsy = props.s;
            }
            if (props.r !== undefined) {
                widget.trz = props.r;
            }

            var transformString = "perspective(480px) translate3d("+widget.tx+"px,"+widget.ty+"px,"+widget.tz+"px) scale3d("+widget.tsx+","+widget.tsy+","+widget.tsz+") rotateX("+widget.trx+"deg) rotateY("+widget.try+"deg) rotateZ("+widget.trz+"deg)";
            var originString = widget.tox + " " + widget.toy;
            widget.ui.css({
                "-webkit-transform-origin": originString,
                "transform-origin":  originString,
                "-webkit-transform": transformString,
                "transform"        : transformString,
                });
            return widget;
        };

        if (widget.tx === undefined) {
            widget.tx = 0;
            widget.ty = 0;
            widget.tz = 0;
            widget.tsx = 1;
            widget.tsy = 1;
            widget.tsz = 1;
            widget.trx = 0;
            widget.try = 0;
            widget.trz = 0;
            widget.tox = 0;
            widget.toy = 0;
        }
        widget.transform({});

        return widget;
    };

    Crux.Clickable = function (eventKind, eventData) {
        // CSS is also broken with touch events because :hover and :active are both triggered incorrectly. For us to
        // have a nice solid touch interface we simply need to manage our own button states.

        // Handling both touch and click events is broken in most browsers. The internet suggest you can call
        // event.preventDefault on touchstart events so that mouse events will not be fired, but this doesn't prevent
        // mouseover events, and mouseout events are simply not triggered.

        // Rather than trying to support both touch and mouse events, we'll just support one; and rather than try and
        // detect if the device supports touch, or not, or both, we'll wait for the user to use a touch screen, then
        // disable mouse events. see Crux.init

        var clickable = Crux.Widget();

        clickable.eventKind = eventKind;
        clickable.eventData = eventData;
        clickable.enabled = true;

        clickable.styleCurrent = "";
        clickable.styleDown = "";
        clickable.styleUp = "";
        clickable.styleDisabled = "";
        clickable.styleHover = "";

        clickable.ui.attr("tabindex", 0);

        clickable.configStyles = function (up, down, hover, disabled) {
            clickable.styleCurrent = up;
            clickable.styleUp = up;
            clickable.styleDown = down;
            clickable.styleHover = hover;
            clickable.styleDisabled = disabled;
            clickable.ui.addClass(clickable.styleCurrent);
            return clickable;
        };

        clickable.configStyleUp = function (up) {
            clickable.ui.removeClass(clickable.styleUp);
            clickable.styleCurrent = up;
            clickable.styleUp = up;
            clickable.ui.addClass(clickable.styleCurrent);
            return clickable;
        };

        clickable.setStyleState = function (s) {
            if (clickable.enabled === false) {
                s = clickable.styleDisabled;
            }
            if (clickable.styleHover){
                clickable.ui.removeClass(clickable.styleHover);
            }
            clickable.ui.removeClass(clickable.styleCurrent);
            clickable.styleCurrent = s;
            clickable.ui.addClass(clickable.styleCurrent);
            return clickable;
        };

        clickable.click = function (k, d) {
            clickable.eventKind = k;
            clickable.eventData = d;
            return clickable;
        };

        clickable.onClick = function () {
            if (clickable.eventKind && clickable.enabled) {
                clickable.trigger("play_sound", "click");
                clickable.ui.trigger(clickable.eventKind, clickable.eventData);
            }
        };


        clickable.onMouseUp = function (event) {
            if (clickable.enabled) {
                clickable.setStyleState(clickable.styleUp);
            } else {
                clickable.setStyleState(clickable.styleDisabled);
            }
            clickable.onClick();
            event.stopPropagation();
        };

        clickable.onMouseDown = function (event) {
            // prevent touch devices firing both touch and mouse events.
            if (Crux.touchEnabled) return;
            clickable.setStyleState(clickable.styleDown);
            clickable.ui.one("mouseup", clickable.onMouseUp);
            clickable.one("mouseup", clickable.onClickEnd);
            event.stopPropagation();
        };

        clickable.onMouseOver = function (){
            if (Crux.touchEnabled) return;
            if (clickable.styleHover){
                clickable.ui.addClass(clickable.styleHover);
            }
        };
        clickable.onMouseOut = function (){
            if (Crux.touchEnabled) return;
            if (clickable.styleHover){
                clickable.ui.removeClass(clickable.styleHover);
            }
        };

        clickable.onTouchUp = function (event) {
            clickable.scrollAtUp = jQuery(window).scrollTop();
            if (Math.abs(clickable.scrollAtUp - clickable.scrollAtDown) < 16) {
                clickable.onClick();
            }
            clickable.onClickEnd();
            event.stopPropagation();
        };

        clickable.onTouchDown = function (event) {
            clickable.scrollAtDown = jQuery(window).scrollTop();
            clickable.setStyleState(clickable.styleDown);
            clickable.ui.one("touchend", clickable.onTouchUp);
            clickable.one("touchcancel", clickable.onClickEnd);
            event.stopPropagation();
        };


        clickable.onClickEnd = function () {
            if (clickable.enabled) {
                clickable.setStyleState(clickable.styleUp);
            } else {
                clickable.setStyleState(clickable.styleDisabled);
            }
        };

        clickable.onKeydown = function (event) {
            if (clickable.ui.is(":focus")){
                if (event.which === 13) {
                    event.preventDefault();
                    clickable.onClick();
                }
            }
        };

        clickable.disable = function () {
            clickable.enabled = false;
            clickable.setStyleState(clickable.styleDisabled);
            return clickable;
        };

        clickable.enable = function (truthy) {
            if (truthy === undefined) truthy = true;
            if (!truthy) {
                return clickable.disable();
            }
            clickable.enabled = true;
            clickable.setStyleState(clickable.styleUp);
            return clickable;
        };

        clickable.ui.on("keydown", clickable.onKeydown);
        clickable.ui.on('touchstart', clickable.onTouchDown);
        clickable.ui.on("mouseover", clickable.onMouseOver);
        clickable.ui.on("mouseout", clickable.onMouseOut);
        clickable.ui.on("mousedown", clickable.onMouseDown);

        return clickable;
    };

    Crux.Tab = function (id, eventKind, eventData) {
        var tab = Crux.Clickable(eventKind, eventData);
        tab.addStyle("tab_button");

        tab.label = Crux.Text(id, "button_text")
            .roost(tab);

        tab.widgetGrid = tab.grid;
        tab.grid = function (x,y,w,h) {
            tab.widgetGrid(x,y,w,h);
            tab.nudge(6, 10, -12, -10);
            return tab;
        };

        tab.format = function (templateData) {
            tab.label.format(templateData);
            return tab;
        };

        tab.postRoost = function (){
            tab.label.nudge (0, (tab.h / 2), tab.w);
        };

        tab.activate = function () {
            tab.addStyle("tab_button_active");
            return tab;
        };

        return tab;
    };

    Crux.IconButton = function (id, eventKind, eventData) {
        var iconButton = Crux.Button("", eventKind, eventData);

        iconButton.label
            .style(id + " txt_center icon_button")
            .rawHTML("");

        iconButton.postRoost = function (){
            iconButton.label.nudge(0, (iconButton.h / 2), iconButton.w);
        };

        return iconButton;
    };

    Crux.Button = function (id, eventKind, eventData) {
        var button = Crux.Clickable(eventKind, eventData);

        button.addStyle("button");
        button.configStyles("button_up", "button_down", "button_hover", "button_disabled");

        button.label = Crux.Text(id, "button_text")
            .roost(button);

        button.widgetGrid = button.grid;
        button.grid = function (x,y,w,h) {
            button.widgetGrid(x,y,w,h);
            button.nudge(8, 8, -16, -16);
            return button;
        };
        button.update = function (id) {
            button.label.update(id);
            return button;
        };
        button.format = function (templateData) {
            button.label.format(templateData);
            return button;
        };

        button.postRoost = function (){
            button.label.nudge(0, (button.h / 2), button.w);
        };

        button.rawHTML = function (html) {
            button.label.rawHTML(html);
            return button;
        };

        button.onKeydown = function (event) {
            if (button.ui.is(":focus")){
                if (event.which === 13) {
                    event.preventDefault();
                    button.onClick();
                }
            }
        };
        button.on("keydown", button.onKeydown);

        return button;
    };

    Crux.DropDown = function (selected, selections, eventKind, sorted) {
        var p, i;
        var dropDown = Crux.Widget();

        if (sorted === undefined) {
            sorted = false;
        }

        let sortedSelections = [];
        if (Array.isArray(selections)){
            sortedSelections = selections;
        } else {
            // if selections is not and array its an object.
            for (p in selections) {
                sortedSelections.push([p, selections[p]]);
            }
        }

        if (sorted){
            sortedSelections.sort(function(a,b){
                if (a[1] < b[1]) return -1;
                return 1;
            });
        }

        let labelText = "";
        for (let i = 0; i < sortedSelections.length; i+=1) {
            let item = sortedSelections[i];
            if (item[0] === selected){
                labelText = item[1];
            }
        }


        dropDown.addStyle("drop_down");
        dropDown.eventKind = eventKind;

        dropDown.label = Crux.Text("", "drop_down_text")
            .rawHTML(labelText)
            .roost(dropDown);

        dropDown.icon = Crux.Text("", "icon-down-open drop_down_icon")
            .rawHTML(" ")
            .roost(dropDown);


        var html = "<select>";
        var sel = "", choice = "";

        for (i = 0; i < sortedSelections.length; i += 1) {
            p = sortedSelections[i][0];
            choice = sortedSelections[i][1];
            if (p === selected) {sel = "selected";} else {sel = "";}
            html += "<option value='" + p + "' " + sel + ">" + choice + "</option>";
        }
        html += "</select>";

        dropDown.select = jQuery(html);
        dropDown.ui.append(dropDown.select);
        dropDown.label.rawHTML(dropDown.select.children("option:selected").text());

        dropDown.widgetGrid = dropDown.grid;
        dropDown.grid = function (x,y,w,h) {
            dropDown.widgetGrid(x,y,w,h);
            dropDown.nudge(8, 8, -16, -16);
            return dropDown;
        };

        dropDown.onChange = function () {
            dropDown.label.rawHTML(dropDown.select.children("option:selected").text());
            if (dropDown.eventKind) {
                dropDown.ui.trigger(dropDown.eventKind, dropDown.select.val());
            }
        };
        dropDown.ui.change(dropDown.onChange);

        dropDown.getValue = function() {
            return dropDown.select.val();
        };

        dropDown.setValue = function(val) {
            dropDown.select.val(val);
            dropDown.label.rawHTML(dropDown.select.children("option:selected").text());
        };

        dropDown.postRoost = function (){
            dropDown.label.nudge (8, (dropDown.h / 2), dropDown.w);
            dropDown.icon.place(dropDown.w - 28, (dropDown.h / 2), 28, 28);
        };

        dropDown.preRemove  = function () {
            if (window.document.activeElement === dropDown.select[0]) {
                window.document.activeElement.blur();
            }
        };

        dropDown.onKeydown = function (event) {
            if (dropDown.ui.is(":focus")){
                if (event.which === 13 || event.which === 38 || event.which === 40) {
                    dropDown.select.focus();
                }
            }
        };

        dropDown.on("keydown", dropDown.onKeydown);
        return dropDown;
    };

    Crux.Text = function (id, styles) {
        var text = Crux.Widget();

        if (styles) {
            text.style(styles);
        }

        text.update = function (id) {
            if (!isNaN(Number(id))) {
                text.ui.html(id);
                return text;
            }

            var source = Crux.templates[id];
            if (!source) {
                text.ui.html("'" + id + "'");
            } else {
                text.ui.html(source);
            }
            return text;
        };
        text.update(id);
        text.format = function (td) {
            text.ui.html(Crux.format(text.ui.html(), td));
            return text;
        };
        text.updateFormat = function (id, td) {
            text.update(id);
            text.format(td);
            return text;
        };
        text.rawHTML = function (html) {
            text.ui.html(html);
            return text;
        };

        return text;
    };

    Crux.Image = function (src, style) {
        var image = Crux.Widget();
        if (style === undefined) {
            style = "";
        }
        image.ui = jQuery(document.createElement("img"));
        image.ui.addClass("widget " + style);
        image.ui.attr("draggable", false);

        if (src) {
            image.ui.attr("src", src);
        }
        image.ui[0].style.display = "none";
        image.ui.attr("onLoad", function () {
            image.ui[0].style.display = "inherit";
        });

        image.src = function(filename) {
            image.ui.attr("src", filename);
        };

        return image;
    };

    Crux.BlockValue = function (label, value, style) {
        var blockValue;
        blockValue = Crux.Widget(style);

        blockValue.widgetGrid = blockValue.grid;
        blockValue.grid = function (x, y, w, h) {
            blockValue.widgetGrid(x, y, w, h);
            blockValue.label.grid(0, 0, w, h);
            blockValue.value.grid(0, 0, w, h);
            return blockValue;
        };

        blockValue.widgetSize = blockValue.size;
        blockValue.size = function(w, h) {
            if (w === undefined && h === undefined) {
                return blockValue.widgetSize();
            }
            blockValue.widgetSize(w, h);
            blockValue.label.size(w, h);
            blockValue.value.size(w, h);
            return blockValue;
        };

        blockValue.label = Crux.Text(label, "pad12")
            .roost(blockValue);

        blockValue.value = Crux.Text("",  "txt_right pad12")
            .rawHTML(value)
            .roost(blockValue);

        return blockValue;
    };

    Crux.BlockValueBig = function (label, icon, value, style) {
        var blockValueBig = Crux.Widget(style);

        blockValueBig.widgetGrid = blockValueBig.grid;
        blockValueBig.grid = function (x, y, w, h) {
            blockValueBig.widgetGrid(x, y, w, h);
            blockValueBig.label.grid(0, 0, w, 3);
            blockValueBig.value.grid(0, 3, w, 3);
            return blockValueBig;
        };

        blockValueBig.label = Crux.Text(label, "txt_center pad12")
            .roost(blockValueBig);

        blockValueBig.value = Crux.Text("",  icon + " txt_center block_value_big_value")
            .rawHTML(value)
            .roost(blockValueBig);

        return blockValueBig;
    };

    Crux.TextInput = function (lines, eventKind, type, pattern) {
        // lines should be "single" or "multi"
        // eventKind is called on change.

        // optional
        // type is "text" or "password" or "number" or "email"
        // pattern is a regex. see MDN

        var textInput;
        textInput = Crux.Widget();

        textInput.eventKind = eventKind;

        textInput.type = "text";
        if (type) {
            textInput.type = type;
        }

        textInput.pattern = "";
        if (pattern){
            textInput.pattern = pattern;
        }

        if (lines == "single") {
            textInput.node = jQuery("<input type='" + textInput.type + "' pattern = '"+textInput.pattern+"'class='text_area'></input>");
        }
        if (lines == "multi" ) {
            textInput.node = jQuery("<textarea class='text_area'></textarea>");
        }

        if (textInput.type === "number") {
            textInput.node.css("text-align", "center");
        }

        textInput.ui.append(textInput.node);
        textInput.ui.addClass("col_black rad4 text_area_border");

        textInput.onChange = function (e) {
            if (textInput.numbersOnly === true) {
                textInput.node.val(textInput.node.val().replace(Crux.regexNumbersOnly, ""));
            }
            if (textInput.eventKind) {
                textInput.ui.trigger(textInput.eventKind, textInput.eventData);
            }
            if (e.keyCode === 13) {
                if (textInput.onEnterEvent) {
                    textInput.trigger(textInput.onEnterEvent);
                }
            }
        };

        textInput.widgetGrid = textInput.grid;
        textInput.grid = function (x, y, w, h) {
            textInput.widgetGrid(x, y, w, h);
            textInput.nudge(6, 6, -12, -12);
            return textInput;
        };

        textInput.setText = function (t) {
            if (textInput.type === "number") {
                textInput.node.val(Number(t));
            }
            textInput.node.val(t);
            return textInput;
        };

        textInput.getText = function () {
            if (textInput.type === "number") {
                return Number(textInput.node.val());
            }
            return textInput.node.val();
        };

        textInput.getValue = function () {
            return(textInput.getText());
        };
        textInput.setValue = function (v) {
            return(textInput.setText(v));
        };

        textInput.focus = function () {
            textInput.node.focus();
            var elemLen = textInput.node[0].value.length;
            textInput.node[0].selectionStart = elemLen;
            textInput.node[0].selectionEnd = elemLen;
            return textInput;
        };

        textInput.focus = function () {
            // we have a delay here because normally this call is made in the
            // middle of another event handler, and we don't want to focus to
            // change until it have fully completed. (or it may change again
            // after we change it here.)
            window.setTimeout(function() {
                textInput.node[0].setSelectionRange(textInput.selectionStart, textInput.selectionEnd);
                textInput.node.focus();
            }, 1);
            return textInput;
        };

        textInput.insert = function (string) {
            textInput.selectionStart = textInput.node[0].selectionStart;
            textInput.selectionEnd = textInput.node[0].selectionEnd;
            var com = textInput.getText();
            if (com[textInput.selectionEnd] !== " ") {
                string = string + " ";
            }
            if (com[textInput.selectionStart -1] !== " ") {
                string = " " + string;
            }
            var fullString = com.slice(0, textInput.selectionStart) + (string) + com.slice(textInput.selectionEnd);
            textInput.setText(fullString);

            textInput.selectionStart = textInput.selectionStart + string.length;
            textInput.selectionEnd = textInput.selectionStart;

            textInput.focus();
        };

        textInput.preRemove  = function () {
            if (window.document.activeElement === textInput.node[0]) {
                window.document.activeElement.blur();
            }
        };

        textInput.node.on("keyup", textInput.onChange);
        textInput.node.on("change", textInput.onChange);

        return textInput;
    };

    //--------------------------------------------------------------------------
    // Animation Tools
    //--------------------------------------------------------------------------
    Crux.anims = [];
    Crux.lastTick = new Date().getTime();
    Crux.tickCallbacks = [];
    Crux.frameCounter = [];
    Crux.drawReqired = false;

    Crux.removeCompleteAnims = function () {
        var i;
        for (i = Crux.anims.length - 1; i > -1; i -= 1) {
            if (Crux.anims[i].complete) {
                if (Crux.anims[i].completeCallback) {
                    Crux.anims[i].completeCallback(Crux.anims[i].target);
                }
                Crux.anims.splice(Crux.anims.indexOf(Crux.anims[i]), 1);
            }
        }
    };
    Crux.killAnimsOf = function (obj) {
        var i;
        for (i = 0; i < Crux.anims.length; i += 1) {
            if (Crux.anims[i].target === obj) {
                Crux.anims[i].complete = true;
            }
        }
        Crux.removeCompleteAnims();
    };
    Crux.tickAnims = function (delta) {
        var i = 0, leni = 0;
        for (i = 0, leni = Crux.anims.length; i < leni; i += 1) {
            Crux.anims[i].tick(delta);
            Crux.drawReqired = true;
        }
        Crux.removeCompleteAnims();
    };
    Crux.createAnim = function (target, property, start, end, duration, optional) {
        var anim = {};

        anim.target = target;
        anim.property = property;

        anim.start = start;
        anim.end = end;
        anim.duration = duration;

        // optional params
        if (!optional) {
            optional = {};
        }

        if (optional.onFrame) {
            anim.onFrame = optional.onFrame;
        } else {
            anim.onFrame = null;
        }

        if (optional.onComplete) {
            anim.completeCallback = optional.onComplete;
        } else {
            anim.completeCallback = null;
        }

        if (optional.onStart) {
            anim.startCallback = optional.onStart;
            if (anim.delay === 0) {
                anim.startCallback();
            }
        } else {
            anim.startCallback = null;
        }

        if (optional.delay) {
            anim.delay = optional.delay;
        } else {
            anim.delay = 0;
        }

        if (optional.ease) {
            anim.ease = optional.ease;
        } else {
            anim.ease = Crux.easeInOutQuad;
        }

        anim.complete = false;
        anim.timeAcc = 0;

        anim.target[anim.property] = anim.start;

        anim.tick = function (delta) {
            var r;

            if (anim.delay > delta) {
                anim.delay -= delta;
                return;
            }

            if (anim.delay > 0 && anim.delay < delta) {
                delta -= anim.delay;
                anim.delay = 0;
                if (anim.startCallback) {
                    anim.startCallback();
                }
            }

            anim.timeAcc += delta;
            r = anim.ease(anim.timeAcc, 0, 1, anim.duration);
            anim.target[anim.property] = anim.start + r * (anim.end - anim.start);
            if (anim.onFrame) {
                anim.onFrame();
            }
            if (anim.timeAcc >= anim.duration) {
                anim.complete = true;
                anim.target[anim.property] = anim.end;
            }
        };

        Crux.anims.push(anim);
        return anim;
    };
    Crux.mainLoop = function (now) {
        var delta;
        var i = 0, leni = 0;
        window.requestAnimationFrame(Crux.mainLoop);
        delta = now - Crux.lastTick;
        Crux.lastTick = now;

        Crux.tickAnims(delta);

        if (Crux.drawReqired) {
            Crux.drawReqired = false;
            for (i = 0; i < Crux.tickCallbacks.length; i += 1) {
                Crux.tickCallbacks[i]();
            }
        }

        Crux.frameCounter.push(delta);
        Crux.frameRate = 0;
        if (Crux.frameCounter.length >= 100){
            for (i=0, leni = Crux.frameCounter.length; i < leni; i += 1) {
                Crux.frameRate += Crux.frameCounter[i];
            }
            Crux.frameRate /= Crux.frameCounter.length;
            Crux.frameCounter = [];
        }
    };


    //--------------------------------------------------------------------------
    // Animation Eases
    //--------------------------------------------------------------------------
    Crux.easeInOutQuad =  function (t, b, c, d) {
        if ((t /= d / 2) < 1) {
            return c / 2 * t * t + b;
        }
        return -c / 2 * ((t -= 1) * (t - 2) - 1) + b;
    };
    Crux.easeInQuad = function (t, b, c, d) {
        return c * (t /= d) * t + b;
    };
    Crux.easeOutQuad =  function (t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    };

    Crux.easeInBounce = function (t, b, c, d) {
        return c - Crux.easeOutBounce (d-t, 0, c, d) + b;
    };
    Crux.easeOutBounce =function (t, b, c, d) {
        if ((t/=d) < (1/2.75)) {
            return c*(7.5625*t*t) + b;
        } else if (t < (2/2.75)) {
            return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
        } else if (t < (2.5/2.75)) {
            return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
        } else {
            return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
        }
    };
    Crux.easeInOutBounce = function (t, b, c, d) {
        if (t < d/2) return jQuery.easing.easeInBounce(t*2, 0, c, d) * 0.5 + b;
        return Crux.easeOutBounce(t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
    };
    //--------------------------------------------------------------------------


    //--------------------------------------------------------------------------
    // Formatting
    //--------------------------------------------------------------------------
    Crux.formatTime = function (ms, mins, secs) {
        var seconds = ms / 1000;
        var output = "";
        var minutes = 0;
        var hours = 0;
        var days = 0;
        var total_seconds = seconds;

        if (seconds >= 86400) {
            days = seconds / 86400;
            seconds = seconds % 86400;
            output += parseInt(days, 10) + "d ";
        }

        if (seconds >= 3600) {
            hours = seconds / 3600;
            seconds = seconds % 3600;
            output += parseInt(hours, 10) + "h ";
        }

        if (seconds >= 60) {
            minutes = seconds / 60;
            seconds = seconds % 60;
            if (mins) {
                output += parseInt(minutes, 10) + "m ";
            }
        }

        if (seconds > 0) {
            if (mins && secs) {
                output += parseInt(seconds, 10) + "s";
            }
        }

        return output.trim();
    };

    Crux.formatDate = function (md, includeYear) {
        if (!(md instanceof Date)) {
            return "";
        }
        if (isNaN(md.getDay())) {
            return "";
        }

        var dateString = "";
        var day = md.getDay();
        if (day === 1) dateString += "Mon";
        if (day === 2) dateString += "Tue";
        if (day === 3) dateString += "Wed";
        if (day === 4) dateString += "Thu";
        if (day === 5) dateString += "Fri";
        if (day === 6) dateString += "Sat";
        if (day === 7) dateString += "Sun";
        dateString += " ";
        dateString += md.getDate();
        dateString += " ";
        var month = md.getMonth();
        if (month === 0) dateString += "Jan";
        if (month === 1) dateString += "Feb";
        if (month === 2) dateString += "Mar";
        if (month === 3) dateString += "Apr";
        if (month === 4) dateString += "May";
        if (month === 5) dateString += "Jun";
        if (month === 6) dateString += "Jul";
        if (month === 7) dateString += "Aug";
        if (month === 8) dateString += "Sep";
        if (month === 9) dateString += "Oct";
        if (month === 10) dateString += "Nov";
        if (month === 11) dateString += "Dec";
        dateString += " ";

        if (includeYear) {
            dateString += md.getFullYear() + " ";
        }

        dateString += md.getHours();
        dateString += ":";
        if (md.getMinutes() <= 9) {
            dateString += "0";
        }
        dateString += md.getMinutes();
        return dateString.trim();
    };

    Crux.format = function (s, templateData) {
        if (!s) {
            return "error";
        }
        var i, fp, sp, sub, pattern;

        i = 0;
        fp = 0;
        sp = 0;
        sub = "";
        pattern = "";

        // look for standard patterns
        while (fp >= 0 && i < 100) {
            i = i + 1;
            fp = s.search("\\[\\[");
            sp = s.search("\\]\\]");
            sub = s.slice(fp + 2, sp);
            pattern = "[[" + sub + "]]";
            if (templateData[sub] !== undefined) {
                s = s.replace(pattern, templateData[sub]);
            } else {
                s = s.replace(pattern, "(" + sub + ")");
            }
        }
        return s;
    };

    //--------------------------------------------------------------------------
    Crux.localise = function (id){
        if (Crux.templates[id]){
            return Crux.templates[id];
        } else {
            return "'" + id + "'";
        }
    };

    //--------------------------------------------------------------------------
    Crux.formatLocalise = function (s, templateData) {
        var st = Crux.localise(s);
        st = Crux.format(st, templateData);
        return st;
    };

    //--------------------------------------------------------------------------
    // Serialisation Helpers.
    //--------------------------------------------------------------------------
    Crux.toCamelCase = function (s) {
        // converts a pythonic snake_case to javaScripts camelCase.
        return s.replace(/(\_[a-z])/g, function(a){return a.toUpperCase().replace('_','');});
    };

    Crux.toSnakeCase = function (s) {
        return s.replace(/([A-Z])/g, function(a){return "_"+a.toLowerCase();});
    };

    Crux.snakeKeys = function (obj) {
        var key, oldKey;
        for (key in obj) {
            oldKey = key;
            key = Crux.toSnakeCase(key);
            if (key != oldKey) {
                obj[key] = obj[oldKey];
                delete obj[oldKey];
            }
            if (typeof(obj[key]) == "object"){
                Crux.snakeKeys(obj[key]);
            }
        }
    };


    Crux.camelKeys = function (obj) {
        // recursively scans an object, converting snake_case keys from python to
        // camelCase keys for javaScript.
        var key, oldKey;
        for (key in obj) {
            oldKey = key;
            key = Crux.toCamelCase(key);
            if (key != oldKey) {
                obj[key] = obj[oldKey];
                delete obj[oldKey];
            }
            if (typeof(obj[key]) == "object"){
                Crux.camelKeys(obj[key]);
            }
        }
    };

    Crux.decodeObjectAsArray = function (arrayOfArrays) {
        // accepts an array of arrays and turns it into and array of object
        // the first array is a list of property names, all subsequent arrays are
        // corresponding properties.
        // property names are also converted to camelCase.
        function arraysToObj(prop, values) {
            var i, obj = {};
            for (i = 0; i < prop.length; i+=1) {
                if (typeof prop[i] === "string") {
                    // in the case where the prop is a string, we add a property
                    // to the object with the cosponsoring value.
                    obj[Crux.toCamelCase(prop[i])] = values[i];
                }
                if (typeof prop[i] === "object") {
                    // if a property name is an array, it will have 2 values
                    // the first will be its property name in the object,
                    // the second will be a new array of sub properties.
                    // where ["prop name", ["sub", "object", "prop"]]
                    obj[prop[i][0]] = arraysToObj(prop[i][1], values[i]);
                }
            }
            return obj;
        }

        var i, ii, j, jj, obj;
        var arrayOfObjects = [];

        // the first element is a list of property names
        var props = arrayOfArrays.shift();
        for (i = 0, ii = arrayOfArrays.length; i < ii; i+=1) {
            if (arrayOfArrays[i].length != props.length){
                // if the number of values != the number of properties,
                // we don't try and make an object, we preserve the array
                arrayOfObjects.push(arrayOfArrays[i]);
            } else {
                // otherwise, each element in props becomes a property of obj
                // with a cosponsoring value in arrayOfArrays[i]
                obj = arraysToObj(props, arrayOfArrays[i]);
                arrayOfObjects.push(obj);
            }
        }
        return arrayOfObjects;

    };

    //--------------------------------------------------------------------------
    Crux.init = function (container) {
        Crux.crux = Crux.Widget("crux");
        jQuery(container).append(Crux.crux.ui);

        Crux.crux.onTouchDown = function () {
            Crux.touchEnabled = true;
        };

        Crux.crux.one('touchstart', Crux.crux.onTouchDown);
        document.crux = Crux.crux;
        Crux.mainLoop(0);
    };

})();

//--------------------------------------------------------------------------
// polyfill for requestAnimationFrame
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
//--------------------------------------------------------------------------
(function () {
    "use strict";
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    var x;
    for (x = 0; x < vendors.length && !window.requestAnimationFrame; x += 1) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
})();

//--------------------------------------------------------------------------
// polyfill for String.trim
//--------------------------------------------------------------------------
if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
  };
}
