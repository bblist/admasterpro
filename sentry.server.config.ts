// Sentry Server Configuration
// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only initialize if DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Capture unhandled promise rejections
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ["error"],
    }),
  ],

  // Filter out known non-issues
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],
});
