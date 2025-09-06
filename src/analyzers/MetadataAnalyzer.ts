import { parse } from 'exifr';
import sharp from 'sharp';
import axios from 'axios';
import crypto from 'crypto';
import { MediaFile, MetadataInfo, ManipulationIndicator } from '../types';

export class MetadataAnalyzer {
  private manipulationThreshold: number;

  constructor(config: { manipulationThreshold?: number } = {}) {
    this.manipulationThreshold = config.manipulationThreshold || 0.7;
  }

  /**
   * Analyzes metadata for a media file
   */
  async analyzeMetadata(mediaFile: MediaFile): Promise<MetadataInfo> {
    try {
      // Download the file for analysis
      const fileBuffer = await this.downloadFile(mediaFile.url);
      
      // Extract EXIF data
      const exifData = await this.extractExifData(fileBuffer);
      
      // Get file information
      const fileInfo = await this.getFileInfo(fileBuffer, mediaFile);
      
      // Detect manipulation indicators
      const manipulationIndicators = await this.detectManipulation(fileBuffer, exifData);
      
      // Calculate authenticity score
      const authenticityScore = this.calculateAuthenticityScore(manipulationIndicators);
      
      return {
        exif: exifData,
        fileInfo,
        manipulationIndicators,
        authenticityScore,
      };
    } catch (error) {
      throw new Error(`Metadata analysis failed: ${error}`);
    }
  }

