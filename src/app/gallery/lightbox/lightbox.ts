import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';

import { Photo } from '../photo';
import { PicsumLoaderParams } from '../picsum-image-loader';

interface Frame {
  readonly photo: Photo;
  readonly loaderParams: PicsumLoaderParams;
}

@Component({
  selector: 'app-lightbox',
  imports: [NgOptimizedImage],
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lightbox {
  readonly photo = input.required<Photo>();
  /** One-based position of the photo inside the visible list. */
  readonly position = input.required<number>();
  readonly total = input.required<number>();

  readonly closed = output();
  readonly previous = output();
  readonly next = output();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /**
   * NgOptimizedImage forbids changing width, height or loaderParams after init, so each photo
   * gets its own frame and the image is recreated when the photo changes.
   */
  protected readonly frames = computed<readonly Frame[]>(() => {
    const photo = this.photo();

    return [{ photo, loaderParams: { ratio: photo.height / photo.width } }];
  });

  protected readonly hasSiblings = computed(() => this.total() > 1);

  constructor() {
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      if (!dialog.open) {
        dialog.showModal();
      }
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.hasSiblings()) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous.emit();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next.emit();
    }
  }

  /** Escape fires `cancel`; the parent owns the state, so it decides how to close. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    this.closed.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.closed.emit();
    }
  }
}
