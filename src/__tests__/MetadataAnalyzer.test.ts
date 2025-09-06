import { MetadataAnalyzer } from '../analyzers/MetadataAnalyzer';
import { MediaFile } from '../types';

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Mock sharp
jest.mock('sharp');
const sharp = require('sharp');

describe('MetadataAnalyzer', () => {
  let analyzer: MetadataAnalyzer;
  let mockMediaFile: MediaFile;

  beforeEach(() => {
    analyzer = new MetadataAnalyzer({ manipulationThreshold: 0.7 });
    
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

    // Mock sharp metadata
    sharp.mockReturnValue({
      metadata: jest.fn().mockResolvedValue({
        format: 'jpeg',
        width: 1920,
        height: 1080,
        size: 1024000,
      }),
      raw: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue({
        data: Buffer.alloc(1920 * 1080 * 3),
        info: { width: 1920, height: 1080 },
      }),
    });
  });

  describe('analyzeMetadata', () => {
    it('should analyze metadata successfully', async () => {
      const result = await analyzer.analyzeMetadata(mockMediaFile);

      expect(result).toBeDefined();
      expect(result.exif).toBeDefined();
      expect(result.fileInfo).toBeDefined();
      expect(result.manipulationIndicators).toBeDefined();
      expect(Array.isArray(result.manipulationIndicators)).toBe(true);
      expect(result.authenticityScore).toBeGreaterThanOrEqual(0);
      expect(result.authenticityScore).toBeLessThanOrEqual(1);
    });

    it('should handle download errors', async () => {
      axios.get.mockRejectedValue(new Error('Download failed'));

      await expect(analyzer.analyzeMetadata(mockMediaFile)).rejects.toThrow();
    });
  });

  describe('manipulation detection', () => {
    it('should detect EXIF inconsistencies', async () => {
      // Mock EXIF data with inconsistencies
      const mockExifData = {
        dateTime: '2023-01-01T10:00:00',
        dateTimeOriginal: '2023-01-01T11:00:00',
        make: 'Canon',
        model: 'EOS R5',
      };

      // Mock exifr.parse to return inconsistent data
      const exifr = require('exifr');
      exifr.parse.mockResolvedValue(mockExifData);

      const result = await analyzer.analyzeMetadata(mockMediaFile);

      expect(result.manipulationIndicators.length).toBeGreaterThan(0);
      expect(result.manipulationIndicators.some(
        ind => ind.type === 'exif_inconsistency'
      )).toBe(true);
    });

    it('should detect metadata tampering', async () => {
      const mockExifData = {
        software: 'Adobe Photoshop 2023',
        make: 'Canon',
        model: 'EOS R5',
      };

      const exifr = require('exifr');
      exifr.parse.mockResolvedValue(mockExifData);

      const result = await analyzer.analyzeMetadata(mockMediaFile);

      expect(result.manipulationIndicators.some(
        ind => ind.type === 'metadata_tampering'
      )).toBe(true);
    });
  });

  describe('authenticity score calculation', () => {
    it('should calculate authenticity score correctly', async () => {
      const result = await analyzer.analyzeMetadata(mockMediaFile);

      expect(result.authenticityScore).toBeGreaterThanOrEqual(0);
      expect(result.authenticityScore).toBeLessThanOrEqual(1);
    });

    it('should lower score for manipulation indicators', async () => {
      const mockExifData = {
        software: 'Adobe Photoshop 2023',
        dateTime: '2023-01-01T10:00:00',
        dateTimeOriginal: '2023-01-01T11:00:00',
      };

      const exifr = require('exifr');
      exifr.parse.mockResolvedValue(mockExifData);

      const result = await analyzer.analyzeMetadata(mockMediaFile);

      expect(result.authenticityScore).toBeLessThan(1.0);
    });
  });

  describe('validation', () => {
    it('should validate EXIF integrity', () => {
      const validExifData = {
        make: 'Canon',
        model: 'EOS R5',
        dateTime: '2023-01-01T10:00:00',
        gpsLatitude: 40.7128,
        gpsLongitude: -74.0060,
      };

      const isValid = analyzer.validateExifIntegrity(validExifData);
      expect(isValid).toBe(true);
    });

    it('should detect invalid EXIF data', () => {
      const invalidExifData = {
        gpsLatitude: 200, // Invalid latitude
        gpsLongitude: -74.0060,
      };

      const isValid = analyzer.validateExifIntegrity(invalidExifData);
      expect(isValid).toBe(false);
    });
  });
});