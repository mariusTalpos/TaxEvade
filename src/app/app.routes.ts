import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'ledger',
    loadComponent: () =>
      import('./features/ledger/containers/ledger-page/ledger-page.component').then(
        (m) => m.LedgerPageComponent
      ),
  },
  { path: '', redirectTo: 'ledger', pathMatch: 'full' },
];
