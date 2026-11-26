import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { providePicsumImages } from '../picsum-image-loader';
import { GalleryPage } from './gallery-page';

describe('GalleryPage', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  const page = (): HTMLElement => harness.routeNativeElement!;
  const cardTitles = (): string[] =>
    [...page().querySelectorAll('app-photo-card .title')].map((el) => el.textContent!.trim());
  const summary = (): string => page().querySelector('.summary')!.textContent!.trim();
  const chip = (label: string): HTMLButtonElement =>
    [...page().querySelectorAll<HTMLButtonElement>('.chip')].find((el) =>
      el.textContent!.trim().startsWith(label),
    )!;
  const dialog = (): HTMLDialogElement | null => page().querySelector('dialog');
  const queryParams = (): Record<string, string> =>
    router.parseUrl(router.url).queryParams as Record<string, string>;
  const settle = async (): Promise<void> => {
    await harness.fixture.whenStable();
  };

  /** The router reacts to history changes on the next macrotask. */
  const popState = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve));
    await settle();
  };

  const visit = async (url: string): Promise<void> => {
    await harness.navigateByUrl(url, GalleryPage);
    await settle();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideLocationMocks(),
        providePicsumImages(),
      ],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    // Bootstrapping does this in the browser; it subscribes the router to history changes.
    router.initialNavigation();
  });

  it('shows the whole catalog with every tag available', async () => {
    await visit('/');

    expect(cardTitles()).toHaveLength(16);
    expect(summary()).toBe('16 fotos');
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('true');
    expect(chip('Agua').textContent).toContain('5');
  });

  it('preloads only the first images of the catalog', async () => {
    await visit('/');
    const images = [...page().querySelectorAll('app-photo-card img')];

    expect(images.slice(0, 3).every((img) => img.getAttribute('fetchpriority') === 'high')).toBe(
      true,
    );
    expect(images.slice(3).every((img) => img.getAttribute('loading') === 'lazy')).toBe(true);
  });

  it('searches without caring about accents or case and keeps the query in the URL', async () => {
    await visit('/');
    const input = page().querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = 'PUENTE';
    input.dispatchEvent(new Event('input'));
    await settle();

    expect(queryParams()).toEqual({ q: 'PUENTE' });
    expect(cardTitles()).toEqual(['Puente de Brooklyn de noche', 'Puente colgante en la noche']);
    expect(summary()).toBe('2 de 16 fotos');

    await visit('/?q=montana');

    expect(cardTitles()).toEqual([
      'Bosque de coníferas frente a la bahía',
      'Valle con niebla',
      'Cordillera nevada',
    ]);
  });

  it('removes the query parameter when the search box is cleared', async () => {
    await visit('/?q=faro');
    const input = page().querySelector<HTMLInputElement>('input[type="search"]')!;

    expect(input.value).toBe('faro');

    input.value = '  ';
    input.dispatchEvent(new Event('input'));
    await settle();

    expect(queryParams()).toEqual({});
    expect(cardTitles()).toHaveLength(16);
  });

  it('toggles a tag filter from its chip', async () => {
    await visit('/');
    chip('Montaña').click();
    await settle();

    expect(queryParams()).toEqual({ tag: 'mountain' });
    expect(chip('Montaña').getAttribute('aria-pressed')).toBe('true');
    expect(cardTitles()).toEqual(['Valle con niebla', 'Cordillera nevada']);

    chip('Montaña').click();
    await settle();

    expect(queryParams()).toEqual({});
    expect(cardTitles()).toHaveLength(16);
  });

  it('updates chip counts with the search and disables empty tags', async () => {
    await visit('/?q=puente');

    expect(chip('Ciudad').textContent).toContain('2');
    expect(chip('Agua').disabled).toBe(true);
  });

  it('ignores unknown tags in the URL', async () => {
    await visit('/?tag=desierto');

    expect(cardTitles()).toHaveLength(16);
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('true');
  });

  it('offers to clear the filters when nothing matches', async () => {
    await visit('/?q=desierto&tag=water');

    expect(cardTitles()).toEqual([]);
    expect(summary()).toBe('Ninguna foto coincide con los filtros.');

    [...page().querySelectorAll<HTMLButtonElement>('.empty button')][0].click();
    await settle();

    expect(queryParams()).toEqual({});
    expect(cardTitles()).toHaveLength(16);
  });

  it('opens the lightbox from a card and browses the filtered list with wrap around', async () => {
    await visit('/?tag=mountain');
    page().querySelector<HTMLButtonElement>('app-photo-card button')!.click();
    await settle();

    expect(queryParams()).toEqual({ tag: 'mountain', photo: '11' });
    expect(dialog()?.open).toBe(true);
    expect(dialog()?.querySelector('.counter')?.textContent?.trim()).toBe('1 de 2');

    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await settle();

    expect(queryParams()['photo']).toBe('29');

    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await settle();

    expect(queryParams()['photo']).toBe('11');

    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await settle();

    expect(queryParams()['photo']).toBe('29');
  });

  it('goes back in history when closing a lightbox opened from the grid', async () => {
    await visit('/?q=faro');
    page().querySelector<HTMLButtonElement>('app-photo-card button')!.click();
    await settle();

    expect(queryParams()).toEqual({ q: 'faro', photo: '58' });

    dialog()!.dispatchEvent(new Event('cancel', { cancelable: true }));
    await popState();

    expect(queryParams()).toEqual({ q: 'faro' });
    expect(dialog()).toBeNull();
    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'Ampliar Faro en blanco y negro',
    );
  });

  it('opens a shared link directly and closes it by removing the photo parameter', async () => {
    await visit('/?photo=57');

    expect(dialog()?.open).toBe(true);
    expect(dialog()?.querySelector('#lightbox-title')?.textContent).toContain(
      'Calle adoquinada en la ciudad',
    );

    dialog()!.querySelector<HTMLButtonElement>('[aria-label="Cerrar"]')!.click();
    await settle();

    expect(queryParams()).toEqual({});
    expect(dialog()).toBeNull();
  });

  it('does not open photos that are unknown or hidden by the filters', async () => {
    await visit('/?photo=9999');

    expect(dialog()).toBeNull();

    await visit('/?photo=57&tag=water');

    expect(dialog()).toBeNull();
  });
});
