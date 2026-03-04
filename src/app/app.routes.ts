import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'ledger',
    loadComponent: () =>
      import('./features/ledger/containers/ledger-page/ledger-page.component').then(
        (m) => m.LedgerPageComponent
      ),
  },
  {
    path: 'classification',
    loadChildren: () =>
      import('./features/classification/classification.routes').then((m) => m.classificationRoutes),
  },
  { path: '', redirectTo: 'ledger', pathMatch: 'full' },
];
