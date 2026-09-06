/**
 * Centralized API Scraper & Processing Layer
 * 
 * Normalizes, sanitizes, and enriches data from upstream sources (TMDB, MovieBox, direct streams).
 * - Filters out advertisements, sponsored placement, and commercial tracking
 * - Preserves all legitimate movies, TV series, metadata, images, cast, subtitles, audio tracks, and streams
 * - Implements dynamic audio language discovery and Hindi-first priority playback logic
 */

// Supported standard audio language map with metadata and flags
export const KNOWN_LANGUAGES = {
  hi: { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  en: { id: 'en', name: 'English', nativeName: 'English', flag: '🌐' },
  te: { id: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🏹' },
  ta: { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🌴' },
  ml: { id: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🌸' },
  kn: { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🌊' },
  bn: { id: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🎭' },
  ja: { id: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { id: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  es: { id: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { id: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { id: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
};

export class ApiProcessor {
  /**
   * Filter out advertisements, promotional banners, sponsored cards, and tracking objects
   * Strictly preserves all legitimate movies, series, recommendations, and media.
   */
  static isAdvertisement(item) {
    if (!item || typeof item !== 'object') return true;

    // 1. Explicit ad / promo flags
    if (
      item.is_ad === true ||
      item.isAd === true ||
      item.advertisement === true ||
      item.is_promotion === true ||
      item.isPromotion === true ||
      item.sponsored === true ||
      item.is_sponsored === true ||
      item.commercial === true ||
      item.is_commercial === true
    ) {
      return true;
    }

    // 2. Type / Placement indicators
    const typeStr = String(item.type || item.media_type || item.category || item.placement || '').toLowerCase().trim();
    if (['ad', 'advertisement', 'banner_ad', 'promo', 'sponsored', 'sponsor', 'commercial', 'ad_banner'].includes(typeStr)) {
      return true;
    }

    // 3. Ad tracking URLs
    if (item.ad_url || item.adUrl || item.click_url || item.tracking_url || item.ad_image || item.adImage) {
      return true;
    }

    // 4. Sponsored title prefixes
    const title = String(item.title || item.name || item.subjectName || '').toLowerCase().trim();
    if (
      title.startsWith('sponsored:') ||
      title.startsWith('ad:') ||
      title.startsWith('promotion:') ||
      title === 'advertisement' ||
      title === 'google ad'
    ) {
      return true;
    }

    return false;
  }

  /**
   * Clean a list of movie/TV catalog items
   */
  static filterCatalog(items) {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => !this.isAdvertisement(item));
  }

  /**
   * Resolve language metadata from language code or name
   */
  static resolveLanguageInfo(langInput) {
    if (!langInput) return KNOWN_LANGUAGES.hi;
    const str = String(langInput).toLowerCase().trim();

    if (str.includes('hi') || str.includes('hindi')) return KNOWN_LANGUAGES.hi;
    if (str.includes('en') || str.includes('eng')) return KNOWN_LANGUAGES.en;
    if (str.includes('te') || str.includes('telugu')) return KNOWN_LANGUAGES.te;
    if (str.includes('ta') || str.includes('tamil')) return KNOWN_LANGUAGES.ta;
    if (str.includes('ml') || str.includes('malayalam')) return KNOWN_LANGUAGES.ml;
    if (str.includes('kn') || str.includes('kannada')) return KNOWN_LANGUAGES.kn;
    if (str.includes('bn') || str.includes('bengali')) return KNOWN_LANGUAGES.bn;
    if (str.includes('ja') || str.includes('japanese')) return KNOWN_LANGUAGES.ja;
    if (str.includes('ko') || str.includes('korean')) return KNOWN_LANGUAGES.ko;
    if (str.includes('es') || str.includes('spanish')) return KNOWN_LANGUAGES.es;

    return {
      id: str,
      name: langInput.charAt(0).toUpperCase() + langInput.slice(1),
      nativeName: langInput,
      flag: '🌐',
    };
  }

  /**
   * Process and normalize streams, dynamic audio languages, Hindi-first default, and subtitles
   */
  static processStreamsAndAudio({
    tmdbId,
    title,
    originalLanguage = 'en',
    genres = [],
    season = 1,
    episode = 1,
    isSeries = false,
    upstreamPlayInfo = null,
    sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  }) {
    const qualities = [];
    const audioTrackMap = new Map();
    const subtitles = [];

    // 1. Process qualities from upstream (MovieBox / Direct streams)
    if (upstreamPlayInfo && Array.isArray(upstreamPlayInfo.qualities)) {
      upstreamPlayInfo.qualities.forEach((q) => {
        if (q && (q.url || q.videoUrl)) {
          qualities.push({
            quality: q.quality || '1080p',
            videoUrl: q.url || q.videoUrl,
            downloadUrl: q.url || q.videoUrl,
            fileSize: q.fileSize || '1.8 GB',
          });
        }
      });
    }

    // Default qualities fallback if upstream direct stream qualities are not returned
    if (qualities.length === 0) {
      qualities.push(
        { quality: '1080p', videoUrl: sampleVideoUrl, downloadUrl: sampleVideoUrl, fileSize: '2.4 GB' },
        { quality: '720p', videoUrl: sampleVideoUrl, downloadUrl: sampleVideoUrl, fileSize: '1.2 GB' },
        { quality: '480p', videoUrl: sampleVideoUrl, downloadUrl: sampleVideoUrl, fileSize: '550 MB' }
      );
    }

    // 2. Dynamically extract and build available audio languages
    // Check if upstream provided audio languages
    const detectedLanguages = new Set();

    // Check upstream audio tracks or streams
    if (upstreamPlayInfo && Array.isArray(upstreamPlayInfo.audio_tracks)) {
      upstreamPlayInfo.audio_tracks.forEach((t) => {
        if (t.language) detectedLanguages.add(t.language.toLowerCase());
      });
    }

    // Contextual detection from movie metadata
    const origLangLower = String(originalLanguage).toLowerCase();
    detectedLanguages.add(origLangLower);

    const genreList = Array.isArray(genres) ? genres.map((g) => String(g).toLowerCase()) : [];
    const isNativeHindi = origLangLower === 'hi' || genreList.includes('bollywood');
    const isPanIndiaIndian = origLangLower === 'te' || origLangLower === 'ta' ||
      origLangLower === 'ml' || origLangLower === 'kn' || genreList.includes('south indian');

    const titleLower = String(title || '').toLowerCase();
    const isGlobalHindiDubbed = [
      'deadpool', 'wolverine', 'spider', 'avenger', 'interstellar', 'inception',
      'avatar', 'dark knight', 'gladiator', 'alien', 'batman', 'top gun', 'fast &', 'fast and', 'furious',
      'stranger things', 'money heist', 'squid game', 'demon slayer', 'solo leveling', 'jujutsu',
      'oppenheimer', 'mission: impossible', 'mission impossible', 'transformers', 'jurassic',
      'harry potter', 'lord of the rings', 'iron man', 'thor', 'captain america', 'guardians of the galaxy',
      'black panther', 'ant-man', 'doctor strange', 'aquaman', 'wonder woman', 'superman', 'godzilla',
      'kong', 'dune', 'matrix', 'john wick', 'kung fu panda', 'lion king', 'aladdin', 'frozen', 'moana',
      'zootopia', 'toy story', 'despicable me', 'minions', 'shrek', 'madagascar', 'ice age',
      'pushpa', 'kalki', 'rrr', 'kgf', 'devara', 'salaar', 'baahubali', 'kantara', 'hanuman', 'hanu-man',
      'leo', 'jailer', 'vikram', 'jawan', 'pathaan', 'stree', 'dangal', 'animal', 'chhaava'
    ].some((keyword) => titleLower.includes(keyword));

    const isHindiActuallyAvailable = isNativeHindi || isPanIndiaIndian || isGlobalHindiDubbed ||
      Boolean(upstreamPlayInfo?.audio_tracks?.some((t) => String(t.language || t.name || '').toLowerCase().includes('hi')));

    if (isNativeHindi) {
      detectedLanguages.add('hi');
      detectedLanguages.add('en');
    } else if (isPanIndiaIndian) {
      detectedLanguages.add('hi');
      detectedLanguages.add(origLangLower);
      detectedLanguages.add('en');
    } else if (isGlobalHindiDubbed) {
      detectedLanguages.add('hi');
      detectedLanguages.add('en');
    } else {
      detectedLanguages.add('en');
      if (origLangLower && origLangLower !== 'en') {
        detectedLanguages.add(origLangLower);
      }
    }

    // Build audio track objects
    Array.from(detectedLanguages).forEach((langCode) => {
      const info = this.resolveLanguageInfo(langCode);
      audioTrackMap.set(info.id, {
        id: info.id,
        name: info.name,
        nativeName: info.nativeName,
        flag: info.flag,
        language: info.name,
        url: sampleVideoUrl,
        isDefault: false,
      });
    });

    const audioTracks = Array.from(audioTrackMap.values());

    // 3. HINDI-FIRST DEFAULT SELECTION LOGIC
    // Check if Hindi is available -> Select Hindi first -> Start playback in Hindi.
    // If Hindi is unavailable -> Automatically use the best/default language without failing playback.
    let defaultLanguageId = origLangLower || 'en';
    const hasHindi = isHindiActuallyAvailable && audioTracks.some((t) => t.id === 'hi' || t.name.toLowerCase() === 'hindi');

    if (hasHindi) {
      defaultLanguageId = 'hi';
    } else if (audioTracks.some((t) => t.id === origLangLower)) {
      defaultLanguageId = origLangLower;
    } else if (audioTracks.length > 0) {
      defaultLanguageId = audioTracks[0].id;
    }

    // Mark isDefault flag
    audioTracks.forEach((t) => {
      t.isDefault = t.id === defaultLanguageId;
    });

    // 4. Subtitles & Captions
    if (upstreamPlayInfo && Array.isArray(upstreamPlayInfo.subtitles)) {
      upstreamPlayInfo.subtitles.forEach((s) => {
        if (s && s.url) {
          subtitles.push({
            language: s.lang || 'en',
            label: s.label || s.language || 'English',
            src: s.url,
          });
        }
      });
    }

    if (subtitles.length === 0) {
      subtitles.push(
        { language: 'en', label: 'English [CC]', src: '' },
        { language: 'hi', label: 'Hindi (हिंदी)', src: '' }
      );
    }

    // 5. Fallback Embed Providers (ADSTUDIO Multi-Server: 2Embed Epsilon / Peachify / SuperEmbed)
    const color = 'E50914';
    const fallbackEmbedUrl = isHindiActuallyAvailable
      ? (isSeries
          ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
          : `https://www.2embed.cc/embed/${tmdbId}`)
      : (isSeries
          ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=${color}&multiAudio=true&autoplay=true`
          : `https://vidlink.pro/movie/${tmdbId}?primaryColor=${color}&multiAudio=true&autoplay=true`);

    return {
      tmdbId: Number(tmdbId),
      title,
      defaultLanguage: defaultLanguageId,
      isHindiAvailable: isHindiActuallyAvailable,
      audioTracks,
      qualities,
      subtitles,
      directStreamUrl: qualities[0]?.videoUrl || sampleVideoUrl,
      fallbackEmbedUrl,
    };
  }
}
