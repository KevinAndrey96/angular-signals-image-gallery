import { TestBed } from '@angular/core/testing';

import { isTagId } from './photo';
import { PHOTO_CATALOG, PHOTOS } from './photos';

describe('PHOTOS', () => {
  it('uses unique Picsum ids', () => {
    expect(new Set(PHOTOS.map((photo) => photo.id)).size).toBe(PHOTOS.length);
  });

  it.each(PHOTOS.map((photo) => [photo.id, photo] as const))(
    'photo %i is complete and credits its author',
    (_id, photo) => {
      expect(photo.title.trim()).not.toBe('');
      expect(photo.description.trim()).not.toBe('');
      expect(photo.author.trim()).not.toBe('');
      expect(photo.sourceUrl).toMatch(/^https:\/\/unsplash\.com\/photos\/[\w-]+$/);
      expect(photo.width).toBeGreaterThan(0);
      expect(photo.height).toBeGreaterThan(0);
      expect(photo.tags.length).toBeGreaterThan(0);
      expect(photo.tags.every(isTagId)).toBe(true);
    },
  );

  it('is the default catalog', () => {
    expect(TestBed.inject(PHOTO_CATALOG)).toBe(PHOTOS);
  });
});

describe('isTagId', () => {
  it.each([
    ['water', true],
    ['Agua', false],
    ['toString', false],
    [undefined, false],
  ])('%j is a tag: %s', (value, expected) => {
    expect(isTagId(value)).toBe(expected);
  });
});
