import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 120_000,
  // Two browsers at a time keeps the developer's PC usable; the 11MB strains page is heavy on WebKit.
  workers: 2,
  reporter: [['list']],
  use: {
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 14'] } },
    { name: 'iphone-landscape', use: { ...devices['iPhone 14 landscape'] } },
    { name: 'pixel', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
});
