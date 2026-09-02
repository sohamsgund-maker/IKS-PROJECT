import axios from 'axios';
import { logger } from '../utils/logger.js';

const MOVIEBOX_BASE_URL = 'https://api.aoneroom.com';

export class MovieboxService {
  static getHeaders() {
    return {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Mobile) OkHttp/4.9.3',
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-tr-devtype': 'android',
      'x-tr-region': 'IN',
    };
  }

  /**
   * Search MovieBox API by Title
   */
  static async search(query, page = 1, size = 20) {
    try {
      const response = await axios.get(
        `${MOVIEBOX_BASE_URL}/wefeed-mobile-bff/subject-api/search`,
        {
          params: { keyword: query, page, size },
          headers: this.getHeaders(),
          timeout: 4000,
        }
      );
      return response.data?.data?.items || [];
    } catch (error) {
      logger.warn(`MovieBox search failed for "${query}": ${error.message}`);
      return [];
    }
  }

  /**
   * Get direct stream play info by subjectId
   */
  static async getPlayInfo(subjectId) {
    try {
      const response = await axios.get(
        `${MOVIEBOX_BASE_URL}/wefeed-mobile-bff/subject-api/play-info`,
        {
          params: { subjectId },
          headers: this.getHeaders(),
          timeout: 4000,
        }
      );
      return response.data?.data || null;
    } catch (error) {
      logger.warn(`MovieBox play info failed for subjectId "${subjectId}": ${error.message}`);
      return null;
    }
  }
}
