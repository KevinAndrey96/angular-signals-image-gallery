import { ComponentFixture, TestBed } from '@angular/core/testing';

import { providePicsumImages } from '../picsum-image-loader';
import { PHOTOS } from '../photos';
import { Lightbox } from './lightbox';

describe('Lightbox', () => {
  let fixture: ComponentFixture<Lightbox>;
  let dialog: HTMLDialogElement;
  const events: string[] = [];

  const portrait = PHOTOS.find((photo) => photo.id === 57)!;

  const render = async (total = 16): Promise<void> => {
    fixture = TestBed.createComponent(Lightbox);
    fixture.componentRef.setInput('photo', portrait);
    fixture.componentRef.setInput('position', 3);
    fixture.componentRef.setInput('total', total);
    fixture.componentInstance.closed.subscribe(() => events.push('closed'));
    fixture.componentInstance.previous.subscribe(() => events.push('previous'));
    fixture.componentInstance.next.subscribe(() => events.push('next'));
    await fixture.whenStable();
    dialog = fixture.nativeElement.querySelector('dialog');
  };

  const press = (key: string): void => {
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  };

  beforeEach(() => {
    events.length = 0;
    TestBed.configureTestingModule({ providers: [providePicsumImages()] });
  });

  it('opens as a modal dialog labelled by the photo title', async () => {
    await render();

    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-labelledby')).toBe('lightbox-title');
    expect(dialog.querySelector('#lightbox-title')?.textContent).toContain(portrait.title);
    expect(dialog.querySelector('.counter')?.textContent?.trim()).toBe('3 de 16');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Cerrar');
  });

  it('requests the photo with its original aspect ratio', async () => {
    await render();
    const image = dialog.querySelector('img')!;

    expect(image.getAttribute('src')).toBe('https://picsum.photos/id/57/800/1067');
    expect(image.getAttribute('srcset')).toContain('https://picsum.photos/id/57/480/640 480w');
    expect(image.alt).toBe(portrait.description);
  });

  it('credits the author with a safe external link', async () => {
    await render();
    const link = dialog.querySelector<HTMLAnchorElement>('.credit a')!;

    expect(link.textContent?.trim()).toBe(portrait.author);
    expect(link.href).toBe(portrait.sourceUrl);
    expect(link.rel).toBe('noopener noreferrer');
  });

  it('navigates with the arrow keys and the pager buttons', async () => {
    await render();
    press('ArrowRight');
    press('ArrowLeft');
    press('Enter');
    dialog.querySelector<HTMLButtonElement>('[aria-label="Foto siguiente"]')!.click();
    dialog.querySelector<HTMLButtonElement>('[aria-label="Foto anterior"]')!.click();

    expect(events).toEqual(['next', 'previous', 'next', 'previous']);
  });

  it('hides the pager and ignores arrows when there is a single photo', async () => {
    await render(1);
    press('ArrowRight');

    expect(dialog.querySelector('.pager')).toBeNull();
    expect(events).toEqual([]);
  });

  it('lets the parent close it on Escape, close button or backdrop click', async () => {
    await render();
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    dialog.querySelector<HTMLButtonElement>('[aria-label="Cerrar"]')!.click();
    dialog.click();
    dialog.querySelector<HTMLElement>('figcaption')!.click();

    expect(cancel.defaultPrevented).toBe(true);
    expect(events).toEqual(['closed', 'closed', 'closed']);
  });

  it('swaps the image when the photo changes', async () => {
    await render();
    fixture.componentRef.setInput('photo', PHOTOS[0]);
    await fixture.whenStable();

    expect(dialog.querySelector('img')?.getAttribute('src')).toBe(
      'https://picsum.photos/id/10/800/533',
    );
    expect(dialog.querySelector('#lightbox-title')?.textContent).toContain(PHOTOS[0].title);
  });
});
