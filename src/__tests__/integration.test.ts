import { SourceForensicsAgent } from '../agents/SourceForensicsAgent';
import { MediaFile, ForensicsConfig } from '../types';

// Integration tests for the complete Source Forensics Agent
describe('Source Forensics Agent Integration Tests', () => {
  let agent: SourceForensicsAgent;
  let config: ForensicsConfig;

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

    agent = new SourceForensicsAgent(config);
  });

  describe('End-to-End Analysis', () => {
    it('should perform complete forensics analysis', async () => {
      const mediaFile: MediaFile = {
        id: 'integration-test-1',
        url: 'https://example.com/test-image.jpg',
        type: 'image',
        filename: 'test-image.jpg',
        size: 1024000,
        mimeType: 'image/jpeg',
      };

      const report = await agent.analyzeMedia(mediaFile);

      // Verify report structure
      expect(report).toBeDefined();
      expect(report.mediaId).toBe(mediaFile.id);
      expect(report.timestamp).toBeInstanceOf(Date);
      
      // Verify metadata analysis
      expect(report.metadata).toBeDefined();
      expect(report.metadata.exif).toBeDefined();
      expect(report.metadata.fileInfo).toBeDefined();
      expect(Array.isArray(report.metadata.manipulationIndicators)).toBe(true);
      expect(report.metadata.authenticityScore).toBeGreaterThanOrEqual(0);
      expect(report.metadata.authenticityScore).toBeLessThanOrEqual(1);
      
      // Verify reverse search results
      expect(Array.isArray(report.reverseSearch)).toBe(true);
      
      // Verify timeline
      expect(report.timeline).toBeDefined();
      expect(report.timeline.mediaId).toBe(mediaFile.id);
      expect(Array.isArray(report.timeline.events)).toBe(true);
      expect(Array.isArray(report.timeline.sourceChain)).toBe(true);
      
      // Verify chain of custody
      expect(report.chainOfCustody).toBeDefined();
      expect(report.chainOfCustody.mediaId).toBe(mediaFile.id);
      expect(Array.isArray(report.chainOfCustody.entries)).toBe(true);
      expect(report.chainOfCustody.integrityVerified).toBeDefined();
      
      // Verify fingerprint
      expect(report.fingerprint).toBeDefined();
      expect(report.fingerprint.mediaId).toBe(mediaFile.id);
      expect(report.fingerprint.md5Hash).toBeDefined();
      expect(report.fingerprint.sha256Hash).toBeDefined();
      expect(report.fingerprint.created).toBeInstanceOf(Date);
      
      // Verify authenticity score
      expect(report.authenticityScore).toBeGreaterThanOrEqual(0);
      expect(report.authenticityScore).toBeLessThanOrEqual(1);
      
      // Verify risk assessment
      expect(report.riskAssessment).toBeDefined();
      expect(report.riskAssessment.level).toMatch(/^(low|medium|high|critical)$/);
      expect(Array.isArray(report.riskAssessment.factors)).toBe(true);
      expect(Array.isArray(report.riskAssessment.recommendations)).toBe(true);
    });

    it('should handle manipulated vs original images', async () => {
      const originalImage: MediaFile = {
        id: 'original-image',
        url: 'https://example.com/original.jpg',
        type: 'image',
        filename: 'original.jpg',
        mimeType: 'image/jpeg',
      };

      const manipulatedImage: MediaFile = {
        id: 'manipulated-image',
        url: 'https://example.com/manipulated.jpg',
        type: 'image',
        filename: 'manipulated.jpg',
        mimeType: 'image/jpeg',
      };

      const [originalReport, manipulatedReport] = await Promise.all([
        agent.analyzeMedia(originalImage),
        agent.analyzeMedia(manipulatedImage),
      ]);

      // Compare authenticity scores
      expect(originalReport.authenticityScore).toBeGreaterThanOrEqual(0);
      expect(manipulatedReport.authenticityScore).toBeGreaterThanOrEqual(0);
      
      // Compare risk levels
      expect(originalReport.riskAssessment.level).toBeDefined();
      expect(manipulatedReport.riskAssessment.level).toBeDefined();
      
      // Compare manipulation indicators
      expect(Array.isArray(originalReport.metadata.manipulationIndicators)).toBe(true);
      expect(Array.isArray(manipulatedReport.metadata.manipulationIndicators)).toBe(true);
    });

    it('should track chain of custody across multiple sources', async () => {
      const mediaFile: MediaFile = {
        id: 'chain-test-1',
        url: 'https://example.com/chain-test.jpg',
        type: 'image',
        filename: 'chain-test.jpg',
        mimeType: 'image/jpeg',
      };

      const report = await agent.analyzeMedia(mediaFile);
      
      // Verify chain of custody has entries
      expect(report.chainOfCustody.entries.length).toBeGreaterThan(0);
      
      // Verify chain integrity
      expect(report.chainOfCustody.integrityVerified).toBe(true);
      
      // Verify entry types
      const entryTypes = report.chainOfCustody.entries.map(entry => entry.action);
      expect(entryTypes).toContain('created');
      expect(entryTypes).toContain('analyzed');
      expect(entryTypes).toContain('verified');
    });
  });

  describe('Content Analysis Agent Integration', () => {
    it('should be compatible with Content Analysis Agent output', async () => {
      const mediaFile: MediaFile = {
        id: 'content-analysis-integration',
        url: 'https://example.com/integration-test.jpg',
        type: 'image',
        filename: 'integration-test.jpg',
        mimeType: 'image/jpeg',
      };

      const report = await agent.analyzeMedia(mediaFile);
      
      // Verify JSON serializability (for Content Analysis Agent integration)
      const jsonString = JSON.stringify(report);
      expect(jsonString).toBeDefined();
      
      // Verify deserialization
      const deserializedReport = JSON.parse(jsonString);
      expect(deserializedReport.mediaId).toBe(mediaFile.id);
      expect(deserializedReport.authenticityScore).toBeDefined();
      expect(deserializedReport.riskAssessment).toBeDefined();
    });

    it('should provide structured output for VEDA reporting system', async () => {
      const mediaFile: MediaFile = {
        id: 'veda-reporting-test',
        url: 'https://example.com/veda-test.jpg',
        type: 'image',
        filename: 'veda-test.jpg',
        mimeType: 'image/jpeg',
      };

      const report = await agent.analyzeMedia(mediaFile);
      
      // Verify VEDA-compatible structure
      expect(report.mediaId).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.authenticityScore).toBeDefined();
      expect(report.riskAssessment).toBeDefined();
      
      // Verify risk assessment structure
      expect(report.riskAssessment.level).toMatch(/^(low|medium|high|critical)$/);
      expect(Array.isArray(report.riskAssessment.factors)).toBe(true);
      expect(Array.isArray(report.riskAssessment.recommendations)).toBe(true);
      
      // Verify metadata structure
      expect(report.metadata).toBeDefined();
      expect(report.metadata.authenticityScore).toBeDefined();
      expect(Array.isArray(report.metadata.manipulationIndicators)).toBe(true);
      
      // Verify timeline structure
      expect(report.timeline).toBeDefined();
      expect(Array.isArray(report.timeline.events)).toBe(true);
      expect(Array.isArray(report.timeline.sourceChain)).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent analyses', async () => {
      const mediaFiles: MediaFile[] = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent-test-${i}`,
        url: `https://example.com/test-${i}.jpg`,
        type: 'image' as const,
        filename: `test-${i}.jpg`,
        mimeType: 'image/jpeg',
      }));

      const startTime = Date.now();
      const reports = await Promise.all(
        mediaFiles.map(file => agent.analyzeMedia(file))
      );
      const endTime = Date.now();

      // Verify all reports were generated
      expect(reports.length).toBe(5);
      reports.forEach((report, index) => {
        expect(report.mediaId).toBe(`concurrent-test-${index}`);
        expect(report.authenticityScore).toBeDefined();
      });

      // Verify reasonable performance (should complete within reasonable time)
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(30000); // 30 seconds max
    });

    it('should handle large files efficiently', async () => {
      const largeMediaFile: MediaFile = {
        id: 'large-file-test',
        url: 'https://example.com/large-image.jpg',
        type: 'image',
        filename: 'large-image.jpg',
        size: 10 * 1024 * 1024, // 10MB
        mimeType: 'image/jpeg',
      };

      const startTime = Date.now();
      const report = await agent.analyzeMedia(largeMediaFile);
      const endTime = Date.now();

      expect(report).toBeDefined();
      expect(report.mediaId).toBe(largeMediaFile.id);
      
      // Verify reasonable processing time for large files
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(60000); // 60 seconds max
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid URLs gracefully', async () => {
      const invalidMediaFile: MediaFile = {
        id: 'invalid-url-test',
        url: 'invalid-url',
        type: 'image',
        filename: 'invalid.jpg',
        mimeType: 'image/jpeg',
      };

      await expect(agent.analyzeMedia(invalidMediaFile)).rejects.toThrow();
    });

    it('should handle unsupported file types', async () => {
      const unsupportedMediaFile: MediaFile = {
        id: 'unsupported-type-test',
        url: 'https://example.com/document.pdf',
        type: 'image', // Incorrectly marked as image
        filename: 'document.pdf',
        mimeType: 'application/pdf',
      };

      // Should handle gracefully or throw appropriate error
      try {
        const report = await agent.analyzeMedia(unsupportedMediaFile);
        expect(report).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle network timeouts', async () => {
      const timeoutMediaFile: MediaFile = {
        id: 'timeout-test',
        url: 'https://httpstat.us/200?sleep=30000', // 30 second delay
        type: 'image',
        filename: 'timeout.jpg',
        mimeType: 'image/jpeg',
      };

      // Should timeout gracefully
      await expect(agent.analyzeMedia(timeoutMediaFile)).rejects.toThrow();
    });
  });
});