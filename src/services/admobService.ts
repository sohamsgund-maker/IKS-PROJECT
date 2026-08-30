import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions, AdOptions } from '@capacitor-community/admob';

// Official Google AdMob Verified Test Ad Units
export const ADMOB_CONFIG = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  bannerAdId: 'ca-app-pub-3940256099942544/6300978111',
  interstitialAdId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedAdId: 'ca-app-pub-3940256099942544/5224354917',
  isTesting: true
};

class AdMobService {
  private isInitialized = false;
  private isBannerVisible = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (!Capacitor.isNativePlatform()) {
      // Running on Web Browser
      return;
    }

    try {
      await AdMob.initialize({
        initializeForTesting: ADMOB_CONFIG.isTesting,
      });
      this.isInitialized = true;
      console.log('✅ Google AdMob SDK Initialized & Verified');
    } catch (err) {
      console.warn('Google AdMob initialization error:', err);
    }
  }

  async showBottomBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    if (this.isBannerVisible) return;

    try {
      await this.initialize();
      const options: BannerAdOptions = {
        adId: ADMOB_CONFIG.bannerAdId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: ADMOB_CONFIG.isTesting
      };

      await AdMob.showBanner(options);
      this.isBannerVisible = true;
    } catch (err) {
      console.warn('AdMob banner error:', err);
    }
  }

  async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.isBannerVisible) return;
    try {
      await AdMob.hideBanner();
      this.isBannerVisible = false;
    } catch (err) {
      console.warn('AdMob hide banner error:', err);
    }
  }

  async showInterstitial(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await this.initialize();
      const options: AdOptions = {
        adId: ADMOB_CONFIG.interstitialAdId,
        isTesting: ADMOB_CONFIG.isTesting
      };
      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
    } catch (err) {
      console.warn('AdMob interstitial error:', err);
    }
  }
}

export const admobService = new AdMobService();
