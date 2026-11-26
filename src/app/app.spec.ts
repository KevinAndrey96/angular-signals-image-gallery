import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';
import { providePicsumImages } from './gallery/picsum-image-loader';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideLocationMocks(),
        providePicsumImages(),
      ],
    });
  });

  it('renders the shell with a skip link, heading and attribution', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.skip-link')?.getAttribute('href')).toBe('#contenido');
    expect(element.querySelector('h1')?.textContent).toBe('Galería de fotos');
    expect(element.querySelector('main#contenido')).not.toBeNull();
    expect(element.querySelector('.footer')?.textContent).toContain('Lorem Picsum');
    expect(element.querySelector('.footer')?.textContent).toContain('Kevin Andrey Herrera Silva');
  });
});
