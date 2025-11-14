module.exports = {
  ci: {
    collect: {
      // Test the production build locally
      staticDistDir: './dist/public',
      url: [
        'http://localhost:5000/',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        // Skip authentication for now - we'll test the login page
        skipAudits: ['is-on-https'], // Allow HTTP for local testing
      },
    },
    assert: {
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', { minScore: 0.90 }],
        // Accessibility - AAA compliance (upgraded from 'warn' to 'error' after AAA implementation)
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.90 }],
        'categories:seo': ['warn', { minScore: 0.90 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        
        // Bundle size budgets
        'total-byte-weight': ['warn', { maxNumericValue: 512000 }], // 500 KB
        'dom-size': ['warn', { maxNumericValue: 1500 }],
        
        // Resource hints
        'uses-rel-preconnect': 'off',
        'uses-rel-preload': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
