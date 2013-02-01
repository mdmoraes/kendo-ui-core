kendo_module({
    id: "multiselect",
    name: "MultiSelect",
    category: "web",
    description: "The MultiSelect widget allows the selection from pre-defined values.",
    depends: [ "list" ]
});

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        List = ui.List,
        keys = kendo.keys,
        browser = kendo.support.browser,
        proxy = $.proxy,
        ID = "id",
        LI = "li",
        ACCEPT = "accept",
        FILTER = "filter",
        OPEN = "open",
        CLOSE = "close",
        CHANGE = "change",
        DATABOUND = "dataBound",
        PROGRESS = "progress",
        SELECT = "select",
        NEXT = "nextSibling",
        PREV = "previousSibling",
        HIDE = ' style="display:none"',
        FOCUSEDCLASS = "k-state-focused",
        DELETECLASSSELECTOR = ".k-delete",
        HOVERCLASS = "k-state-hover",
        DISABLEDCLASS = "k-state-disabled",
        DISABLEDATTR = "disabled",
        ns = ".kendoMultiSelect",
        CLICK = "click" + ns,
        MOUSEENTER = "mouseenter" + ns,
        MOUSELEAVE = "mouseleave" + ns,
        HOVEREVENTS = MOUSEENTER + " " + MOUSELEAVE,
        styles = ["font-family",
                  "font-size",
                  "font-stretch",
                  "font-style",
                  "font-weight",
                  "letter-spacing",
                  "text-transform",
                  "line-height"];

    var MultiSelect = List.extend({
        init: function(element, options) {
            var that = this;

            that.ns = ns;
            List.fn.init.call(that, element, options);

            that._wrapper();
            that._tagList();
            that._input();
            that._textContainer();
            that._loader();

            that.element.attr("multiple", "multiple").hide();

            options = that.options;
            if (!options.placeholder) {
                options.placeholder = that.element.data("placeholder");
            }

            that._focused = that.input
                                .on("keydown" + ns, proxy(that._keydown, that))
                                .on("paste" + ns, proxy(that._search, that))
                                .on("focus" + ns, function(e) { that._placeholder(false); })
                                .on("blur" + ns, function() {
                                    that._placeholder();
                                    that.close();

                                    if (that._state === FILTER) {
                                        that._state = ACCEPT;
                                    }
                                });

            that._dataSource();
            that._accessors();
            that._popup();

            that._dataItems = [];
            that._old = that._initialValues = options.value || that.element.val();

            that._reset();
            that._enable();
            that._placeholder();

            if (options.autoBind) {
                that.dataSource.fetch();
            }
        },

        options: {
            name: "MultiSelect",
            enable: true,
            autoBind: true,
            dataTextField: "",
            dataValueField: "",
            delay: 100,
            minLength: 0,
            filter: "startswith",
            ignoreCase: true,
            itemTemplate: "",
            tagTemplate: "",
            placeholder: "",
            height: 200,
            animation: {}
        },

        events: [
            OPEN,
            CLOSE,
            CHANGE,
            SELECT,
            DATABOUND
        ],

        current: function(candidate) {
            this.currentTag(null);
            return List.fn.current.call(this, candidate);

        },

        currentTag: function(candidate) {
            var that = this;

            if (candidate !== undefined) {
                if (that._currentTag) {
                    that._currentTag.removeClass(FOCUSEDCLASS);
                }

                if (candidate) {
                    candidate.addClass(FOCUSEDCLASS);
                }

                that._currentTag = candidate;
            } else {
                return that._currentTag;
            }
        },

        dataItems: function() {
            return this._dataItems;
        },

        destroy: function() {
            var that = this,
                ns = that.ns;

            that.wrapper.off(ns);
            that.tagList.off(ns);
            that.input.off(ns);

            List.fn.destroy.call(that);
        },

        enable: function(enable) {
            var that = this,
                wrapper = that.wrapper.off(ns),
                tagList = that.tagList.off(ns),
                input = that.input;

            if (enable === false) {
                input.attr(DISABLEDATTR, DISABLEDATTR);
                wrapper.addClass(DISABLEDCLASS);
            } else {
                input.removeAttr(DISABLEDATTR);

                wrapper
                    .removeClass(DISABLEDCLASS)
                    .on(HOVEREVENTS, that._toggleHover)
                    .on("mousedown" + ns, function(e) {
                        e.preventDefault();

                        if (e.target.className.indexOf(DELETECLASSSELECTOR) == -1) {
                            that.open();
                        }

                        if (that.input[0] !== document.activeElement) {
                            that.input.focus();
                        }
                    });

                tagList
                    .on(MOUSEENTER, LI, function() { $(this).addClass(HOVERCLASS); })
                    .on(MOUSELEAVE, LI, function() { $(this).removeClass(HOVERCLASS); })
                    .on(CLICK, DELETECLASSSELECTOR, function(e) {
                        that._unselect($(e.target).closest(LI));
                        that._change();
                        that.close();
                    });
            }
        },

        close: function() {
            this.popup.close();
            this.current(null);
        },

        open: function() {
            var that = this,
                popup = that.popup;

            if (!that.ul[0].firstChild || that._state === ACCEPT) {
                that._state = "";
                that._open = true;
                that._filterSource();
            } else if (!popup.visible() && that._visibleItems) {
                popup.open();
                that.current($(first(that.ul[0])));
            }
        },

        toggle: function(toggle) {
            this[toggle ? OPEN : CLOSE]();
        },

        refresh: function() {
            var that = this,
                length = that._render(that.dataSource.view());

            that._height(length);

            if (that._state !== FILTER && !that.element.val()) {
                that.value(that._initialValues);
            }

            if (that._open) {
                that._open = false;
                that.toggle(length);
            }

            that.current($(first(that.ul[0])));
            that._hideBusy();

            that.trigger(DATABOUND);
        },

        search: function(word) {
            var that = this,
                options = that.options,
                ignoreCase = options.ignoreCase,
                filter = options.filter,
                field = options.dataTextField;

            clearTimeout(that._typing);
            word = typeof word === "string" ? word : that.input.val();

            if (word.length >= options.minLength) {
                that._state = FILTER;
                that._open = true;

                that._filterSource({
                    value: ignoreCase ? word.toLowerCase() : word,
                    field: field,
                    operator: filter,
                    ignoreCase: ignoreCase
                });
            }
        },

        value: function(value) {
            var that = this,
                tags = $(that.tagList[0].children),
                length = tags.length,
                dataItemIndex,
                idx = 0;

            if (value === undefined) {
                return that.element.val();
            }

            for (; idx < length; idx++) {
                that._unselect(tags.eq(idx));
            }

            if (value !== null) {
                value = $.isArray(value) ? value : [value];

                for (idx = 0, length = value.length; idx < length; idx++) {
                    dataItemIndex = that._index(value[idx]);
                    if (dataItemIndex > -1) {
                        that._select(dataItemIndex);
                    }
                }

                that._old = that.element.val();
            }
        },

        _dataSource: function() {
            var that = this,
                element = that.element,
                options = that.options,
                dataSource = options.dataSource || {},
                idx;

            dataSource = $.isArray(dataSource) ? {data: dataSource} : dataSource;

            dataSource.select = element;
            dataSource.fields = [{ field: options.dataTextField },
                                 { field: options.dataValueField }];

            if (that.dataSource && that._refreshHandler) {
                that._unbindDataSource();
            } else {
                that._refreshHandler = proxy(that.refresh, that);
                that._progressHandler = proxy(that._showBusy, that);
            }

            that.dataSource = kendo.data.DataSource.create(dataSource)
                                   .bind(CHANGE, that._refreshHandler)
                                   .bind(PROGRESS, that._progressHandler);
        },

        _unbindDataSource: function() {
            var that = this;

            that.dataSource.unbind(CHANGE, that._refreshHandler)
                           .unbind(PROGRESS, that._progressHandler);
        },

        _reset: function() {
            var that = this,
                element = that.element,
                form = element.closest("form");

            if (form[0]) {
                that._resetHandler = function() {
                    setTimeout(function() {
                        that.value(that._initialValues);
                    });
                };

                that._form = form.on("reset", that._resetHandler);
            }
        },

        _filterSource: function(filter) {
            var that = this,
                options = that.options,
                dataSource = that.dataSource,
                expression = dataSource.filter() || {};

            removeFiltersForField(expression, options.dataTextField);

            if (filter) {
                expression = expression.filters || [];
                expression.push(filter);
            }

            dataSource.filter(expression);
        },

        _change: function() {
            var that = this,
                value = that.value();

            if (!compare(value, that._old)) {
                that._old = value;

                that.trigger(CHANGE);

                // trigger the DOM change event so any subscriber gets notified
                that.element.trigger(CHANGE);
            }
        },

        _click: function(e) {
            var that = this,
                li = $(e.currentTarget);

            if (!e.isDefaultPrevented()) {
                if (that.trigger(SELECT, {item: li})) {
                    that.close();
                    return;
                }

                that._select(li);
                that._change();
                that.close();
            }
        },

        _item: function(item, direction) {
            item = item[direction]();

            if (item[0] && !item.is(":visible")) {
               item = this._item(item, direction);
            }

            return item;
        },

        _keydown: function(e) {
            var that = this,
                ul = that.ul[0],
                key = e.keyCode,
                tag = that._currentTag,
                current = that._current,
                hasValue = that.input.val(),
                visible = that.popup.visible();

            if (key === keys.DOWN) {
                e.preventDefault();

                if (!visible) {
                    that.open();
                    return;
                }

                if (current) {
                    current = sibling(current[0], NEXT);
                    if (current) {
                        that.current($(current));
                    }
                }
            } else if (key === keys.UP) {
                if (visible && current) {
                    that.current($(sibling(current[0], PREV)));

                    if (!that._current[0]) {
                        that.close();
                    }
                }
                e.preventDefault();
            } else if (key === keys.LEFT) {
                if (!hasValue) {
                    tag = tag ? tag.prev() : $(that.tagList[0].lastChild);
                    if (tag[0]) {
                        that.currentTag(tag);
                    }
                }
            } else if (key === keys.RIGHT) {
                if (!hasValue && tag) {
                    tag = tag.next();
                    that.currentTag(tag[0] ? tag : null);
                }
            } else if (key === keys.ENTER) {
                if (visible) {
                    that._select(current);
                    that._change();
                    that.close();

                    e.preventDefault();
                }
            } else if (key === keys.ESC) {
                if (visible) {
                    e.preventDefault();
                } else {
                    that.currentTag(null);
                }

                that.close();
            } else if (key === keys.HOME) {
                if (visible) {
                    that.current($(first(that.ul[0])));
                } else if (!hasValue) {
                    tag = that.tagList[0].firstChild;

                    if (tag) {
                        that.currentTag($(tag));
                    }
                }
            } else if (key === keys.END) {
                if (visible) {
                    that.current($(last(that.ul[0])));
                } else if (!hasValue) {
                    tag = that.tagList[0].lastChild;

                    if (tag) {
                        that.currentTag($(tag));
                    }
                }
            } else if ((key === keys.DELETE || key === keys.BACKSPACE) && !hasValue) {
                if (key === keys.BACKSPACE && !tag) {
                    tag = $(that.tagList[0].lastChild);
                }

                if (tag && tag[0]) {
                    that._unselect(tag);
                    that._change();
                    that.close();
                }
            } else {
                that._search();
            }
        },

        _hideBusy: function () {
            var that = this;
            clearTimeout(that._busy);
            that._loading.hide();
            //that.input.attr("aria-busy", false);
            that._busy = null;
        },

        _showBusy: function () {
            var that = this;

            if (that._busy) {
                return;
            }

            that._busy = setTimeout(function () {
                //that.input.attr("aria-busy", true);
                that._loading.show();
            }, 100);
        },

        _placeholder: function(show) {
            var that = this,
                input = that.input;

            if (show === undefined) {
                show = false;
                if (input[0] !== document.activeElement) {
                    show = !that._dataItems[0];
                }
            }

            input.toggleClass("k-readonly", show)
                 .val(show ? that.options.placeholder : "");

            that._scale();
        },

        _scale: function() {
            var that = this,
                wrapperWidth = that.wrapper.width(),
                textWidth = that._span.text(that.input.val()).width() + 25;

            that.input.width(textWidth > wrapperWidth ? wrapperWidth : textWidth);
        },

        _option: function(dataItem, selected) {
            var option = "<option",
                dataText = this._text(dataItem);
                dataValue = this._value(dataItem);

            if (dataValue !== undefined) {
                dataValue += "";

                if (dataValue.indexOf('"') !== -1) {
                    dataValue = dataValue.replace(quotRegExp, "&quot;");
                }

                option += ' value="' + dataValue + '"';
            }

            if (selected) {
                option += ' selected="selected"';
            }

            option += ">";

            if (dataText !== undefined) {
                option += kendo.htmlEncode(dataText);
            }

            return option += "</option>";
        },

        _render: function(data) {
            var that = this,
                length = data.length,
                template = that.itemTemplate,
                values = that._dataItems.slice(0),
                visibleItems = 0, idx = 0,
                options = "", html = "",
                dataItem, selected;

            for (; idx < length; idx++) {
                dataItem = data[idx];
                selected = that._selected(values, dataItem);

                html += template(dataItem, idx, selected);
                options += that._option(dataItem, selected);

                if (!selected) {
                    visibleItems += 1;
                }
            }

            length = values.length
            if (length) {
                for (idx = 0; idx < length; idx++) {
                    options += that._option(values[idx], true);
                }
            }

            that.ul[0].innerHTML = html;
            that.element.html(options);
            that._visibleItems = visibleItems;

            return visibleItems;
        },

        _selected: function(values, dataItem) {
            var that = this,
                textAccessor = that._text,
                valueAccessor = that._value,
                value = valueAccessor(dataItem),
                length = values.length,
                selected = false,
                dataValue,
                idx = 0;

            if (value === undefined) {
                value = textAccessor(dataItem);
            }

            for (; idx < length; idx++) {
                dataItem = values[idx];
                dataValue = valueAccessor(dataItem);

                if (dataValue === undefined) {
                    dataValue = textAccessor(dataItem);
                }

                if (dataValue !== undefined && dataValue === value) {
                    selected = true;
                    break
                }
            }

            if (selected) {
                values.splice(idx, 1);
            }

            return selected;
        },

        _search: function() {
            var that = this;

            that._typing = setTimeout(function() {
                var value = that.input.val();
                if (that._prev !== value) {
                    that._scale();
                    that._prev = value;
                    that.search(value);
                }
            }, that.options.delay);
        },

        _select: function(li) {
            var that = this,
                dataItem,
                idx;

            if (!isNaN(li)) {
                idx = li;
                that.ul[0].children[idx].style.display = "none";
            } else {
                idx = li.hide().data("idx");
            }

            that.element[0].children[idx].selected = true;

            dataItem = that.dataSource.view()[idx];
            that.tagList.append(that.tagTemplate(dataItem));
            that._dataItems.push(dataItem);

            that._visibleItems -= 1;
            that.currentTag(null);
            that._placeholder();

            if (that._state === FILTER) {
                that._state = ACCEPT;
            }
        },

        _unselect: function(tag) {
            var that = this,
                index = tag.index(),
                dataItem, value, index,
                options, option, length;

            tag.remove();
            that.currentTag(null);
            dataItem = that._dataItems.splice(index, 1)[0];

            value = that._value(dataItem);
            if (value === undefined) { //TODO: test this
                value = that._text(dataItem);
            }

            index = that._index(value);

            if (index !== -1) {
               $(that.ul[0].children[index]).show();
               that.element[0].children[index].selected = false;
               that._visibleItems += 1;
            } else {
                index = that.dataSource.view().length;
                options = that.element[0].children;
                length = options.length;

                for (; index < length; index++) {
                    option = options[index];
                    if (option.value == value) {
                        option.selected = false;
                        break;
                    }
                }
            }

            that._placeholder();
        },



        _template: function() {
            var that = this,
                options = that.options,
                itemTemplate = options.itemTemplate,
                tagTemplate = options.tagTemplate,
                hasDataSource = options.dataSource,
                textTemplate;

            if (that.element[0].length && !hasDataSource) {
                options.dataTextField = options.dataTextField || "text";
                options.dataValueField = options.dataValueField || "value";
            }

            textTemplate = kendo.template("#:" + kendo.expr(options.dataTextField, "data") + "#", { useWithBlock: false });

            itemTemplate = itemTemplate ? kendo.template(itemTemplate) : textTemplate;
            tagTemplate = tagTemplate ? kendo.template(tagTemplate) : textTemplate;

            that.itemTemplate = function(data, idx, hide) {
                return '<li tabindex="-1" role="option" data-idx="' + idx + '" unselectable="on" class="k-item"' + (hide ? HIDE : "") + '>' + itemTemplate(data) + '</li>';
            }

            that.tagTemplate = function(data) {
                return '<li><span class="">' + tagTemplate(data) + '</span><span class="k-icon k-delete">delete</span></li>';
            }
        },


        _input: function() {
            this.input = $('<input class="k-input" style="width: 25px" />').appendTo(this._innerWrapper);
        },

        _tagList: function() {
            this.tagList = $('<ul unselectable="on" class="k-list k-reset"/>').appendTo(this._innerWrapper);
        },

        _loader: function() {
            this._loading = $('<span class="k-loading" style="display:none"></span>').insertAfter(this.input);
        },

        _textContainer: function() {
            var computedStyles = kendo.getComputedStyles(this.input[0], styles);

            computedStyles.position = "absolute";
            computedStyles.visibility = "hidden";

            this._span = $("<span/>").css(computedStyles).appendTo(this.wrapper);
        },

        _wrapper: function() {
            var that = this,
                element = that.element,
                wrapper = element.parent("span.k-multiselect");

            if (!wrapper[0]) {
                wrapper = element.wrap('<div class="k-widget k-multiselect k-header" />').parent();
                wrapper[0].style.cssText = element[0].style.cssText;

                $('<div class="k-multiselect-wrap floatWrap" />').insertBefore(element);
            }

            that.wrapper = wrapper.addClass(element[0].className).css("display", "");
            that._innerWrapper = $(wrapper[0].firstChild);
        }
    });

    function compare(a, b) {
        var length;

        if ((a === null && b !== null) || (a !== null && b === null)) {
            return false;
        }

        length = a.length;
        if (length !== b.length) {
            return false;
        }

        while (length--) {
            if (a[length] !== b[length]) {
                return false;
            }
        }

        return true;
    }

    function first(ul) {
        var item = ul.firstChild;

        if (item && item.style.display === "none") {
            item = sibling(item, NEXT);
        }

        return item;
    }

    function last(ul) {
        var item = ul.lastChild;

        if (item && item.style.display === "none") {
            item = sibling(item, PREV);
        }

        return item;
    }

    function sibling(item, direction) {
        item = item[direction];

        if (item && item.style.display === "none") {
            item = sibling(item, direction);
        }

        return item;
    }

    function removeFiltersForField(expression, field) {
        if (expression.filters) {
            expression.filters = $.grep(expression.filters, function(filter) {
                removeFiltersForField(filter, field);
                if (filter.filters) {
                    return filter.filters.length;
                } else {
                    return filter.field != field;
                }
            });
        }
    }

    ui.plugin(MultiSelect);

})(window.kendo.jQuery);
