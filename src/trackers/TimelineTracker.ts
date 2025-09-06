import moment from 'moment';
import axios from 'axios';
import { MediaFile, TimelineEvent, PublicationTimeline, SearchMatch } from '../types';

export class TimelineTracker {
  private similarityThreshold: number;

  constructor(config: { similarityThreshold?: number } = {}) {
    this.similarityThreshold = config.similarityThreshold || 0.8;
  }

  /**
   * Reconstructs publication timeline from search results
   */
  async reconstructTimeline(
    mediaFile: MediaFile,
    searchResults: SearchMatch[]
  ): Promise<PublicationTimeline> {
    try {
      // Filter and process search results
      const relevantMatches = this.filterRelevantMatches(searchResults);
      
      // Create timeline events from matches
      const events = await this.createTimelineEvents(relevantMatches);
      
      // Sort events chronologically
      const sortedEvents = this.sortEventsChronologically(events);
      
      // Identify viral threshold
      const viralThreshold = this.identifyViralThreshold(sortedEvents);
      
      // Build source chain
      const sourceChain = this.buildSourceChain(sortedEvents);
      
      return {
        mediaId: mediaFile.id,
        events: sortedEvents,
        earliestPublication: sortedEvents.length > 0 ? sortedEvents[0].timestamp : undefined,
        viralThreshold,
        sourceChain,
      };
    } catch (error) {
      throw new Error(`Timeline reconstruction failed: ${error}`);
    }
  }

