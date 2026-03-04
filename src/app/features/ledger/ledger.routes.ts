import { Routes } from '@angular/router';

export const ledgerRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/ledger-page/ledger-page.component').then((m) => m.LedgerPageComponent),
  },
];
