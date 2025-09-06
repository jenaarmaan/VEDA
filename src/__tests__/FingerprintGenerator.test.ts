import { FingerprintGenerator } from '../generators/FingerprintGenerator';
import { MediaFile, ContentFingerprint } from '../types';

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Mock sharp
jest.mock('sharp');
const sharp = require('sharp');

describe('FingerprintGenerator', () => {
  let generator: FingerprintGenerator;
  let mockMediaFile: MediaFile;

  beforeEach(() => {
    generator = new FingerprintGenerator();
    
    mockMediaFile = {
      id: 'test-media-1',
      url: 'https://example.com/test-image.jpg',
      type: 'image',
      filename: 'test-image.jpg',
      size: 1024000,
      mimeType: 'image/jpeg',
    };

    // Mock axios response
    axios.get.mockResolvedValue({
      data: Buffer.from('mock-image-data'),
    });

    // Mock sharp operations
    sharp.mockReturnValue({
      resize: jest.fn().mockReturnThis(),
      greyscale: jest.fn().mockReturnThis(),
      raw: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(64)), // 8x8 image
    });
  });

  describe('generateFingerprint', () => {
    it('should generate fingerprint for image', async () => {
      const fingerprint = await generator.generateFingerprint(mockMediaFile);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.mediaId).toBe(mockMediaFile.id);
      expect(fingerprint.md5Hash).toBeDefined();
      expect(fingerprint.sha256Hash).toBeDefined();
      expect(fingerprint.perceptualHash).toBeDefined();
      expect(fingerprint.dhash).toBeDefined();
      expect(fingerprint.phash).toBeDefined();
      expect(fingerprint.averageHash).toBeDefined();
      expect(fingerprint.created).toBeInstanceOf(Date);
    });

    it('should handle download errors', async () => {
      axios.get.mockRejectedValue(new Error('Download failed'));

      await expect(generator.generateFingerprint(mockMediaFile)).rejects.toThrow();
    });
  });

  describe('hash generation', () => {
    it('should generate valid MD5 hash', async () => {
      const fingerprint = await generator.generateFingerprint(mockMediaFile);

      expect(fingerprint.md5Hash).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate valid SHA256 hash', async () => {
      const fingerprint = await generator.generateFingerprint(mockMediaFile);

      expect(fingerprint.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate valid perceptual hashes', async () => {
      const fingerprint = await generator.generateFingerprint(mockMediaFile);

      expect(fingerprint.perceptualHash).toMatch(/^[01]+$/);
      expect(fingerprint.dhash).toMatch(/^[01]+$/);
      expect(fingerprint.phash).toMatch(/^[01]+$/);
      expect(fingerprint.averageHash).toMatch(/^[01]+$/);
    });
  });

  describe('compareFingerprints', () => {
    it('should compare identical fingerprints', () => {
      const fingerprint1: ContentFingerprint = {
        mediaId: 'test-1',
        perceptualHash: '1010101010101010',
        md5Hash: 'd41d8cd98f00b204e9800998ecf8427e',
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        created: new Date(),
      };

      const fingerprint2: ContentFingerprint = {
        mediaId: 'test-2',
        perceptualHash: '1010101010101010',
        md5Hash: 'd41d8cd98f00b204e9800998ecf8427e',
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        created: new Date(),
      };

      const comparison = generator.compareFingerprints(fingerprint1, fingerprint2);

      expect(comparison.exactMatch).toBe(true);
      expect(comparison.similarity).toBe(1.0);
      expect(comparison.hashMatches.md5).toBe(true);
      expect(comparison.hashMatches.sha256).toBe(true);
    });

    it('should compare different fingerprints', () => {
      const fingerprint1: ContentFingerprint = {
        mediaId: 'test-1',
        perceptualHash: '1010101010101010',
        md5Hash: 'd41d8cd98f00b204e9800998ecf8427e',
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        created: new Date(),
      };

      const fingerprint2: ContentFingerprint = {
        mediaId: 'test-2',
        perceptualHash: '0101010101010101',
        md5Hash: '098f6bcd4621d373cade4e832627b4f6',
        sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        created: new Date(),
      };

      const comparison = generator.compareFingerprints(fingerprint1, fingerprint2);

      expect(comparison.exactMatch).toBe(false);
      expect(comparison.similarity).toBeLessThan(1.0);
      expect(comparison.hashMatches.md5).toBe(false);
      expect(comparison.hashMatches.sha256).toBe(false);
    });
  });

  describe('detectDuplicates', () => {
    it('should detect exact duplicates', () => {
      const fingerprints: ContentFingerprint[] = [
        {
          mediaId: 'test-1',
          perceptualHash: '1010101010101010',
          md5Hash: 'd41d8cd98f00b204e9800998ecf8427e',
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          created: new Date(),
        },
        {
          mediaId: 'test-2',
          perceptualHash: '1010101010101010',
          md5Hash: 'd41d8cd98f00b204e9800998ecf8427e',
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          created: new Date(),
        },
      ];

      const duplicates = generator.detectDuplicates(fingerprints, 0.8);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].fingerprints.length).toBe(2);
      expect(duplicates[0].type).toBe('exact');
    });

    it('should detect near duplicates', () => {
      const fingerprints: ContentFingerprint[] = [
        {
          mediaId: 'test-1',
          perceptualHash: '1010101010101010',
          md5Hash: 'd41d8cd98f00b204e9800998ecf8427e',
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          created: new Date(),
        },
        {
          mediaId: 'test-2',
          perceptualHash: '1010101010101011', // 1 bit difference
          md5Hash: '098f6bcd4621d373cade4e832627b4f6',
          sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          created: new Date(),
        },
      ];

      const duplicates = generator.detectDuplicates(fingerprints, 0.8);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].fingerprints.length).toBe(2);
      expect(duplicates[0].type).toBe('near_duplicate');
    });
  });

  describe('validation', () => {
    it('should validate fingerprint integrity', () => {
      const validFingerprint: ContentFingerprint = {
        mediaId: 'test-1',
        perceptualHash: '1010101010101010',
        md5Hash: 'd41d8cd98f00b204e9800998ecf8427e',
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        created: new Date(),
      };

      const validation = generator.validateFingerprint(validFingerprint);

      expect(validation.isValid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it('should detect invalid fingerprints', () => {
      const invalidFingerprint: ContentFingerprint = {
        mediaId: '',
        perceptualHash: 'invalid-hash',
        md5Hash: 'invalid-md5',
        sha256Hash: 'invalid-sha256',
        created: new Date(),
      };

      const validation = generator.validateFingerprint(invalidFingerprint);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });
});