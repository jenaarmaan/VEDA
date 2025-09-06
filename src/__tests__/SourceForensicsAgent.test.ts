import { SourceForensicsAgent } from '../agents/SourceForensicsAgent';
import { MediaFile, ForensicsConfig } from '../types';

// Mock dependencies
jest.mock('../engines/ReverseSearchEngine');
jest.mock('../analyzers/MetadataAnalyzer');
jest.mock('../trackers/TimelineTracker');
jest.mock('../trackers/ChainOfCustody');
jest.mock('../generators/FingerprintGenerator');

describe('SourceForensicsAgent', () => {
  let agent: SourceForensicsAgent;
  let config: ForensicsConfig;
  let mockMediaFile: MediaFile;

  beforeEach(() => {
    config = {
      enableMetadataAnalysis: true,
      enableReverseSearch: true,
      enableTimelineTracking: true,
      enableChainOfCustody: true,
      enableFingerprinting: true,
      manipulationThreshold: 0.7,
      similarityThreshold: 0.8,
    };

    mockMediaFile = {
      id: 'test-media-1',
      url: 'https://example.com/test-image.jpg',
      type: 'image',
      filename: 'test-image.jpg',
      size: 1024000,
      mimeType: 'image/jpeg',
    };

    agent = new SourceForensicsAgent(config);
  });

  describe('analyzeMedia', () => {
    it('should perform comprehensive analysis', async () => {
      const report = await agent.analyzeMedia(mockMediaFile);

      expect(report).toBeDefined();
      expect(report.mediaId).toBe(mockMediaFile.id);
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.authenticityScore).toBeGreaterThanOrEqual(0);
      expect(report.authenticityScore).toBeLessThanOrEqual(1);
      expect(report.riskAssessment).toBeDefined();
      expect(report.riskAssessment.level).toMatch(/^(low|medium|high|critical)$/);
    });

    it('should handle analysis errors gracefully', async () => {
      // Mock a failing scenario
      const invalidMediaFile = {
        ...mockMediaFile,
        url: 'invalid-url',
      };

      await expect(agent.analyzeMedia(invalidMediaFile)).rejects.toThrow();
    });
  });

  describe('quickAnalysis', () => {
    it('should perform quick analysis', async () => {
      const result = await agent.quickAnalysis(mockMediaFile);

      expect(result).toBeDefined();
      expect(result.authenticityScore).toBeGreaterThanOrEqual(0);
      expect(result.authenticityScore).toBeLessThanOrEqual(1);
      expect(result.riskLevel).toMatch(/^(low|medium|high|critical)$/);
      expect(Array.isArray(result.keyFindings)).toBe(true);
    });
  });

  describe('compareMedia', () => {
    it('should compare two media files', async () => {
      const mediaFile2 = {
        ...mockMediaFile,
        id: 'test-media-2',
        url: 'https://example.com/test-image-2.jpg',
      };

      const result = await agent.compareMedia(mockMediaFile, mediaFile2);

      expect(result).toBeDefined();
      expect(result.similarity).toBeGreaterThanOrEqual(0);
      expect(result.similarity).toBeLessThanOrEqual(1);
      expect(result.fingerprintComparison).toBeDefined();
      expect(result.metadataComparison).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('detectDuplicates', () => {
    it('should detect duplicate content', async () => {
      const mediaFiles = [
        mockMediaFile,
        {
          ...mockMediaFile,
          id: 'test-media-2',
          url: 'https://example.com/test-image-2.jpg',
        },
        {
          ...mockMediaFile,
          id: 'test-media-3',
          url: 'https://example.com/test-image-3.jpg',
        },
      ];

      const result = await agent.detectDuplicates(mediaFiles);

      expect(result).toBeDefined();
      expect(Array.isArray(result.duplicates)).toBe(true);
      expect(Array.isArray(result.uniqueFiles)).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        manipulationThreshold: 0.8,
        similarityThreshold: 0.9,
      };

      expect(() => agent.updateConfig(newConfig)).not.toThrow();
    });
  });
});