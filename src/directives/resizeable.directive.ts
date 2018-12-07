import {
  Directive, ElementRef, HostListener, Input, Output, EventEmitter, OnDestroy, AfterViewInit, Renderer2
} from '@angular/core';
import { Observable, Subscription, fromEvent } from 'rxjs';
import { MouseEvent } from '../events';
import { max, takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[resizeable]',
  host: {
    '[class.resizeable]': 'resizeEnabled'
  }
})
export class ResizeableDirective implements OnDestroy, AfterViewInit {
  @Input() resizeEnabled: boolean = true;
  @Input() minWidth: number;
  @Input() maxWidth: number;

  @Output() resize: EventEmitter<any> = new EventEmitter();

  element: HTMLElement;
  subscription: Subscription;
  resizing: boolean = false;
  clickedTimeout: any;
  doubleClickTimeout = 250;

  constructor(element: ElementRef, private renderer: Renderer2) {
    this.element = element.nativeElement;
  }

  ngAfterViewInit(): void {
    const renderer2 = this.renderer;
    const node = renderer2.createElement('span');
    if (this.resizeEnabled) {
      renderer2.addClass(node, 'resize-handle');
    } else {
      renderer2.addClass(node, 'resize-handle--not-resizable');
    }
    renderer2.appendChild(this.element, node);
  }

  ngOnDestroy(): void {
    this._destroySubscription();
  }

  onMouseup(): void {
    this.resizing = false;

    if (this.clickedTimeout) {
        this._destroySubscription();
        this.resize.emit(this.getSuggestedColumnWidth());
        this.clickedTimeout = null;
    } else {
        this.clickedTimeout = setTimeout(() => {
          clearTimeout(this.clickedTimeout);
          this.clickedTimeout = null;
        }, this.doubleClickTimeout);
        if (this.subscription && !this.subscription.closed) {
            this._destroySubscription();
            this.resize.emit(this.element.clientWidth);
        }
    }
  }

  @HostListener('mousedown', ['$event'])
  onMousedown(event: MouseEvent): void {
    const isHandle = (<HTMLElement>(event.target)).classList.contains('resize-handle');
    const initialWidth = this.element.clientWidth;
    const mouseDownScreenX = event.screenX;

    if (isHandle) {
      event.stopPropagation();
      this.resizing = true;

      const mouseup = fromEvent(document, 'mouseup');
      this.subscription = mouseup
        .subscribe((ev: MouseEvent) => this.onMouseup());

      const mouseMoveSub = fromEvent(document, 'mousemove')
        .pipe(takeUntil(mouseup))
        .subscribe((e: MouseEvent) => this.move(e, initialWidth, mouseDownScreenX));

      this.subscription.add(mouseMoveSub);
    }
  }

  move(event: MouseEvent, initialWidth: number, mouseDownScreenX: number): void {
    const movementX = event.screenX - mouseDownScreenX;
    const newWidth = initialWidth + movementX;

    const overMinWidth = !this.minWidth || newWidth >= this.minWidth;
    const underMaxWidth = !this.maxWidth || newWidth <= this.maxWidth;

    if (overMinWidth && underMaxWidth) {
      this.element.style.width = `${newWidth}px`;
    }
  }

  private _destroySubscription() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }

  private getSuggestedColumnWidth(): number {
      const columnIndex = Array.from(this.element.parentNode.children).indexOf(this.element);
      const tableHeader = this.element.parentNode.parentNode.parentNode;
      const tableClassList = Array.from((tableHeader.parentNode.parentNode as HTMLElement).classList);
      const rows = (tableHeader as HTMLElement).nextElementSibling.querySelectorAll('datatable-body-row');
      let maxWidth = 0;

      for (const row of Array.from(rows)) {
          const rowCenter = row.querySelector('.datatable-row-center');

          if (!rowCenter) {
            continue;
          }

          const cells = rowCenter.querySelectorAll('datatable-body-cell');
          const cell = cells[columnIndex];
          const element = cell.querySelector('.datatable-body-cell-label');
          let elementWidth = element.children.length ? element.children[0].scrollWidth : element.clientWidth;

          if (!elementWidth) {
              elementWidth = (element.children.length ? element.children[0] : element).getBoundingClientRect().width;
          }

          if (elementWidth > maxWidth) {
              maxWidth = elementWidth;
          }
      }
      return this.getPadding(tableClassList) * 2 + maxWidth + 1;
  }

  private getPadding(classList: string[]): number {
      if (classList.indexOf('compact') > -1) {
         return 2;
      } else if (classList.indexOf('dense') > -1) {
         return 10;
      } else {
         return 13;
      }
  }
}
