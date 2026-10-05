# Marketing operations

## Contact submissions

The contact form is registered as the Netlify Form named `contact`. In Netlify, enable form detection and configure an email notification under **Project configuration → Notifications → Form submission notifications**. The form includes Netlify's honeypot field and records UTM attribution when it is present.

## Privacy-first analytics

The site sends a small, cookie-free set of events to `/api/events`. The endpoint stores only the event name, page path, referring hostname, coarse UTM campaign values, country/region and a short event detail. It does not persist IP addresses, precise location, user agents, form contents or visitor identifiers.

Set a strong `ANALYTICS_REPORT_TOKEN` environment variable in Netlify. Retrieve a 30-day aggregate with:

```sh
curl -H "Authorization: Bearer $ANALYTICS_REPORT_TOKEN" \
  "https://oneshotlens.com/api/analytics-report?days=30"
```

The protected operator dashboard is available at `https://oneshotlens.com/dashboard`. Enter the reporting token there; it is kept only in the current browser tab via `sessionStorage`.

## Search engines

After the deployment:

1. Add `https://oneshotlens.com` to Google Search Console and Bing Webmaster Tools.
2. Choose Google's HTML-file or meta-tag verification method and add the exact token supplied by Google. Never commit a guessed placeholder token.
3. Submit `https://oneshotlens.com/sitemap.xml`.
4. Inspect the homepage, `/ai`, `/career`, `/musings`, and the published article URL.
5. Validate JSON-LD with Google's Rich Results Test.

The sitemap and robots file are already published from the site root.
