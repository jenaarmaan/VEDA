import { ImageAnnotatorClient } from '@google-cloud/vision';
import axios, { AxiosResponse } from 'axios';
import { MediaFile, ReverseSearchResult, SearchMatch } from '../types';

export class ReverseSearchEngine {
  private googleVisionClient?: ImageAnnotatorClient;
  private tineyeApiKey?: string;
  private tineyeApiId?: string;

  constructor(config: {
    googleVisionApiKey?: string;
    tineyeApiKey?: string;
    tineyeApiId?: string;
  }) {
    this.tineyeApiKey = config.tineyeApiKey;
    this.tineyeApiId = config.tineyeApiId;

    if (config.googleVisionApiKey) {
      this.googleVisionClient = new ImageAnnotatorClient({
        keyFilename: config.googleVisionApiKey,
      });
    }
  }

  /**
   * Performs reverse image search using multiple engines
   */
  async searchImage(mediaFile: MediaFile): Promise<ReverseSearchResult[]> {
    const results: ReverseSearchResult[] = [];

    // Google Vision API search
    if (this.googleVisionClient) {
      try {
        const googleResult = await this.searchWithGoogleVision(mediaFile);
        results.push(googleResult);
      } catch (error) {
        console.error('Google Vision search failed:', error);
      }
    }

    // TinEye search
    if (this.tineyeApiKey && this.tineyeApiId) {
      try {
        const tineyeResult = await this.searchWithTinEye(mediaFile);
        results.push(tineyeResult);
      } catch (error) {
        console.error('TinEye search failed:', error);
      }
    }

    return results;
  }

  /**
   * Google Vision API reverse image search
   */
  private async searchWithGoogleVision(mediaFile: MediaFile): Promise<ReverseSearchResult> {
    const startTime = Date.now();
    
    if (!this.googleVisionClient) {
      throw new Error('Google Vision client not initialized');
    }

    try {
      // For URL-based search, we'll use web detection
      const [result] = await this.googleVisionClient.webDetection({
        image: { source: { imageUri: mediaFile.url } }
      });

      const matches: SearchMatch[] = [];
      
      // Process web entities (similar images)
      if (result.webDetection?.webEntities) {
        for (const entity of result.webDetection.webEntities) {
          if (entity.description && entity.score && entity.score > 0.5) {
            matches.push({
              url: `https://www.google.com/search?q=${encodeURIComponent(entity.description)}`,
              title: entity.description,
              similarity: entity.score,
              source: 'Google Vision Web Entities',
              publishedDate: new Date(), // Google doesn't provide exact dates
            });
          }
        }
      }

      // Process visually similar images
      if (result.webDetection?.visuallySimilarImages) {
        for (const similarImage of result.webDetection.visuallySimilarImages) {
          matches.push({
            url: similarImage.url || '',
            title: 'Visually Similar Image',
            similarity: 0.8, // Default similarity for visually similar
            source: 'Google Vision Similar Images',
          });
        }
      }

      // Process pages with matching images
      if (result.webDetection?.pagesWithMatchingImages) {
        for (const page of result.webDetection.pagesWithMatchingImages) {
          matches.push({
            url: page.url || '',
            title: page.pageTitle || 'Page with Matching Image',
            description: page.fullMatchingImages?.[0]?.url,
            similarity: 0.9, // High similarity for exact matches
            source: 'Google Vision Matching Pages',
          });
        }
      }

      return {
        source: 'google_vision',
        matches,
        totalMatches: matches.length,
        searchTime: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(`Google Vision search failed: ${error}`);
    }
  }

  /**
   * TinEye reverse image search
   */
  private async searchWithTinEye(mediaFile: MediaFile): Promise<ReverseSearchResult> {
    const startTime = Date.now();

    if (!this.tineyeApiKey || !this.tineyeApiId) {
      throw new Error('TinEye API credentials not provided');
    }

    try {
      // For TinEye, we need to download the image first and convert to base64
      const imageBuffer = await this.downloadImage(mediaFile.url);
      const base64Image = imageBuffer.toString('base64');

      const response: AxiosResponse = await axios.post(
        'https://api.tineye.com/rest/search/',
        {
          image: base64Image,
          limit: 100,
          sort: 'score',
          order: 'desc'
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          auth: {
            username: this.tineyeApiId,
            password: this.tineyeApiKey,
          },
        }
      );

      const matches: SearchMatch[] = [];
      
      if (response.data.results) {
        for (const result of response.data.results) {
          matches.push({
            url: result.url,
            title: result.title || 'TinEye Match',
            description: result.description,
            similarity: result.score / 100, // Convert to 0-1 scale
            publishedDate: result.date ? new Date(result.date) : undefined,
            source: 'TinEye',
            thumbnail: result.thumbnail,
          });
        }
      }

      return {
        source: 'tineye',
        matches,
        totalMatches: response.data.total_results || 0,
        searchTime: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(`TinEye search failed: ${error}`);
    }
  }

  /**
   * Downloads image from URL for processing
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'VEDA-Source-Forensics-Agent/1.0',
        },
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download image: ${error}`);
    }
  }

  /**
   * Performs reverse video search (limited functionality)
   */
  async searchVideo(mediaFile: MediaFile): Promise<ReverseSearchResult[]> {
    // Video reverse search is more complex and limited
    // This is a placeholder implementation
    console.warn('Video reverse search is not fully implemented');
    
    return [{
      source: 'google_vision',
      matches: [],
      totalMatches: 0,
      searchTime: 0,
    }];
  }

  /**
   * Combines results from multiple search engines
   */
  combineResults(results: ReverseSearchResult[]): SearchMatch[] {
    const allMatches: SearchMatch[] = [];
    const seenUrls = new Set<string>();

    for (const result of results) {
      for (const match of result.matches) {
        if (!seenUrls.has(match.url)) {
          allMatches.push(match);
          seenUrls.add(match.url);
        }
      }
    }

    // Sort by similarity score
    return allMatches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Validates search results for authenticity
   */
  validateResults(matches: SearchMatch[]): {
    authentic: SearchMatch[];
    suspicious: SearchMatch[];
    fake: SearchMatch[];
  } {
    const authentic: SearchMatch[] = [];
    const suspicious: SearchMatch[] = [];
    const fake: SearchMatch[] = [];

    for (const match of matches) {
      // Simple heuristics for classification
      if (match.similarity > 0.9 && match.publishedDate) {
        authentic.push(match);
      } else if (match.similarity > 0.7) {
        suspicious.push(match);
      } else {
        fake.push(match);
      }
    }

    return { authentic, suspicious, fake };
  }
}