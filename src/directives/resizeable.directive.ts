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
  static doubleClickTimeout = 250;

  element: HTMLElement;
  subscription: Subscription;
  resizing: boolean = false;
  clickedTimeout;

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
      console.log('Double click');
      this.resize.emit(this.getSuggestedColumnWidth());
      this.clickedTimeout = null;
      return;
    } else {
        this.clickedTimeout = setTimeout(() => {
          clearTimeout(this.clickedTimeout);
          this.clickedTimeout = null;
        }, ResizeableDirective.doubleClickTimeout);
        console.log('Single click');
    }

    if (this.subscription && !this.subscription.closed) {
      this._destroySubscription();
      this.resize.emit(this.element.clientWidth);
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
      // Section index i. e. left/center/right
      // const sectionIndex = Array.from(this.element.parentNode.parentNode.children).indexOf(this.element.parentNode),
      const rows = this.element.parentNode.parentNode.parentNode.nextElementSibling.querySelectorAll("datatable-body-row");
      let maxWidth = 0;
      let parentPadding = 0;
      for (const row of rows) {
          const cells = row.querySelectorAll('datatable-body-cell');
          const cell = cells[columnIndex];
          const element = cell.querySelector('.datatable-body-cell-label');
          const elementWidth = element.textContent ? element.scrollWidth : element.children[0].scrollWidth;

          if (elementWidth > maxWidth) {
              maxWidth = elementWidth;
              parentPadding = cell.clientWidth - elementWidth;
          }
      }

      return maxWidth + parentPadding + 1;
  }
}
