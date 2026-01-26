import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  imports: { eslintrc: { enabled: 9 } },
  manifest: {
    name: 'YTM No Slop',
    description: 'Block AI slop artists, songs or keywords on YouTube Music.',
    icons: {
      '16': '/icon-16.png',
      '32': '/icon-32.png',
      '48': '/icon-48.png',
      '96': '/icon-96.png',
      '128': '/icon-128.png',
    },
    permissions: ['storage', 'alarms'],
    host_permissions: ['https://music.youtube.com/*', 'https://raw.githubusercontent.com/*'],
    browser_specific_settings: {
      gecko: {
        id: 'ytm-no-slop@zopieux.com',
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
});
