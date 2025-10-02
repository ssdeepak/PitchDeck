/**
 * Theme Service
 * Manages dark/light theme switching across all components
 */
class ThemeService {
  constructor() {
    this.theme = this.getStoredTheme() || this.getSystemPreference();
    this.subscribers = new Set();
    this.applyTheme();
    this.setupSystemThemeListener();
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.theme;
  }

  /**
   * Set theme and notify subscribers
   */
  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('Invalid theme:', theme);
      return;
    }
    
    this.theme = theme;
    this.storeTheme(theme);
    this.applyTheme();
    this.notifySubscribers();
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Get system preference
   */
  getSystemPreference() {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Get stored theme from localStorage
   */
  getStoredTheme() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('neuro-notes-theme');
  }

  /**
   * Store theme in localStorage
   */
  storeTheme(theme) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('neuro-notes-theme', theme);
  }

  /**
   * Apply theme to document
   */
  applyTheme() {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', this.theme);
    document.documentElement.classList.toggle('dark-theme', this.theme === 'dark');
  }

  /**
   * Setup system theme change listener
   */
  setupSystemThemeListener() {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // Only update if no manual theme is stored
      if (!this.getStoredTheme()) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Notify all subscribers of theme change
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.theme);
      } catch (error) {
        console.error('Theme subscriber error:', error);
      }
    });
  }

  /**
   * Get theme-specific CSS custom properties
   */
  getThemeVariables() {
    const lightTheme = {
      // Base Colors
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8f9fa',
      '--bg-tertiary': '#e9ecef',
      '--bg-elevated': '#ffffff',
      '--bg-overlay': 'rgba(0, 0, 0, 0.5)',
      
      // Text Colors
      '--text-primary': '#212529',
      '--text-secondary': '#6c757d',
      '--text-tertiary': '#adb5bd',
      '--text-inverse': '#ffffff',
      
      // Border Colors
      '--border-primary': '#dee2e6',
      '--border-secondary': '#e9ecef',
      '--border-focus': '#667eea',
      
      // Brand Colors
      '--brand-primary': '#667eea',
      '--brand-secondary': '#764ba2',
      '--brand-accent': '#f093fb',
      '--brand-danger': '#dc3545',
      '--brand-success': '#28a745',
      '--brand-warning': '#ffc107',
      
      // Interactive States
      '--hover-bg': 'rgba(0, 0, 0, 0.05)',
      '--active-bg': 'rgba(0, 0, 0, 0.1)',
      '--focus-ring': 'rgba(102, 126, 234, 0.2)',
      
      // Shadows
      '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
      '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.15)',
      '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.15)',
      '--shadow-xl': '0 20px 40px rgba(0, 0, 0, 0.1)',
      
      // Specific Component Colors
      '--note-bg': '#ffffff',
      '--note-border': '#e0e0e0',
      '--drawer-bg': '#ffffff',
      '--header-bg': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '--fab-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '--fab-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      '--analysis-header': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '--chat-header': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '--streaming-bg': '#f8f9fa',
      '--message-user-bg': '#667eea',
      '--message-ai-bg': '#f5f5f5',
      '--message-system-bg': '#fff3cd',
      '--progress-bg': '#eee',
      '--progress-fill': 'linear-gradient(90deg, #667eea, #764ba2)'
    };

    const darkTheme = {
      // Base Colors
      '--bg-primary': '#1a1a1a',
      '--bg-secondary': '#2d2d2d',
      '--bg-tertiary': '#404040',
      '--bg-elevated': '#2d2d2d',
      '--bg-overlay': 'rgba(0, 0, 0, 0.7)',
      
      // Text Colors
      '--text-primary': '#f8f9fa',
      '--text-secondary': '#adb5bd',
      '--text-tertiary': '#6c757d',
      '--text-inverse': '#212529',
      
      // Border Colors
      '--border-primary': '#404040',
      '--border-secondary': '#2d2d2d',
      '--border-focus': '#667eea',
      
      // Brand Colors (maintain brand consistency)
      '--brand-primary': '#667eea',
      '--brand-secondary': '#764ba2',
      '--brand-accent': '#f093fb',
      '--brand-danger': '#dc3545',
      '--brand-success': '#28a745',
      '--brand-warning': '#ffc107',
      
      // Interactive States
      '--hover-bg': 'rgba(255, 255, 255, 0.1)',
      '--active-bg': 'rgba(255, 255, 255, 0.15)',
      '--focus-ring': 'rgba(102, 126, 234, 0.3)',
      
      // Shadows (enhanced for dark theme)
      '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.4)',
      '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.4)',
      '--shadow-xl': '0 20px 40px rgba(0, 0, 0, 0.3)',
      
      // Specific Component Colors
      '--note-bg': '#2d2d2d',
      '--note-border': '#404040',
      '--drawer-bg': '#2d2d2d',
      '--header-bg': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '--fab-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '--fab-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      '--analysis-header': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '--chat-header': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '--streaming-bg': '#1a1a1a',
      '--message-user-bg': '#667eea',
      '--message-ai-bg': '#404040',
      '--message-system-bg': '#3d3d00',
      '--progress-bg': '#404040',
      '--progress-fill': 'linear-gradient(90deg, #667eea, #764ba2)'
    };

    return this.theme === 'dark' ? darkTheme : lightTheme;
  }

  /**
   * Get CSS string with theme variables
   */
  getThemeCSS() {
    const variables = this.getThemeVariables();
    const cssVars = Object.entries(variables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n          ');
    
    return `
        :host {
          ${cssVars}
        }
        
         /* Global theme classes */
        .theme-transition {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
    `;
  }

  /**
   * Get theme-aware component styles
   */
  getComponentStyles() {
    return `
      /* Component base styles using CSS variables */
      .bg-primary { background: var(--bg-primary); }
      .bg-secondary { background: var(--bg-secondary); }
      .bg-tertiary { background: var(--bg-tertiary); }
      .bg-elevated { background: var(--bg-elevated); }
      
      .text-primary { color: var(--text-primary); }
      .text-secondary { color: var(--text-secondary); }
      .text-tertiary { color: var(--text-tertiary); }
      
      .border-primary { border-color: var(--border-primary); }
      .border-secondary { border-color: var(--border-secondary); }
      
      .shadow-sm { box-shadow: var(--shadow-sm); }
      .shadow-md { box-shadow: var(--shadow-md); }
      .shadow-lg { box-shadow: var(--shadow-lg); }
      .shadow-xl { box-shadow: var(--shadow-xl); }
      
      /* Interactive states */
      .hover-bg:hover { background: var(--hover-bg); }
      .active-bg:active { background: var(--active-bg); }
      
      /* Focus styles */
      .focus-ring:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--focus-ring);
      }
    `;
  }
}

// Export singleton instance
export const themeService = new ThemeService();