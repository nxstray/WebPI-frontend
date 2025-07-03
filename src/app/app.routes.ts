import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { BivariateComponent } from './pages/bivariate/bivariate.component';
import { AnovaComponent } from './pages/anova/anova.component';
import { BivariateResultComponent } from './pages/bivariate-result/bivariate-result.component';
import { AnovaResultComponent } from './pages/anova-result/anova-result.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent:() => import ('./pages/home/home.component').then(m =>HomeComponent)
  },
  {
    path: 'bivariate',
    loadComponent:() => import ('./pages/bivariate/bivariate.component').then(m =>BivariateComponent)
  },
  {
    path: 'anova',
    loadComponent:() => import ('./pages/anova/anova.component').then(m =>AnovaComponent)
  },
  {
    path: 'result-bivariate',
    loadComponent: () => import('./pages/bivariate-result/bivariate-result.component').then(m => BivariateResultComponent)
  },
  {
    path: 'result-anova',
    loadComponent: () => import('./pages/anova-result/anova-result.component').then(m => AnovaResultComponent)
  }
];