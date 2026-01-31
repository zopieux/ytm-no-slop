import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  imports: { eslintrc: { enabled: 9 } },
  manifest: {
    name: 'YTM No Slop',
    description: 'Block AI slop artists, songs or keywords on YouTube Music.',
    icons: {
      '16': '/icon-light-16.png',
      '32': '/icon-light-32.png',
      '48': '/icon-light-48.png',
      '96': '/icon-light-96.png',
      '128': '/icon-light-128.png',
    },
    browser_action: {
      // @ts-expect-error TS2353: https://github.com/wxt-dev/wxt/issues/1120
      theme_icons: [
        { light: '/icon-light-16.png', dark: '/icon-dark-16.png', size: 16 },
        { light: '/icon-light-32.png', dark: '/icon-dark-32.png', size: 32 },
        { light: '/icon-light-48.png', dark: '/icon-dark-48.png', size: 48 },
        { light: '/icon-light-96.png', dark: '/icon-dark-96.png', size: 96 },
        { light: '/icon-light-128.png', dark: '/icon-dark-128.png', size: 128 },
      ],
    },
    permissions: ['storage', 'alarms'],
    host_permissions: [
      'https://music.youtube.com/*',
      'https://raw.githubusercontent.com/xoundbyte/soul-over-ai/*',
    ],
    browser_specific_settings: {
      gecko: {
        id: 'ytm-no-slop@zopi.eu',
        // @ts-expect-error TS2353: https://github.com/wxt-dev/wxt/issues/1975
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  },
  webExt: {
    startUrls: ['https://music.youtube.com'],
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-profile'],
    firefoxArgs: ['-profile', './.wxt/firefox-profile'],
  },
  zip: {
    excludeSources: ['**'],
    includeSources: [
      'entrypoints/**',
      'public/**',
      'scripts/**',
      'utils/**',
      '.gitignore',
      '.prettierrc',
      'eslint.config.js',
      'firefox-amo-metadata.json',
      'LICENSE',
      'package.json',
      'README.md',
      'tsconfig.json',
      'wxt.config.ts',
      'yarn.lock',
    ],
  },
});
