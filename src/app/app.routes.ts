import { Routes } from '@angular/router';

import { GalleryPage } from './gallery/gallery-page/gallery-page';

export const routes: Routes = [
  { path: '', component: GalleryPage, title: 'Galería de fotos con Angular Signals' },
  { path: '**', redirectTo: '' },
];
