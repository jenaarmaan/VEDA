/**
 * Core types for social media data structures
 */

export interface SocialUser {
  id: string;
  username: string;
  displayName: string;
  platform: SocialPlatform;
  followerCount: number;
  followingCount: number;
  verified: boolean;
  accountCreatedAt: Date;
  profileImageUrl?: string;
  bio?: string;
  location?: string;
}

export interface SocialPost {
  id: string;
  authorId: string;
  platform: SocialPlatform;
  content: string;
  createdAt: Date;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  retweetCount?: number; // Twitter specific
  parentPostId?: string; // For replies/retweets
  hashtags: string[];
  mentions: string[];
  urls: string[];
  mediaUrls: string[];
  language?: string;
  sentiment?: number; // -1 to 1
}

export interface SocialInteraction {
  id: string;
  userId: string;
  postId: string;
  type: InteractionType;
  timestamp: Date;
  platform: SocialPlatform;
}

export interface PropagationNode {
  id: string;
  type: 'user' | 'post';
  data: SocialUser | SocialPost;
  timestamp: Date;
}

export interface PropagationEdge {
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PropagationGraph {
  nodes: Map<string, PropagationNode>;
  edges: Map<string, PropagationEdge>;
  metadata: {
    totalNodes: number;
    totalEdges: number;
    timeRange: {
      start: Date;
      end: Date;
    };
    platforms: SocialPlatform[];
  };
}

export enum SocialPlatform {
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok'
}

export enum InteractionType {
  LIKE = 'like',
  SHARE = 'share',
  COMMENT = 'comment',
  RETWEET = 'retweet',
  REPLY = 'reply',
  MENTION = 'mention'
}

export enum EdgeType {
  POSTS = 'posts',
  LIKES = 'likes',
  SHARES = 'shares',
  COMMENTS = 'comments',
  RETWEETS = 'retweets',
  REPLIES = 'replies',
  MENTIONS = 'mentions',
  FOLLOWS = 'follows'
}

export interface SocialDataCollection {
  users: SocialUser[];
  posts: SocialPost[];
  interactions: SocialInteraction[];
  collectionTimestamp: Date;
  platform: SocialPlatform;
  query?: string;
  hashtags?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
}