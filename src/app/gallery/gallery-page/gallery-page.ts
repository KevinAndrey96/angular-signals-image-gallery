import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  afterRenderEffect,
  computed,
  inject,
  input,
  viewChildren,
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { countByTag, filterPhotos, wrapIndex } from '../gallery-filter';
import { Lightbox } from '../lightbox/lightbox';
import { Photo, TAG_IDS, TagId, isTagId, tagLabel } from '../photo';
import { PhotoCard } from '../photo-card/photo-card';
import { PHOTO_CATALOG } from '../photos';

const PRIORITY_IMAGES = 3;

interface TagOption {
  readonly id: TagId;
  readonly label: string;
  readonly count: number;
}

/**
 * The URL query string (`q`, `tag`, `photo`) is the single source of truth: inputs come from
 * the router and every interaction is a navigation, so any state can be shared as a link.
 */
@Component({
  selector: 'app-gallery-page',
  imports: [PhotoCard, Lightbox],
  templateUrl: './gallery-page.html',
  styleUrl: './gallery-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryPage {
  readonly q = input<string>();
  readonly tag = input<string>();
  readonly photo = input<string>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly catalog = inject(PHOTO_CATALOG);
  private readonly cards = viewChildren(PhotoCard);

  private readonly priorityIds = new Set(this.catalog.slice(0, PRIORITY_IMAGES).map((p) => p.id));
  private openedInApp = false;
  private lastSelectedId: number | null = null;

  protected readonly query = computed(() => this.q() ?? '');
  protected readonly activeTag = computed<TagId | null>(() => {
    const tag = this.tag();

    return isTagId(tag) ? tag : null;
  });
  protected readonly hasFilters = computed(() => this.query() !== '' || this.activeTag() !== null);

  protected readonly visible = computed(() =>
    filterPhotos(this.catalog, { query: this.query(), tag: this.activeTag() }),
  );

  protected readonly tags = computed<readonly TagOption[]>(() => {
    const counts = countByTag(this.catalog, this.query());

    return TAG_IDS.map((id) => ({ id, label: tagLabel(id), count: counts.get(id) ?? 0 }));
  });

  protected readonly selectedIndex = computed(() => {
    const id = Number(this.photo());

    return this.visible().findIndex((photo) => photo.id === id);
  });
  protected readonly selected = computed<Photo | null>(
    () => this.visible()[this.selectedIndex()] ?? null,
  );

  protected readonly summary = computed(() => {
    const shown = this.visible().length;
    if (shown === 0) {
      return 'Ninguna foto coincide con los filtros.';
    }
    const noun = shown === 1 ? 'foto' : 'fotos';

    return this.hasFilters() ? `${shown} de ${this.catalog.length} ${noun}` : `${shown} ${noun}`;
  });

  constructor() {
    afterRenderEffect(() => {
      const selected = this.selected();
      if (selected !== null) {
        this.lastSelectedId = selected.id;

        return;
      }
      const returnTo = this.lastSelectedId;
      this.lastSelectedId = null;
      this.openedInApp = false;
      this.cards()
        .find((card) => card.photo().id === returnTo)
        ?.focus();
    });
  }

  protected isPriority(photo: Photo): boolean {
    return this.priorityIds.has(photo.id);
  }

  protected onSearch(value: string): void {
    void this.navigate({ q: value.trim() === '' ? null : value }, true);
  }

  protected selectTag(tag: TagId | null): void {
    void this.navigate({ tag: tag === this.activeTag() ? null : tag }, false);
  }

  protected clearFilters(): void {
    void this.navigate({ q: null, tag: null }, false);
  }

  protected open(photo: Photo): void {
    this.openedInApp = true;
    void this.navigate({ photo: photo.id }, false);
  }

  protected step(delta: number): void {
    const target = this.visible()[wrapIndex(this.selectedIndex(), delta, this.visible().length)];
    if (target !== undefined) {
      void this.navigate({ photo: target.id }, true);
    }
  }

  /** Going back when the lightbox was opened here keeps the history free of duplicates. */
  protected close(): void {
    if (this.openedInApp) {
      this.openedInApp = false;
      this.location.back();

      return;
    }
    void this.navigate({ photo: null }, true);
  }

  private navigate(queryParams: Params, replaceUrl: boolean): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
