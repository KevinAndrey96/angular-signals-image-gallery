import { IMAGE_CONFIG, IMAGE_LOADER } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { IMAGE_BREAKPOINTS, picsumImageLoader, providePicsumImages } from './picsum-image-loader';

describe('picsumImageLoader', () => {
  it('requests a 3:2 thumbnail by default', () => {
    expect(picsumImageLoader({ src: '10', width: 600 })).toBe(
      'https://picsum.photos/id/10/600/400',
    );
  });

  it('falls back to a default width when the directive does not provide one', () => {
    expect(picsumImageLoader({ src: '10' })).toBe('https://picsum.photos/id/10/800/533');
  });

  it('keeps the original aspect ratio when asked', () => {
    expect(picsumImageLoader({ src: '57', width: 480, loaderParams: { ratio: 3264 / 2448 } })).toBe(
      'https://picsum.photos/id/57/480/640',
    );
  });

  it('encodes the source so it cannot alter the path', () => {
    expect(picsumImageLoader({ src: '../1', width: 320 })).toBe(
      'https://picsum.photos/id/..%2F1/320/213',
    );
  });
});

describe('providePicsumImages', () => {
  it('registers the loader and the responsive breakpoints', () => {
    TestBed.configureTestingModule({ providers: [providePicsumImages()] });

    expect(TestBed.inject(IMAGE_LOADER)).toBe(picsumImageLoader);
    expect(TestBed.inject(IMAGE_CONFIG).breakpoints).toEqual(IMAGE_BREAKPOINTS);
  });
});
