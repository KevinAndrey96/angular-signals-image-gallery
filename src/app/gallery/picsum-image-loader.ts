import { IMAGE_CONFIG, IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { Provider } from '@angular/core';

export const PICSUM_ORIGIN = 'https://picsum.photos';

/** Height to width ratio of the gallery thumbnails (3:2 landscape crop). */
export const THUMBNAIL_RATIO = 2 / 3;

export const DEFAULT_WIDTH = 800;

export const IMAGE_BREAKPOINTS: readonly number[] = [320, 480, 640, 800, 1080, 1280, 1600, 2048];

export interface PicsumLoaderParams {
  /** Height to width ratio of the requested rendition. */
  readonly ratio: number;
}

/**
 * Builds a Lorem Picsum URL for the photo id in `config.src`. Picsum crops to the exact
 * size, so the ratio decides whether the rendition is a thumbnail or the full frame.
 */
export function picsumImageLoader(config: ImageLoaderConfig): string {
  const width = config.width ?? DEFAULT_WIDTH;
  const ratio = Number(config.loaderParams?.['ratio'] ?? THUMBNAIL_RATIO);
  const height = Math.max(1, Math.round(width * ratio));

  return `${PICSUM_ORIGIN}/id/${encodeURIComponent(config.src)}/${width}/${height}`;
}

export function providePicsumImages(): Provider[] {
  return [
    { provide: IMAGE_LOADER, useValue: picsumImageLoader },
    { provide: IMAGE_CONFIG, useValue: { breakpoints: [...IMAGE_BREAKPOINTS] } },
  ];
}
