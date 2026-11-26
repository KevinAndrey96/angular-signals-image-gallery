import { Photo, TagId, tagLabel } from './photo';

export interface GalleryFilter {
  readonly query: string;
  readonly tag: TagId | null;
}

/** Lowercases, strips diacritics and collapses whitespace so "Montaña" matches "montana". */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function searchTerms(query: string): readonly string[] {
  const normalized = normalizeText(query);

  return normalized === '' ? [] : normalized.split(' ');
}

export function matchesQuery(photo: Photo, terms: readonly string[]): boolean {
  if (terms.length === 0) {
    return true;
  }
  const haystack = normalizeText(
    [photo.title, photo.description, photo.author, ...photo.tags.map(tagLabel)].join(' '),
  );

  return terms.every((term) => haystack.includes(term));
}

export function filterPhotos(photos: readonly Photo[], filter: GalleryFilter): readonly Photo[] {
  const terms = searchTerms(filter.query);

  return photos.filter(
    (photo) =>
      (filter.tag === null || photo.tags.includes(filter.tag)) && matchesQuery(photo, terms),
  );
}

/** Counts photos per tag among the ones matching the query, so chips reflect the search. */
export function countByTag(photos: readonly Photo[], query: string): ReadonlyMap<TagId, number> {
  const counts = new Map<TagId, number>();
  for (const photo of filterPhotos(photos, { query, tag: null })) {
    for (const tag of photo.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return counts;
}

/** Moves `delta` positions inside a list of `length` items, wrapping around both ends. */
export function wrapIndex(index: number, delta: number, length: number): number {
  if (length <= 0) {
    return -1;
  }

  return (((index + delta) % length) + length) % length;
}
