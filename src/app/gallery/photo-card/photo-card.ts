import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  input,
  output,
  viewChild,
} from '@angular/core';

import { Photo, tagLabel } from '../photo';

@Component({
  selector: 'app-photo-card',
  imports: [NgOptimizedImage],
  templateUrl: './photo-card.html',
  styleUrl: './photo-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoCard {
  readonly photo = input.required<Photo>();
  /** Preloads the image; reserve it for the cards above the fold. */
  readonly priority = input(false, { transform: booleanAttribute });
  readonly opened = output<Photo>();

  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('button');

  protected readonly tagLabel = tagLabel;

  focus(): void {
    this.button().nativeElement.focus();
  }
}
