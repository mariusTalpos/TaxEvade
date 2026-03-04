import { Routes } from '@angular/router';

export const classificationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/classification-page/classification-page.component').then(
        (m) => m.ClassificationPageComponent
      ),
  },
];
