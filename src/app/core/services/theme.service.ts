import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  
  // Theme state
  darkMode = signal<boolean>(this.loadTheme());

  // Computed properties
  currentTheme = computed(() => this.darkMode() ? 'infinity-dark' : 'infinity-light');
  
  logoUrl = computed(() => 
    this.darkMode() ? '/logo/logo-white.svg' : '/logo/logo-red.svg'
  );

  constructor() {
    // Persist theme changes
    effect(() => {
      localStorage.setItem(this.THEME_KEY, this.darkMode() ? 'dark' : 'light');
    });
  }

  toggleDarkMode() {
    this.darkMode.update(v => !v);
  }

  private loadTheme(): boolean {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved) return saved === 'dark';
    
    // Check system preference if no saved theme
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
