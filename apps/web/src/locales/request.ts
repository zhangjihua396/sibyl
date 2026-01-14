/**
 * Minimal next-intl configuration for Turbopack compatibility
 * This file is required by next-intl plugin but doesn't implement actual i18n features
 * See: https://www.buildwithmatija.com/blog/fix-nextintl-turbopack-error
 */

import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Provide a static locale - no actual internationalization
  return {
    locale: 'en',
    messages: {},
  };
});
