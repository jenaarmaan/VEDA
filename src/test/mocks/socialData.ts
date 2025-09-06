/**
 * Mock social data for testing
 */

import {
  SocialUser,
  SocialPost,
  SocialInteraction,
  SocialDataCollection,
  SocialPlatform,
  InteractionType
} from '../../types';

export const mockUsers: SocialUser[] = [
  {
    id: 'user1',
    username: 'testuser1',
    displayName: 'Test User 1',
    platform: SocialPlatform.TWITTER,
    followerCount: 1000,
    followingCount: 500,
    verified: false,
    accountCreatedAt: new Date('2020-01-01'),
    bio: 'Test user for unit tests'
  },
  {
    id: 'user2',
    username: 'testuser2',
    displayName: 'Test User 2',
    platform: SocialPlatform.TWITTER,
    followerCount: 5000,
    followingCount: 200,
    verified: true,
    accountCreatedAt: new Date('2019-06-15'),
    bio: 'Verified test user'
  },
  {
    id: 'user3',
    username: 'testuser3',
    displayName: 'Test User 3',
    platform: SocialPlatform.TWITTER,
    followerCount: 100,
    followingCount: 2000,
    verified: false,
    accountCreatedAt: new Date('2023-01-01'),
    bio: 'New test user'
  }
];

export const mockPosts: SocialPost[] = [
  {
    id: 'post1',
    authorId: 'user1',
    platform: SocialPlatform.TWITTER,
    content: 'This is a test post about misinformation',
    createdAt: new Date('2023-12-01T10:00:00Z'),
    likeCount: 50,
    shareCount: 10,
    retweetCount: 5,
    commentCount: 3,
    hashtags: ['test', 'misinformation'],
    mentions: ['user2'],
    urls: ['https://example.com'],
    mediaUrls: []
  },
  {
    id: 'post2',
    authorId: 'user2',
    platform: SocialPlatform.TWITTER,
    content: 'This is another test post with similar content',
    createdAt: new Date('2023-12-01T10:05:00Z'),
    likeCount: 100,
    shareCount: 20,
    retweetCount: 10,
    commentCount: 5,
    hashtags: ['test', 'content'],
    mentions: ['user1'],
    urls: [],
    mediaUrls: []
  },
  {
    id: 'post3',
    authorId: 'user3',
    platform: SocialPlatform.TWITTER,
    content: 'This is a test post about misinformation',
    createdAt: new Date('2023-12-01T10:10:00Z'),
    likeCount: 25,
    shareCount: 5,
    retweetCount: 2,
    commentCount: 1,
    hashtags: ['test', 'misinformation'],
    mentions: [],
    urls: [],
    mediaUrls: []
  }
];

export const mockInteractions: SocialInteraction[] = [
  {
    id: 'interaction1',
    userId: 'user2',
    postId: 'post1',
    type: InteractionType.LIKE,
    timestamp: new Date('2023-12-01T10:01:00Z'),
    platform: SocialPlatform.TWITTER
  },
  {
    id: 'interaction2',
    userId: 'user3',
    postId: 'post1',
    type: InteractionType.RETWEET,
    timestamp: new Date('2023-12-01T10:02:00Z'),
    platform: SocialPlatform.TWITTER
  },
  {
    id: 'interaction3',
    userId: 'user1',
    postId: 'post2',
    type: InteractionType.LIKE,
    timestamp: new Date('2023-12-01T10:06:00Z'),
    platform: SocialPlatform.TWITTER
  }
];

export const mockDataCollection: SocialDataCollection = {
  users: mockUsers,
  posts: mockPosts,
  interactions: mockInteractions,
  collectionTimestamp: new Date('2023-12-01T12:00:00Z'),
  platform: SocialPlatform.TWITTER,
  query: 'test misinformation',
  timeRange: {
    start: new Date('2023-12-01T00:00:00Z'),
    end: new Date('2023-12-01T12:00:00Z')
  }
};

// Bot-like user for testing
export const mockBotUser: SocialUser = {
  id: 'botuser1',
  username: 'botuser1',
  displayName: 'Bot User 1',
  platform: SocialPlatform.TWITTER,
  followerCount: 10000,
  followingCount: 50,
  verified: false,
  accountCreatedAt: new Date('2023-11-01'),
  bio: 'Suspicious bot account'
};

// Bot-like posts (high similarity)
export const mockBotPosts: SocialPost[] = [
  {
    id: 'botpost1',
    authorId: 'botuser1',
    platform: SocialPlatform.TWITTER,
    content: 'Amazing product! Buy now! Click here!',
    createdAt: new Date('2023-12-01T10:00:00Z'),
    likeCount: 0,
    shareCount: 0,
    retweetCount: 0,
    commentCount: 0,
    hashtags: ['buy', 'now'],
    mentions: [],
    urls: ['https://spam.com'],
    mediaUrls: []
  },
  {
    id: 'botpost2',
    authorId: 'botuser1',
    platform: SocialPlatform.TWITTER,
    content: 'Amazing product! Buy now! Click here!',
    createdAt: new Date('2023-12-01T10:01:00Z'),
    likeCount: 0,
    shareCount: 0,
    retweetCount: 0,
    commentCount: 0,
    hashtags: ['buy', 'now'],
    mentions: [],
    urls: ['https://spam.com'],
    mediaUrls: []
  }
];

// Coordinated group data
export const mockCoordinatedUsers: SocialUser[] = [
  {
    id: 'coord1',
    username: 'coord1',
    displayName: 'Coordinated User 1',
    platform: SocialPlatform.TWITTER,
    followerCount: 1000,
    followingCount: 1000,
    verified: false,
    accountCreatedAt: new Date('2023-10-01'),
    bio: 'Coordinated account 1'
  },
  {
    id: 'coord2',
    username: 'coord2',
    displayName: 'Coordinated User 2',
    platform: SocialPlatform.TWITTER,
    followerCount: 1000,
    followingCount: 1000,
    verified: false,
    accountCreatedAt: new Date('2023-10-02'),
    bio: 'Coordinated account 2'
  }
];

export const mockCoordinatedPosts: SocialPost[] = [
  {
    id: 'coordpost1',
    authorId: 'coord1',
    platform: SocialPlatform.TWITTER,
    content: 'Breaking news: Important announcement!',
    createdAt: new Date('2023-12-01T10:00:00Z'),
    likeCount: 100,
    shareCount: 50,
    retweetCount: 25,
    commentCount: 10,
    hashtags: ['breaking', 'news'],
    mentions: [],
    urls: [],
    mediaUrls: []
  },
  {
    id: 'coordpost2',
    authorId: 'coord2',
    platform: SocialPlatform.TWITTER,
    content: 'Breaking news: Important announcement!',
    createdAt: new Date('2023-12-01T10:01:00Z'),
    likeCount: 100,
    shareCount: 50,
    retweetCount: 25,
    commentCount: 10,
    hashtags: ['breaking', 'news'],
    mentions: [],
    urls: [],
    mediaUrls: []
  }
];