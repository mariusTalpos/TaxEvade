import { Routes } from '@angular/router';

export const classificationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/classification-page/classification-page.component').then(
        (m) => m.ClassificationPageComponent
      ),
  },
  {
    path: 'edit',
    loadComponent: () =>
      import('./containers/edit-classifications-page/edit-classifications-page.component').then(
        (m) => m.EditClassificationsPageComponent
      ),
  },
];