  /**
   * Filters search results for timeline relevance
   */
  private filterRelevantMatches(searchResults: SearchMatch[]): SearchMatch[] {
    return searchResults.filter(match => {
      // Filter by similarity threshold
      if (match.similarity < this.similarityThreshold) {
        return false;
      }
      
      // Filter out invalid URLs
      if (!match.url || match.url.length < 10) {
        return false;
      }
      
      // Filter out social media internal URLs that don't provide useful timeline info
      const socialMediaPatterns = [
        /facebook\.com\/photo\.php/,
        /instagram\.com\/p\/[^\/]+$/,
        /twitter\.com\/status\/\d+$/,
        /tiktok\.com\/@[^\/]+\/video\/\d+$/,
      ];
      
      const isSocialMediaInternal = socialMediaPatterns.some(pattern => pattern.test(match.url));
      if (isSocialMediaInternal) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Creates timeline events from search matches
   */
  private async createTimelineEvents(matches: SearchMatch[]): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];
    
    for (const match of matches) {
      try {
        const event = await this.createEventFromMatch(match);
        if (event) {
          events.push(event);
        }
      } catch (error) {
        console.warn(`Failed to create event from match ${match.url}:`, error);
      }
    }
    
    return events;
  }

  /**
   * Creates a timeline event from a search match
   */
  private async createEventFromMatch(match: SearchMatch): Promise<TimelineEvent | null> {
    try {
      // Extract platform information
      const platform = this.extractPlatform(match.url);
      
      // Try to get additional metadata from the URL
      const metadata = await this.extractUrlMetadata(match.url);
      
      // Determine publication date
      const publicationDate = this.determinePublicationDate(match, metadata);
      
      // Calculate confidence based on available data
      const confidence = this.calculateEventConfidence(match, metadata, publicationDate);
      
      return {
        id: this.generateEventId(match.url),
        timestamp: publicationDate,
        platform,
        url: match.url,
        title: match.title || metadata.title,
        description: match.description || metadata.description,
        engagement: metadata.engagement,
        source: match.source,
        confidence,
      };
    } catch (error) {
      console.warn(`Failed to create event from match:`, error);
      return null;
    }
  }

  /**
   * Extracts platform information from URL
   */
  private extractPlatform(url: string): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) {
      return 'Facebook';
    } else if (urlLower.includes('instagram.com')) {
      return 'Instagram';
    } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
      return 'Twitter/X';
    } else if (urlLower.includes('tiktok.com')) {
      return 'TikTok';
    } else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'YouTube';
    } else if (urlLower.includes('reddit.com')) {
      return 'Reddit';
    } else if (urlLower.includes('pinterest.com')) {
      return 'Pinterest';
    } else if (urlLower.includes('linkedin.com')) {
      return 'LinkedIn';
    } else if (urlLower.includes('snapchat.com')) {
      return 'Snapchat';
    } else if (urlLower.includes('telegram.org')) {
      return 'Telegram';
    } else if (urlLower.includes('whatsapp.com')) {
      return 'WhatsApp';
    } else if (urlLower.includes('news') || urlLower.includes('article')) {
      return 'News Website';
    } else if (urlLower.includes('blog')) {
      return 'Blog';
    } else {
      return 'Website';
    }
  }

  /**
   * Extracts metadata from URL (simplified implementation)
   */
  private async extractUrlMetadata(url: string): Promise<{
    title?: string;
    description?: string;
    engagement?: { likes?: number; shares?: number; comments?: number };
  }> {
    try {
      // This is a simplified implementation
      // In practice, you'd use more sophisticated web scraping or APIs
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'VEDA-Source-Forensics-Agent/1.0',
        },
      });
      
      const html = response.data;
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : undefined;
      
      // Extract description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      const description = descMatch ? descMatch[1].trim() : undefined;
      
      // Extract engagement metrics (very basic)
      const engagement = this.extractEngagementMetrics(html, url);
      
      return { title, description, engagement };
    } catch (error) {
      console.warn(`Failed to extract metadata from ${url}:`, error);
      return {};
    }
  }

  /**
   * Extracts engagement metrics from HTML (simplified)
   */
  private extractEngagementMetrics(html: string, url: string): {
    likes?: number;
    shares?: number;
    comments?: number;
  } {
    const engagement: { likes?: number; shares?: number; comments?: number } = {};
    
    try {
      // This is a very basic implementation
      // In practice, you'd need platform-specific extraction logic
      
      // Look for common engagement patterns
      const likePatterns = [
        /(\d+)\s*likes?/i,
        /(\d+)\s*hearts?/i,
        /(\d+)\s*reactions?/i,
      ];
      
      const sharePatterns = [
        /(\d+)\s*shares?/i,
        /(\d+)\s*retweets?/i,
        /(\d+)\s*reposts?/i,
      ];
      
      const commentPatterns = [
        /(\d+)\s*comments?/i,
        /(\d+)\s*replies?/i,
      ];
      
      for (const pattern of likePatterns) {
        const match = html.match(pattern);
        if (match) {
          engagement.likes = parseInt(match[1]);
          break;
        }
      }
      
      for (const pattern of sharePatterns) {
        const match = html.match(pattern);
        if (match) {
          engagement.shares = parseInt(match[1]);
          break;
        }
      }
      
      for (const pattern of commentPatterns) {
        const match = html.match(pattern);
        if (match) {
          engagement.comments = parseInt(match[1]);
          break;
        }
      }
    } catch (error) {
      console.warn('Failed to extract engagement metrics:', error);
    }
    
    return engagement;
  }

  /**
   * Determines publication date from match and metadata
   */
  private determinePublicationDate(
    match: SearchMatch,
    metadata: any
  ): Date {
    // Priority order: match.publishedDate > metadata.date > current time
    if (match.publishedDate) {
      return match.publishedDate;
    }
    
    if (metadata.date) {
      return new Date(metadata.date);
    }
    
    // If no date available, use current time as fallback
    return new Date();
  }

  /**
   * Calculates confidence score for timeline event
   */
  private calculateEventConfidence(
    match: SearchMatch,
    metadata: any,
    publicationDate: Date
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for high similarity
    confidence += match.similarity * 0.3;
    
    // Boost confidence for available metadata
    if (metadata.title) confidence += 0.1;
    if (metadata.description) confidence += 0.1;
    if (metadata.engagement) confidence += 0.1;
    
    // Boost confidence for recent publication date
    const daysSincePublication = moment().diff(moment(publicationDate), 'days');
    if (daysSincePublication < 30) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, confidence);
  }

  /**
   * Generates unique event ID
   */
  private generateEventId(url: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(url).digest('hex').substring(0, 16);
  }

  /**
   * Sorts events chronologically
   */
  private sortEventsChronologically(events: TimelineEvent[]): TimelineEvent[] {
    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Identifies viral threshold point
   */
  private identifyViralThreshold(events: TimelineEvent[]): Date | undefined {
    if (events.length < 3) return undefined;
    
    // Simple viral threshold detection based on engagement growth
    let maxEngagement = 0;
    let viralThreshold: Date | undefined;
    
    for (let i = 1; i < events.length; i++) {
      const currentEvent = events[i];
      const previousEvent = events[i - 1];
      
      const currentEngagement = this.calculateTotalEngagement(currentEvent);
      const previousEngagement = this.calculateTotalEngagement(previousEvent);
      
      // Check for significant engagement spike
      if (currentEngagement > previousEngagement * 2 && currentEngagement > maxEngagement) {
        maxEngagement = currentEngagement;
        viralThreshold = currentEvent.timestamp;
      }
    }
    
    return viralThreshold;
  }

  /**
   * Calculates total engagement for an event
   */
  private calculateTotalEngagement(event: TimelineEvent): number {
    if (!event.engagement) return 0;
    
    return (event.engagement.likes || 0) + 
           (event.engagement.shares || 0) + 
           (event.engagement.comments || 0);
  }

  /**
   * Builds source chain from timeline events
   */
  private buildSourceChain(events: TimelineEvent[]): string[] {
    const sourceChain: string[] = [];
    const seenPlatforms = new Set<string>();
    
    for (const event of events) {
      if (!seenPlatforms.has(event.platform)) {
        sourceChain.push(event.platform);
        seenPlatforms.add(event.platform);
      }
    }
    
    return sourceChain;
  }

  /**
   * Validates timeline integrity
   */
  validateTimeline(timeline: PublicationTimeline): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check for chronological order
    for (let i = 1; i < timeline.events.length; i++) {
      if (timeline.events[i].timestamp < timeline.events[i - 1].timestamp) {
        issues.push('Events are not in chronological order');
        break;
      }
    }
    
    // Check for reasonable time gaps
    if (timeline.events.length > 1) {
      const firstEvent = timeline.events[0];
      const lastEvent = timeline.events[timeline.events.length - 1];
      const timeDiff = lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 365) {
        issues.push('Timeline spans more than a year, may indicate data quality issues');
      }
    }
    
    // Check for low confidence events
    const lowConfidenceEvents = timeline.events.filter(event => event.confidence < 0.5);
    if (lowConfidenceEvents.length > timeline.events.length * 0.5) {
      issues.push('More than 50% of events have low confidence scores');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Generates timeline summary
   */
  generateTimelineSummary(timeline: PublicationTimeline): {
    totalEvents: number;
    platforms: string[];
    timeSpan: string;
    viralThreshold?: string;
    sourceChain: string;
  } {
    const platforms = [...new Set(timeline.events.map(event => event.platform))];
    
    let timeSpan = 'Unknown';
    if (timeline.events.length > 0) {
      const firstEvent = timeline.events[0];
      const lastEvent = timeline.events[timeline.events.length - 1];
      const diff = moment(lastEvent.timestamp).diff(moment(firstEvent.timestamp));
      timeSpan = moment.duration(diff).humanize();
    }
    
    return {
      totalEvents: timeline.events.length,
      platforms,
      timeSpan,
      viralThreshold: timeline.viralThreshold ? moment(timeline.viralThreshold).format('YYYY-MM-DD HH:mm:ss') : undefined,
      sourceChain: timeline.sourceChain.join(' → '),
    };
  }
}