'use client';

import React, { useEffect } from 'react';
import { tracker, CookieConsentBanner } from '@acepharm/ui';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialise tracker with environment tokens if provided
    tracker.init({
      cloudflareWebAnalyticsToken: process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN,
      sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  }, []);

  const marketingUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_MARKETING_URL ||
    'https://acepharm-marketing.pages.dev';
  const privacyPolicyUrl = `${marketingUrl}/privacy`;

  return (
    <>
      {children}
      <CookieConsentBanner
        onConsentChange={(consent) => {
          tracker.updateConsent(consent);
        }}
        privacyPolicyUrl={privacyPolicyUrl}
      />
    </>
  );
}