  /**
   * Downloads file from URL
   */
  private async downloadFile(url: string): Promise<Buffer> {
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
      throw new Error(`Failed to download file: ${error}`);
    }
  }

  /**
   * Extracts EXIF data from image buffer
   */
  private async extractExifData(buffer: Buffer): Promise<Record<string, any>> {
    try {
      const exifData = await parse(buffer, {
        pick: [
          'Make', 'Model', 'Software', 'DateTime', 'DateTimeOriginal', 'DateTimeDigitized',
          'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSDateStamp', 'GPSTimeStamp',
          'ExposureTime', 'FNumber', 'ISO', 'FocalLength', 'Flash', 'WhiteBalance',
          'ColorSpace', 'XResolution', 'YResolution', 'ResolutionUnit',
          'Orientation', 'ImageWidth', 'ImageHeight', 'BitsPerSample',
          'Compression', 'PhotometricInterpretation', 'SamplesPerPixel',
          'PlanarConfiguration', 'YCbCrSubSampling', 'YCbCrPositioning',
          'ReferenceBlackWhite', 'StripOffsets', 'RowsPerStrip', 'StripByteCounts',
          'JPEGInterchangeFormat', 'JPEGInterchangeFormatLength',
          'TransferFunction', 'WhitePoint', 'PrimaryChromaticities',
          'ColorMatrixCoefficients', 'ReferenceBlackWhite', 'YCbCrCoefficients',
          'YCbCrSubSampling', 'YCbCrPositioning', 'ReferenceBlackWhite',
          'Copyright', 'Artist', 'ImageDescription', 'UserComment'
        ],
        translateKeys: true,
        translateValues: true,
        reviveValues: true,
        sanitize: true,
        mergeOutput: true,
      });

      return exifData || {};
    } catch (error) {
      console.warn('EXIF extraction failed:', error);
      return {};
    }
  }

  /**
   * Gets basic file information
   */
  private async getFileInfo(buffer: Buffer, mediaFile: MediaFile): Promise<MetadataInfo['fileInfo']> {
    const stats = await sharp(buffer).metadata();
    
    return {
      size: buffer.length,
      mimeType: stats.format ? `image/${stats.format}` : mediaFile.mimeType || 'unknown',
      lastModified: new Date(), // We can't get this from the buffer
      created: new Date(), // We can't get this from the buffer
    };
  }

  /**
   * Detects potential manipulation indicators
   */
  private async detectManipulation(buffer: Buffer, exifData: Record<string, any>): Promise<ManipulationIndicator[]> {
    const indicators: ManipulationIndicator[] = [];

    // Check for EXIF inconsistencies
    indicators.push(...this.checkExifInconsistencies(exifData));

    // Check for compression artifacts
    indicators.push(...await this.checkCompressionArtifacts(buffer));

    // Check for metadata tampering
    indicators.push(...this.checkMetadataTampering(exifData));

    // Check for clone detection (basic implementation)
    indicators.push(...await this.checkCloneDetection(buffer));

    return indicators;
  }

  /**
   * Checks for EXIF data inconsistencies
   */
  private checkExifInconsistencies(exifData: Record<string, any>): ManipulationIndicator[] {
    const indicators: ManipulationIndicator[] = [];

    // Check for inconsistent timestamps
    const dateTime = exifData.dateTime;
    const dateTimeOriginal = exifData.dateTimeOriginal;
    const dateTimeDigitized = exifData.dateTimeDigitized;

    if (dateTime && dateTimeOriginal && dateTime !== dateTimeOriginal) {
      indicators.push({
        type: 'exif_inconsistency',
        severity: 'medium',
        description: 'Inconsistent DateTime and DateTimeOriginal values',
        confidence: 0.8,
        evidence: { dateTime, dateTimeOriginal },
      });
    }

    // Check for impossible GPS coordinates
    if (exifData.gpsLatitude && exifData.gpsLongitude) {
      const lat = exifData.gpsLatitude;
      const lon = exifData.gpsLongitude;
      
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        indicators.push({
          type: 'exif_inconsistency',
          severity: 'high',
          description: 'Invalid GPS coordinates',
          confidence: 0.9,
          evidence: { latitude: lat, longitude: lon },
        });
      }
    }

    // Check for missing essential camera data
    if (!exifData.make || !exifData.model) {
      indicators.push({
        type: 'exif_inconsistency',
        severity: 'low',
        description: 'Missing camera make/model information',
        confidence: 0.6,
        evidence: { make: exifData.make, model: exifData.model },
      });
    }

    return indicators;
  }

  /**
   * Checks for compression artifacts that might indicate manipulation
   */
  private async checkCompressionArtifacts(buffer: Buffer): Promise<ManipulationIndicator[]> {
    const indicators: ManipulationIndicator[] = [];

    try {
      const metadata = await sharp(buffer).metadata();
      
      // Check for multiple compression levels (might indicate re-saving)
      if (metadata.format === 'jpeg') {
        // This is a simplified check - in practice, you'd need more sophisticated analysis
        const quality = this.estimateJpegQuality(buffer);
        
        if (quality < 80) {
          indicators.push({
            type: 'compression_artifacts',
            severity: 'low',
            description: 'Low JPEG quality detected, possible re-compression',
            confidence: 0.6,
            evidence: { estimatedQuality: quality },
          });
        }
      }

      // Check for unusual dimensions
      if (metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        
        // Check for very unusual aspect ratios
        if (aspectRatio > 10 || aspectRatio < 0.1) {
          indicators.push({
            type: 'compression_artifacts',
            severity: 'medium',
            description: 'Unusual aspect ratio detected',
            confidence: 0.7,
            evidence: { width: metadata.width, height: metadata.height, aspectRatio },
          });
        }
      }
    } catch (error) {
      console.warn('Compression artifact detection failed:', error);
    }

    return indicators;
  }

  /**
   * Checks for metadata tampering
   */
  private checkMetadataTampering(exifData: Record<string, any>): ManipulationIndicator[] {
    const indicators: ManipulationIndicator[] = [];

    // Check for suspicious software entries
    if (exifData.software) {
      const software = exifData.software.toLowerCase();
      
      // List of known photo editing software
      const editingSoftware = [
        'photoshop', 'gimp', 'paint.net', 'paint shop pro', 'corel', 'affinity',
        'lightroom', 'capture one', 'dxo', 'topaz', 'luminar', 'skylum'
      ];

      if (editingSoftware.some(sw => software.includes(sw))) {
        indicators.push({
          type: 'metadata_tampering',
          severity: 'medium',
          description: 'Image editing software detected in metadata',
          confidence: 0.8,
          evidence: { software: exifData.software },
        });
      }
    }

    // Check for missing or suspicious copyright information
    if (!exifData.copyright && !exifData.artist) {
      indicators.push({
        type: 'metadata_tampering',
        severity: 'low',
        description: 'Missing copyright and artist information',
        confidence: 0.5,
        evidence: { copyright: exifData.copyright, artist: exifData.artist },
      });
    }

    return indicators;
  }

  /**
   * Basic clone detection (simplified implementation)
   */
  private async checkCloneDetection(buffer: Buffer): Promise<ManipulationIndicator[]> {
    const indicators: ManipulationIndicator[] = [];

    try {
      // This is a very basic implementation
      // In practice, you'd use more sophisticated algorithms like SIFT, SURF, or deep learning
      
      // Generate a simple hash of the image content
      const hash = crypto.createHash('md5').update(buffer).digest('hex');
      
      // Check for repeated patterns (simplified)
      const image = sharp(buffer);
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
      
      // Simple pattern detection (this is very basic)
      const patternCount = this.detectRepeatedPatterns(data, info.width, info.height);
      
      if (patternCount > 10) { // Arbitrary threshold
        indicators.push({
          type: 'clone_detection',
          severity: 'medium',
          description: 'Repeated patterns detected, possible cloning',
          confidence: 0.6,
          evidence: { patternCount, hash },
        });
      }
    } catch (error) {
      console.warn('Clone detection failed:', error);
    }

    return indicators;
  }

  /**
   * Estimates JPEG quality (simplified)
   */
  private estimateJpegQuality(buffer: Buffer): number {
    // This is a very simplified quality estimation
    // In practice, you'd use more sophisticated methods
    try {
      const metadata = sharp(buffer).metadata();
      return metadata.quality || 85; // Default assumption
    } catch {
      return 85;
    }
  }

  /**
   * Detects repeated patterns in image data (simplified)
   */
  private detectRepeatedPatterns(data: Buffer, width: number, height: number): number {
    // This is a very basic pattern detection
    // In practice, you'd use more sophisticated computer vision algorithms
    let patternCount = 0;
    const blockSize = 8;
    
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        // Simple block comparison (very basic)
        const block1 = this.getBlock(data, x, y, blockSize, width);
        
        for (let y2 = y + blockSize; y2 < height - blockSize; y2 += blockSize) {
          for (let x2 = x + blockSize; x2 < width - blockSize; x2 += blockSize) {
            const block2 = this.getBlock(data, x2, y2, blockSize, width);
            
            if (this.blocksSimilar(block1, block2)) {
              patternCount++;
            }
          }
        }
      }
    }
    
    return patternCount;
  }

  /**
   * Gets a block of pixels from image data
   */
  private getBlock(data: Buffer, x: number, y: number, size: number, width: number): Buffer {
    const block = Buffer.alloc(size * size * 3); // Assuming RGB
    let offset = 0;
    
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const pixelIndex = ((y + dy) * width + (x + dx)) * 3;
        if (pixelIndex < data.length - 2) {
          block[offset++] = data[pixelIndex];
          block[offset++] = data[pixelIndex + 1];
          block[offset++] = data[pixelIndex + 2];
        }
      }
    }
    
    return block;
  }

  /**
   * Checks if two blocks are similar
   */
  private blocksSimilar(block1: Buffer, block2: Buffer): boolean {
    if (block1.length !== block2.length) return false;
    
    let differences = 0;
    const threshold = block1.length * 0.1; // 10% difference threshold
    
    for (let i = 0; i < block1.length; i++) {
      if (Math.abs(block1[i] - block2[i]) > 10) { // Color difference threshold
        differences++;
      }
    }
    
    return differences < threshold;
  }

  /**
   * Calculates overall authenticity score
   */
  private calculateAuthenticityScore(indicators: ManipulationIndicator[]): number {
    if (indicators.length === 0) return 1.0;

    let totalScore = 1.0;
    
    for (const indicator of indicators) {
      const severityWeight = {
        low: 0.1,
        medium: 0.3,
        high: 0.6,
        critical: 0.9,
      };
      
      const weight = severityWeight[indicator.severity];
      const impact = weight * indicator.confidence;
      totalScore -= impact;
    }
    
    return Math.max(0, totalScore);
  }

  /**
   * Validates EXIF data integrity
   */
  validateExifIntegrity(exifData: Record<string, any>): boolean {
    // Check for basic EXIF structure integrity
    const requiredFields = ['make', 'model', 'dateTime'];
    const hasRequiredFields = requiredFields.some(field => exifData[field]);
    
    // Check for reasonable values
    const hasReasonableValues = this.checkReasonableValues(exifData);
    
    return hasRequiredFields && hasReasonableValues;
  }

  /**
   * Checks if EXIF values are reasonable
   */
  private checkReasonableValues(exifData: Record<string, any>): boolean {
    // Check date values
    if (exifData.dateTime) {
      const date = new Date(exifData.dateTime);
      const now = new Date();
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      if (date > now || date < yearAgo) {
        return false;
      }
    }
    
    // Check GPS coordinates
    if (exifData.gpsLatitude && exifData.gpsLongitude) {
      const lat = exifData.gpsLatitude;
      const lon = exifData.gpsLongitude;
      
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return false;
      }
    }
    
    return true;
  }
}