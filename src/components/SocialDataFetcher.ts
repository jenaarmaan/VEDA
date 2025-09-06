/**
 * SocialDataFetcher - Collects social media data from various platforms
 */

import { TwitterApi, TwitterApiV2Settings } from 'twitter-api-v2';
import { FacebookAdsApi, AdAccount } from 'facebook-nodejs-business-sdk';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  SocialUser,
  SocialPost,
  SocialInteraction,
  SocialDataCollection,
  SocialPlatform,
  InteractionType,
  TwitterApiConfig,
  FacebookApiConfig,
  SocialDataFetcherConfig
} from '../types';

export class SocialDataFetcher {
  private twitterClient?: TwitterApi;
  private facebookClient?: FacebookAdsApi;
  private httpClient: AxiosInstance;
  private config: SocialDataFetcherConfig;
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  constructor(config: SocialDataFetcherConfig) {
    this.config = config;
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'VEDA-SocialGraphAgent/1.0.0'
      }
    });

    this.initializeClients();
  }

  private initializeClients(): void {
    // Initialize Twitter API client
    if (this.config.twitter) {
      this.twitterClient = new TwitterApi({
        appKey: this.config.twitter.apiKey,
        appSecret: this.config.twitter.apiSecret,
        accessToken: this.config.twitter.accessToken,
        accessSecret: this.config.twitter.accessTokenSecret,
      });
      TwitterApiV2Settings.defaultLogger = {
        log: () => {}, // Disable logging for production
      };
    }

    // Initialize Facebook API client
    if (this.config.facebook) {
      this.facebookClient = FacebookAdsApi.init(
        this.config.facebook.accessToken,
        this.config.facebook.version
      );
    }
  }

  /**
   * Fetch data from multiple platforms based on query parameters
   */
  async fetchSocialData(
    query: string,
    platforms: SocialPlatform[],
    timeWindow: number = 24
  ): Promise<SocialDataCollection[]> {
    const collections: SocialDataCollection[] = [];

    for (const platform of platforms) {
      try {
        const collection = await this.fetchFromPlatform(query, platform, timeWindow);
        collections.push(collection);
      } catch (error) {
        console.error(`Error fetching data from ${platform}:`, error);
        // Continue with other platforms even if one fails
      }
    }

    return collections;
  }

  /**
   * Fetch data from a specific platform
   */
  private async fetchFromPlatform(
    query: string,
    platform: SocialPlatform,
    timeWindow: number
  ): Promise<SocialDataCollection> {
    const cacheKey = `${platform}:${query}:${timeWindow}`;
    
    if (this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }
    }

    let collection: SocialDataCollection;

    switch (platform) {
      case SocialPlatform.TWITTER:
        collection = await this.fetchTwitterData(query, timeWindow);
        break;
      case SocialPlatform.FACEBOOK:
        collection = await this.fetchFacebookData(query, timeWindow);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Cache the result
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, {
        data: collection,
        expiry: Date.now() + (this.config.cacheExpiry * 60 * 1000)
      });
    }

    return collection;
  }

  /**
   * Fetch data from Twitter API v2
   */
  private async fetchTwitterData(query: string, timeWindow: number): Promise<SocialDataCollection> {
    if (!this.twitterClient) {
      throw new Error('Twitter client not initialized');
    }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (timeWindow * 60 * 60 * 1000));

    try {
      // Search for tweets
      const tweetsResponse = await this.twitterClient.v2.search(query, {
        max_results: this.config.maxResults,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        'tweet.fields': [
          'created_at', 'author_id', 'public_metrics', 'context_annotations',
          'entities', 'lang', 'conversation_id', 'referenced_tweets'
        ],
        'user.fields': [
          'created_at', 'public_metrics', 'verified', 'description',
          'location', 'profile_image_url'
        ],
        expansions: ['author_id', 'referenced_tweets.id']
      });

      const users = this.parseTwitterUsers(tweetsResponse.includes?.users || []);
      const posts = this.parseTwitterPosts(tweetsResponse.data || []);
      const interactions = this.parseTwitterInteractions(tweetsResponse.data || []);

      return {
        users,
        posts,
        interactions,
        collectionTimestamp: new Date(),
        platform: SocialPlatform.TWITTER,
        query,
        timeRange: { start: startTime, end: endTime }
      };
    } catch (error) {
      throw new Error(`Twitter API error: ${error}`);
    }
  }

  /**
   * Fetch data from Facebook Graph API (stubbed implementation)
   */
  private async fetchFacebookData(query: string, timeWindow: number): Promise<SocialDataCollection> {
    if (!this.facebookClient) {
      throw new Error('Facebook client not initialized');
    }

    // This is a stubbed implementation for demonstration
    // In a real implementation, you would use Facebook Graph API
    const mockUsers: SocialUser[] = [
      {
        id: 'fb_user_1',
        username: 'mock_user_1',
        displayName: 'Mock User 1',
        platform: SocialPlatform.FACEBOOK,
        followerCount: 1000,
        followingCount: 500,
        verified: false,
        accountCreatedAt: new Date('2020-01-01'),
        bio: 'Mock Facebook user for testing'
      }
    ];

    const mockPosts: SocialPost[] = [
      {
        id: 'fb_post_1',
        authorId: 'fb_user_1',
        platform: SocialPlatform.FACEBOOK,
        content: `Mock Facebook post about: ${query}`,
        createdAt: new Date(),
        likeCount: 50,
        shareCount: 10,
        commentCount: 5,
        hashtags: ['mock', 'test'],
        mentions: [],
        urls: [],
        mediaUrls: []
      }
    ];

    const mockInteractions: SocialInteraction[] = [
      {
        id: 'fb_interaction_1',
        userId: 'fb_user_1',
        postId: 'fb_post_1',
        type: InteractionType.LIKE,
        timestamp: new Date(),
        platform: SocialPlatform.FACEBOOK
      }
    ];

    return {
      users: mockUsers,
      posts: mockPosts,
      interactions: mockInteractions,
      collectionTimestamp: new Date(),
      platform: SocialPlatform.FACEBOOK,
      query,
      timeRange: {
        start: new Date(Date.now() - (timeWindow * 60 * 60 * 1000)),
        end: new Date()
      }
    };
  }

  /**
   * Parse Twitter users from API response
   */
  private parseTwitterUsers(users: any[]): SocialUser[] {
    return users.map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.name,
      platform: SocialPlatform.TWITTER,
      followerCount: user.public_metrics?.followers_count || 0,
      followingCount: user.public_metrics?.following_count || 0,
      verified: user.verified || false,
      accountCreatedAt: new Date(user.created_at),
      profileImageUrl: user.profile_image_url,
      bio: user.description,
      location: user.location
    }));
  }

  /**
   * Parse Twitter posts from API response
   */
  private parseTwitterPosts(tweets: any[]): SocialPost[] {
    return tweets.map(tweet => ({
      id: tweet.id,
      authorId: tweet.author_id,
      platform: SocialPlatform.TWITTER,
      content: tweet.text,
      createdAt: new Date(tweet.created_at),
      likeCount: tweet.public_metrics?.like_count || 0,
      shareCount: tweet.public_metrics?.retweet_count || 0,
      retweetCount: tweet.public_metrics?.retweet_count || 0,
      commentCount: tweet.public_metrics?.reply_count || 0,
      parentPostId: tweet.referenced_tweets?.[0]?.id,
      hashtags: tweet.entities?.hashtags?.map((h: any) => h.tag) || [],
      mentions: tweet.entities?.mentions?.map((m: any) => m.username) || [],
      urls: tweet.entities?.urls?.map((u: any) => u.expanded_url) || [],
      mediaUrls: tweet.entities?.media?.map((m: any) => m.url) || [],
      language: tweet.lang
    }));
  }

  /**
   * Parse Twitter interactions from API response
   */
  private parseTwitterInteractions(tweets: any[]): SocialInteraction[] {
    const interactions: SocialInteraction[] = [];

    tweets.forEach(tweet => {
      // Add like interaction
      if (tweet.public_metrics?.like_count > 0) {
        interactions.push({
          id: `${tweet.id}_like`,
          userId: tweet.author_id,
          postId: tweet.id,
          type: InteractionType.LIKE,
          timestamp: new Date(tweet.created_at),
          platform: SocialPlatform.TWITTER
        });
      }

      // Add retweet interaction
      if (tweet.public_metrics?.retweet_count > 0) {
        interactions.push({
          id: `${tweet.id}_retweet`,
          userId: tweet.author_id,
          postId: tweet.id,
          type: InteractionType.RETWEET,
          timestamp: new Date(tweet.created_at),
          platform: SocialPlatform.TWITTER
        });
      }

      // Add reply interaction
      if (tweet.public_metrics?.reply_count > 0) {
        interactions.push({
          id: `${tweet.id}_reply`,
          userId: tweet.author_id,
          postId: tweet.id,
          type: InteractionType.REPLY,
          timestamp: new Date(tweet.created_at),
          platform: SocialPlatform.TWITTER
        });
      }
    });

    return interactions;
  }

  /**
   * Fetch user details by ID
   */
  async fetchUserDetails(userId: string, platform: SocialPlatform): Promise<SocialUser | null> {
    try {
      switch (platform) {
        case SocialPlatform.TWITTER:
          return await this.fetchTwitterUserDetails(userId);
        case SocialPlatform.FACEBOOK:
          return await this.fetchFacebookUserDetails(userId);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Error fetching user details for ${userId}:`, error);
      return null;
    }
  }

  private async fetchTwitterUserDetails(userId: string): Promise<SocialUser | null> {
    if (!this.twitterClient) {
      throw new Error('Twitter client not initialized');
    }

    try {
      const user = await this.twitterClient.v2.user(userId, {
        'user.fields': [
          'created_at', 'public_metrics', 'verified', 'description',
          'location', 'profile_image_url'
        ]
      });

      return {
        id: user.data.id,
        username: user.data.username,
        displayName: user.data.name,
        platform: SocialPlatform.TWITTER,
        followerCount: user.data.public_metrics?.followers_count || 0,
        followingCount: user.data.public_metrics?.following_count || 0,
        verified: user.data.verified || false,
        accountCreatedAt: new Date(user.data.created_at),
        profileImageUrl: user.data.profile_image_url,
        bio: user.data.description,
        location: user.data.location
      };
    } catch (error) {
      throw new Error(`Twitter user fetch error: ${error}`);
    }
  }

  private async fetchFacebookUserDetails(userId: string): Promise<SocialUser | null> {
    // Stubbed implementation
    return {
      id: userId,
      username: `fb_user_${userId}`,
      displayName: `Facebook User ${userId}`,
      platform: SocialPlatform.FACEBOOK,
      followerCount: 1000,
      followingCount: 500,
      verified: false,
      accountCreatedAt: new Date('2020-01-01'),
      bio: 'Mock Facebook user'
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to track hits/misses for accurate calculation
    };
  }
}