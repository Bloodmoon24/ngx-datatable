"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var rxjs_1 = require("rxjs");
var events_1 = require("../events");
var operators_1 = require("rxjs/operators");
var ResizeableDirective = /** @class */ (function () {
    function ResizeableDirective(element, renderer) {
        this.renderer = renderer;
        this.resizeEnabled = true;
        this.resize = new core_1.EventEmitter();
        this.resizing = false;
        this.doubleClickTimeout = 250;
        this.element = element.nativeElement;
    }
    ResizeableDirective.prototype.ngAfterViewInit = function () {
        var renderer2 = this.renderer;
        var node = renderer2.createElement('span');
        if (this.resizeEnabled) {
            renderer2.addClass(node, 'resize-handle');
        }
        else {
            renderer2.addClass(node, 'resize-handle--not-resizable');
        }
        renderer2.appendChild(this.element, node);
    };
    ResizeableDirective.prototype.ngOnDestroy = function () {
        this._destroySubscription();
    };
    ResizeableDirective.prototype.onMouseup = function () {
        var _this = this;
        this.resizing = false;
        if (this.clickedTimeout) {
            this._destroySubscription();
            this.resize.emit(this.getSuggestedColumnWidth());
            this.clickedTimeout = null;
        }
        else {
            this.clickedTimeout = setTimeout(function () {
                clearTimeout(_this.clickedTimeout);
                _this.clickedTimeout = null;
            }, this.doubleClickTimeout);
            if (this.subscription && !this.subscription.closed) {
                this._destroySubscription();
                this.resize.emit(this.element.clientWidth);
            }
        }
    };
    ResizeableDirective.prototype.onMousedown = function (event) {
        var _this = this;
        var isHandle = (event.target).classList.contains('resize-handle');
        var initialWidth = this.element.clientWidth;
        var mouseDownScreenX = event.screenX;
        if (isHandle) {
            event.stopPropagation();
            this.resizing = true;
            var mouseup = rxjs_1.fromEvent(document, 'mouseup');
            this.subscription = mouseup
                .subscribe(function (ev) { return _this.onMouseup(); });
            var mouseMoveSub = rxjs_1.fromEvent(document, 'mousemove')
                .pipe(operators_1.takeUntil(mouseup))
                .subscribe(function (e) { return _this.move(e, initialWidth, mouseDownScreenX); });
            this.subscription.add(mouseMoveSub);
        }
    };
    ResizeableDirective.prototype.move = function (event, initialWidth, mouseDownScreenX) {
        var movementX = event.screenX - mouseDownScreenX;
        var newWidth = initialWidth + movementX;
        var overMinWidth = !this.minWidth || newWidth >= this.minWidth;
        var underMaxWidth = !this.maxWidth || newWidth <= this.maxWidth;
        if (overMinWidth && underMaxWidth) {
            this.element.style.width = newWidth + "px";
        }
    };
    ResizeableDirective.prototype._destroySubscription = function () {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }
    };
    ResizeableDirective.prototype.getSuggestedColumnWidth = function () {
        var columnIndex = Array.from(this.element.parentNode.children).indexOf(this.element);
        var tableHeader = this.element.parentNode.parentNode.parentNode;
        var tableClassList = Array.from(tableHeader.parentNode.parentNode.classList);
        var rows = tableHeader.nextElementSibling.querySelectorAll('datatable-body-row');
        var maxWidth = 0;
        for (var _i = 0, _a = Array.from(rows); _i < _a.length; _i++) {
            var row = _a[_i];
            var rowCenter = row.querySelector('.datatable-row-center');
            if (!rowCenter) {
                continue;
            }
            var cells = rowCenter.querySelectorAll('datatable-body-cell');
            var cell = cells[columnIndex];
            var element = cell.querySelector('.datatable-body-cell-label');
            var elementWidth = element.children.length ? element.children[0].scrollWidth : element.clientWidth;
            if (!elementWidth) {
                elementWidth = (element.children.length ? element.children[0] : element).getBoundingClientRect().width;
            }
            if (elementWidth > maxWidth) {
                maxWidth = elementWidth;
            }
        }
        return this.getPadding(tableClassList) * 2 + maxWidth + 1;
    };
    ResizeableDirective.prototype.getPadding = function (classList) {
        if (classList.indexOf('compact') > -1) {
            return 2;
        }
        else if (classList.indexOf('dense') > -1) {
            return 10;
        }
        else {
            return 13;
        }
    };
    __decorate([
        core_1.Input(),
        __metadata("design:type", Boolean)
    ], ResizeableDirective.prototype, "resizeEnabled", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Number)
    ], ResizeableDirective.prototype, "minWidth", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Number)
    ], ResizeableDirective.prototype, "maxWidth", void 0);
    __decorate([
        core_1.Output(),
        __metadata("design:type", core_1.EventEmitter)
    ], ResizeableDirective.prototype, "resize", void 0);
    __decorate([
        core_1.HostListener('mousedown', ['$event']),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], ResizeableDirective.prototype, "onMousedown", null);
    ResizeableDirective = __decorate([
        core_1.Directive({
            selector: '[resizeable]',
            host: {
                '[class.resizeable]': 'resizeEnabled'
            }
        }),
        __metadata("design:paramtypes", [core_1.ElementRef, core_1.Renderer2])
    ], ResizeableDirective);
    return ResizeableDirective;
}());
exports.ResizeableDirective = ResizeableDirective;
//# sourceMappingURL=resizeable.directive.js.map