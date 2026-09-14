import type { CapacitorConfig } from '@capacitor/cli';

// This app doesn't bundle its own frontend code — it wraps the real deployed
// www.recessforum.com and shows that instead. The site is server-rendered
// with API routes and middleware, so a static export isn't an option; this
// is the same approach used for Mentodari. Site updates go live in the app
// immediately, with no app re-submission needed.
const config: CapacitorConfig = {
  appId: 'com.recessforum.app',
  appName: 'Recess Forum',
  webDir: 'mobile/www',
  server: {
    url: 'https://www.recessforum.com',
    cleartext: false,
    allowNavigation: ['recessforum.com', 'www.recessforum.com', '*.recessforum.com'],
  },
  ios: {
    // The site wasn't built with the notch/Dynamic Island in mind, so let
    // the webview inset itself by the safe area instead of drawing under it.
    contentInset: 'automatic',
  },
};

export default config;
