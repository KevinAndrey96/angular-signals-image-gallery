export const TAG_LABELS = {
  nature: 'Naturaleza',
  water: 'Agua',
  mountain: 'Montaña',
  city: 'Ciudad',
  architecture: 'Arquitectura',
} as const;

export type TagId = keyof typeof TAG_LABELS;

export const TAG_IDS = Object.keys(TAG_LABELS) as readonly TagId[];

export interface Photo {
  /** Lorem Picsum identifier, also used as the `ngSrc` of every rendition. */
  readonly id: number;
  readonly title: string;
  /** Alternative text describing the image content. */
  readonly description: string;
  readonly tags: readonly TagId[];
  readonly author: string;
  readonly sourceUrl: string;
  /** Original width in pixels, used to keep the aspect ratio in the lightbox. */
  readonly width: number;
  readonly height: number;
}

export function isTagId(value: unknown): value is TagId {
  return typeof value === 'string' && Object.hasOwn(TAG_LABELS, value);
}

export function tagLabel(tag: TagId): string {
  return TAG_LABELS[tag];
}
