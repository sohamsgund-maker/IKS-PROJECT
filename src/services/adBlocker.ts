/**
 * CineVault Anti-Ad & Popup Shield
 * Blocks popup ads, pop-unders, click-hijacking, tracking beacons, and unauthorized redirects.
 */

const KNOWN_AD_PATTERNS = [
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
  'banner',
  'trackings',
  'adsystem',
  'syndication',
];

export const initAdShield = (): void => {
  if (typeof window === 'undefined') return;

  // 1. INTERCEPT & NEUTRALIZE window.open (Popups & Pop-unders)
  const originalOpen = window.open;
  window.open = function (url?: string | URL, target?: string, features?: string): WindowProxy | null {
    const urlString = String(url || '').toLowerCase();

    // Check if the target is an ad pattern or external popup attempt
    const isAdUrl = KNOWN_AD_PATTERNS.some((pattern) => urlString.includes(pattern));
    
    // In our single page application, legitimate user flows do not use blank window popups for streaming
    if (isAdUrl || (!urlString.includes(window.location.hostname) && urlString.startsWith('http'))) {
      console.warn('[AdShield] Blocked popup attempt to:', urlString);
      // Return a dummy window object so calling script doesn't throw a fatal exception
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

  // 2. DEFEND AGAINST SCRIPT / IFRAME INJECTION OF ADS
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function <K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: ElementCreationOptions
  ): HTMLElementTagNameMap[K] {
    const el = originalCreateElement(tagName, options);

    if (tagName.toLowerCase() === 'script' || tagName.toLowerCase() === 'iframe') {
      const originalSetAttribute = el.setAttribute.bind(el);
      el.setAttribute = function (qualifiedName: string, value: string) {
        if (qualifiedName.toLowerCase() === 'src') {
          const valLower = String(value).toLowerCase();
          if (KNOWN_AD_PATTERNS.some((p) => valLower.includes(p))) {
            console.warn('[AdShield] Blocked ad script/iframe element:', valLower);
            return;
          }
        }
        return originalSetAttribute(qualifiedName, value);
      };
    }

    return el;
  };

  // 3. MUTATION OBSERVER TO PURGE AD ARTIFACTS
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

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      });
    }
  }

  // 4. PREVENT BEFOREUNLOAD HIJACKING
  try {
    Object.defineProperty(window, 'onbeforeunload', {
      configurable: false,
      set: () => {
        // Prevent rogue scripts from locking or displaying redirect modals
      },
      get: () => null,
    });
  } catch {
    // Non-fatal if browser restricts re-definition
  }
};
