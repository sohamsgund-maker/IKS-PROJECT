/**
 * CineVault Anti-Ad & Popup Shield
 * Blocks popup ads, pop-unders, click-hijacking, tracking beacons, and unauthorized redirects.
 */

const KNOWN_AD_DOMAINS = [
  'popads',
  'adcash',
  'onclickads',
  'exoclick',
  'propellerads',
  'adsterra',
  'bet365',
  '1xbet',
  'doubleclick',
  'googlesyndication',
  'adnxs',
  'trafficjunky',
  'juicyads',
  'yadro',
  'adkeeper',
  'hilltopads',
  'evadav',
  'monetag',
  'clickadu',
  'richpush',
  'adservice',
  'adserver',
  'popcash',
  'adflex',
  'adx',
  'syndication',
  'histats',
  'clicksor',
];

export const initAdShield = (): void => {
  if (typeof window === 'undefined') return;

  // 1. INTERCEPT & NEUTRALIZE window.open (Popups & Pop-unders)
  try {
    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string): WindowProxy | null {
      const urlString = String(url || '').toLowerCase();

      // Check if URL is an ad domain or an external popup attempt
      const isAdUrl = KNOWN_AD_DOMAINS.some((pattern) => urlString.includes(pattern));
      const isExternalPopup = Boolean(
        urlString.startsWith('http') && !urlString.includes(window.location.hostname)
      );

      // In CineVault, legitimate user actions do not spawn external popup windows
      if (isAdUrl || isExternalPopup) {
        console.warn('[AdShield] Blocked popup window to:', urlString);
        return {
          closed: true,
          focus: () => {},
          blur: () => {},
          close: () => {},
          location: { href: '' },
        } as unknown as WindowProxy;
      }

      return originalOpen.call(window, url, target, features);
    };
  } catch {
    // Non-fatal if browser restricts window.open override
  }

  // 2. INTERCEPT CLICK-JACKING & TRANSPARENT AD OVERLAYS (Capturing Phase)
  try {
    window.addEventListener(
      'click',
      (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        // Check if an anchor tag with target="_blank" leads to an ad domain
        const anchor = target.closest('a') as HTMLAnchorElement | null;
        if (anchor && anchor.href) {
          const hrefLower = anchor.href.toLowerCase();
          const isAd = KNOWN_AD_DOMAINS.some((domain) => hrefLower.includes(domain));
          if (isAd) {
            event.preventDefault();
            event.stopPropagation();
            console.warn('[AdShield] Blocked ad link click:', hrefLower);
          }
        }
      },
      true // Capturing phase to intercept before bubbling
    );
  } catch {
    // Non-fatal
  }

  // 3. MUTATION OBSERVER TO REMOVE INJECTED AD ARTIFACTS
  const purgeAdElements = () => {
    try {
      const selectors = [
        'iframe[src*="doubleclick"]',
        'iframe[src*="googlesyndication"]',
        'iframe[src*="adservice"]',
        'iframe[src*="adserver"]',
        'div[id*="google_ads"]',
        'ins.adsbygoogle',
        '.ad-banner',
        '.ad-container',
        '.popunder',
        '#popunder',
        'div[class*="ad_overlay"]',
        'div[id*="ad_overlay"]',
      ];

      const adNodes = document.querySelectorAll(selectors.join(', '));
      adNodes.forEach((node) => {
        node.remove();
      });
    } catch {
      // Ignore query errors
    }
  };

  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      purgeAdElements();
    });

    const targetNode = document.body || document.documentElement;
    if (targetNode) {
      observer.observe(targetNode, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      });
    }
  }

  // 4. PREVENT BEFOREUNLOAD HIJACKING & UNWANTED REDIRECTS
  try {
    let lastUserInteraction = Date.now();
    window.addEventListener('pointerdown', () => {
      lastUserInteraction = Date.now();
    });

    window.addEventListener('beforeunload', (e) => {
      // If unload is triggered automatically without user interaction within 200ms
      const timeSinceInteraction = Date.now() - lastUserInteraction;
      if (timeSinceInteraction > 3000) {
        // Prevent background redirects
        e.preventDefault();
      }
    });
  } catch {
    // Non-fatal
  }
};
