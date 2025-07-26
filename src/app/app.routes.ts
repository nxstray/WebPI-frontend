// Import definisi tipe routing dari Angular Router
import { Routes } from '@angular/router';

// Import komponen-komponen utama dari halaman aplikasi
import { HomeComponent } from './pages/home/home.component';
import { BivariateComponent } from './pages/bivariate/bivariate.component';
import { AnovaComponent } from './pages/anova/anova.component';
import { BivariateResultComponent } from './pages/bivariate-result/bivariate-result.component';
import { AnovaResultComponent } from './pages/anova-result/anova-result.component';

// Daftar rute utama aplikasi
export const routes: Routes = [
  {
    // Rute default (halaman awal)
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => HomeComponent)
  },
  {
    // Rute untuk input data korelasi bivariate
    path: 'bivariate',
    loadComponent: () => import('./pages/bivariate/bivariate.component').then(m => BivariateComponent)
  },
  {
    // Rute untuk menampilkan hasil analisis korelasi bivariate
    path: 'result-bivariate',
    loadComponent: () => import('./pages/bivariate-result/bivariate-result.component').then(m => BivariateResultComponent)
  },
  {
    // Rute untuk input data ANOVA
    path: 'anova',
    loadComponent: () => import('./pages/anova/anova.component').then(m => AnovaComponent)
  },
  {
    // Rute untuk menampilkan hasil analisis ANOVA
    path: 'result-anova',
    loadComponent: () => import('./pages/anova-result/anova-result.component').then(m => AnovaResultComponent)
  }
];