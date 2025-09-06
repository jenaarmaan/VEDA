import crypto from 'crypto';
import sharp from 'sharp';
import axios from 'axios';
import { MediaFile, ContentFingerprint } from '../types';

export class FingerprintGenerator {
  /**
   * Generates comprehensive fingerprints for a media file
   */
  async generateFingerprint(mediaFile: MediaFile): Promise<ContentFingerprint> {
    try {
      // Download the file for processing
      const fileBuffer = await this.downloadFile(mediaFile.url);
      
      // Generate different types of hashes
      const md5Hash = this.generateMD5Hash(fileBuffer);
      const sha256Hash = this.generateSHA256Hash(fileBuffer);
      
      // Generate perceptual hashes for images
      let perceptualHash = '';
      let dhash = '';
      let phash = '';
      let averageHash = '';
      
      if (mediaFile.type === 'image') {
        perceptualHash = await this.generatePerceptualHash(fileBuffer);
        dhash = await this.generateDHash(fileBuffer);
        phash = await this.generatePHash(fileBuffer);
        averageHash = await this.generateAverageHash(fileBuffer);
      }
      
      return {
        mediaId: mediaFile.id,
        perceptualHash,
        md5Hash,
        sha256Hash,
        dhash,
        phash,
        averageHash,
        created: new Date(),
      };
    } catch (error) {
      throw new Error(`Fingerprint generation failed: ${error}`);
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
   * Generates MD5 hash
   */
  private generateMD5Hash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Generates SHA256 hash
   */
  private generateSHA256Hash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generates perceptual hash (simplified implementation)
   */
  private async generatePerceptualHash(buffer: Buffer): Promise<string> {
    try {
      // Resize image to 8x8 for perceptual hashing
      const resized = await sharp(buffer)
        .resize(8, 8, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer();
      
      // Calculate average pixel value
      let sum = 0;
      for (let i = 0; i < resized.length; i++) {
        sum += resized[i];
      }
      const average = sum / resized.length;
      
      // Generate hash based on pixels above/below average
      let hash = '';
      for (let i = 0; i < resized.length; i++) {
        hash += resized[i] > average ? '1' : '0';
      }
      
      return hash;
    } catch (error) {
      console.warn('Perceptual hash generation failed:', error);
      return '';
    }
  }

  /**
   * Generates Difference Hash (dHash)
   */
  private async generateDHash(buffer: Buffer): Promise<string> {
    try {
      // Resize to 9x8 (one extra column for difference calculation)
      const resized = await sharp(buffer)
        .resize(9, 8, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer();
      
      let hash = '';
      
      // Calculate differences between adjacent pixels
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const leftPixel = resized[row * 9 + col];
          const rightPixel = resized[row * 9 + col + 1];
          hash += leftPixel > rightPixel ? '1' : '0';
        }
      }
      
      return hash;
    } catch (error) {
      console.warn('DHash generation failed:', error);
      return '';
    }
  }

  /**
   * Generates Perceptual Hash (pHash) using DCT
   */
  private async generatePHash(buffer: Buffer): Promise<string> {
    try {
      // Resize to 32x32
      const resized = await sharp(buffer)
        .resize(32, 32, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer();
      
      // Convert to 2D array
      const pixels: number[][] = [];
      for (let row = 0; row < 32; row++) {
        pixels[row] = [];
        for (let col = 0; col < 32; col++) {
          pixels[row][col] = resized[row * 32 + col];
        }
      }
      
      // Apply DCT (simplified implementation)
      const dct = this.applyDCT(pixels);
      
      // Take top-left 8x8 block
      let sum = 0;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          sum += dct[row][col];
        }
      }
      const average = sum / 64;
      
      // Generate hash
      let hash = '';
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          hash += dct[row][col] > average ? '1' : '0';
        }
      }
      
      return hash;
    } catch (error) {
      console.warn('PHash generation failed:', error);
      return '';
    }
  }

  /**
   * Generates Average Hash
   */
  private async generateAverageHash(buffer: Buffer): Promise<string> {
    try {
      // Resize to 8x8
      const resized = await sharp(buffer)
        .resize(8, 8, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer();
      
      // Calculate average
      let sum = 0;
      for (let i = 0; i < resized.length; i++) {
        sum += resized[i];
      }
      const average = sum / resized.length;
      
      // Generate hash
      let hash = '';
      for (let i = 0; i < resized.length; i++) {
        hash += resized[i] > average ? '1' : '0';
      }
      
      return hash;
    } catch (error) {
      console.warn('Average hash generation failed:', error);
      return '';
    }
  }

  /**
   * Simplified DCT implementation
   */
  private applyDCT(pixels: number[][]): number[][] {
    const N = pixels.length;
    const dct: number[][] = [];
    
    for (let u = 0; u < N; u++) {
      dct[u] = [];
      for (let v = 0; v < N; v++) {
        let sum = 0;
        
        for (let x = 0; x < N; x++) {
          for (let y = 0; y < N; y++) {
            const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
            const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
            
            sum += cu * cv * pixels[x][y] * 
                   Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)) *
                   Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
          }
        }
        
        dct[u][v] = (2 / N) * sum;
      }
    }
    
    return dct;
  }

  /**
   * Compares two fingerprints for similarity
   */
  compareFingerprints(fingerprint1: ContentFingerprint, fingerprint2: ContentFingerprint): {
    exactMatch: boolean;
    similarity: number;
    hashMatches: {
      md5: boolean;
      sha256: boolean;
      perceptual: number;
      dhash: number;
      phash: number;
      averageHash: number;
    };
  } {
    const hashMatches = {
      md5: fingerprint1.md5Hash === fingerprint2.md5Hash,
      sha256: fingerprint1.sha256Hash === fingerprint2.sha256Hash,
      perceptual: this.calculateHammingDistance(fingerprint1.perceptualHash, fingerprint2.perceptualHash),
      dhash: this.calculateHammingDistance(fingerprint1.dhash, fingerprint2.dhash),
      phash: this.calculateHammingDistance(fingerprint1.phash, fingerprint2.phash),
      averageHash: this.calculateHammingDistance(fingerprint1.averageHash, fingerprint2.averageHash),
    };

    // Calculate overall similarity
    let similarity = 0;
    let totalComparisons = 0;

    if (hashMatches.md5) similarity += 1;
    totalComparisons++;

    if (hashMatches.sha256) similarity += 1;
    totalComparisons++;

    if (fingerprint1.perceptualHash && fingerprint2.perceptualHash) {
      similarity += 1 - (hashMatches.perceptual / 64); // 64-bit hash
      totalComparisons++;
    }

    if (fingerprint1.dhash && fingerprint2.dhash) {
      similarity += 1 - (hashMatches.dhash / 64); // 64-bit hash
      totalComparisons++;
    }

    if (fingerprint1.phash && fingerprint2.phash) {
      similarity += 1 - (hashMatches.phash / 64); // 64-bit hash
      totalComparisons++;
    }

    if (fingerprint1.averageHash && fingerprint2.averageHash) {
      similarity += 1 - (hashMatches.averageHash / 64); // 64-bit hash
      totalComparisons++;
    }

    const overallSimilarity = totalComparisons > 0 ? similarity / totalComparisons : 0;

    return {
      exactMatch: hashMatches.md5 && hashMatches.sha256,
      similarity: overallSimilarity,
      hashMatches,
    };
  }

  /**
   * Calculates Hamming distance between two binary strings
   */
  private calculateHammingDistance(hash1: string, hash2: string): number {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) {
      return hash1.length || hash2.length; // Return max length if different
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        distance++;
      }
    }

    return distance;
  }

  /**
   * Detects duplicate content based on fingerprints
   */
  detectDuplicates(
    fingerprints: ContentFingerprint[],
    threshold: number = 0.8
  ): Array<{
    fingerprints: ContentFingerprint[];
    similarity: number;
    type: 'exact' | 'near_duplicate' | 'similar';
  }> {
    const duplicates: Array<{
      fingerprints: ContentFingerprint[];
      similarity: number;
      type: 'exact' | 'near_duplicate' | 'similar';
    }> = [];

    const processed = new Set<string>();

    for (let i = 0; i < fingerprints.length; i++) {
      if (processed.has(fingerprints[i].mediaId)) continue;

      const group = [fingerprints[i]];
      processed.add(fingerprints[i].mediaId);

      for (let j = i + 1; j < fingerprints.length; j++) {
        if (processed.has(fingerprints[j].mediaId)) continue;

        const comparison = this.compareFingerprints(fingerprints[i], fingerprints[j]);
        
        if (comparison.similarity >= threshold) {
          group.push(fingerprints[j]);
          processed.add(fingerprints[j].mediaId);
        }
      }

      if (group.length > 1) {
        // Determine type based on similarity
        let type: 'exact' | 'near_duplicate' | 'similar' = 'similar';
        if (group.length === 2) {
          const comparison = this.compareFingerprints(group[0], group[1]);
          if (comparison.exactMatch) {
            type = 'exact';
          } else if (comparison.similarity > 0.95) {
            type = 'near_duplicate';
          }
        }

        duplicates.push({
          fingerprints: group,
          similarity: this.calculateGroupSimilarity(group),
          type,
        });
      }
    }

    return duplicates;
  }

  /**
   * Calculates average similarity within a group
   */
  private calculateGroupSimilarity(fingerprints: ContentFingerprint[]): number {
    if (fingerprints.length < 2) return 1.0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < fingerprints.length; i++) {
      for (let j = i + 1; j < fingerprints.length; j++) {
        const comparison = this.compareFingerprints(fingerprints[i], fingerprints[j]);
        totalSimilarity += comparison.similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Validates fingerprint integrity
   */
  validateFingerprint(fingerprint: ContentFingerprint): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check required fields
    if (!fingerprint.mediaId) {
      issues.push('Missing media ID');
    }

    if (!fingerprint.md5Hash) {
      issues.push('Missing MD5 hash');
    }

    if (!fingerprint.sha256Hash) {
      issues.push('Missing SHA256 hash');
    }

    // Validate hash formats
    if (fingerprint.md5Hash && !/^[a-f0-9]{32}$/i.test(fingerprint.md5Hash)) {
      issues.push('Invalid MD5 hash format');
    }

    if (fingerprint.sha256Hash && !/^[a-f0-9]{64}$/i.test(fingerprint.sha256Hash)) {
      issues.push('Invalid SHA256 hash format');
    }

    // Validate perceptual hashes
    if (fingerprint.perceptualHash && !/^[01]+$/.test(fingerprint.perceptualHash)) {
      issues.push('Invalid perceptual hash format');
    }

    if (fingerprint.dhash && !/^[01]+$/.test(fingerprint.dhash)) {
      issues.push('Invalid dHash format');
    }

    if (fingerprint.phash && !/^[01]+$/.test(fingerprint.phash)) {
      issues.push('Invalid pHash format');
    }

    if (fingerprint.averageHash && !/^[01]+$/.test(fingerprint.averageHash)) {
      issues.push('Invalid average hash format');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Generates fingerprint summary
   */
  generateFingerprintSummary(fingerprint: ContentFingerprint): {
    mediaId: string;
    hasPerceptualHashes: boolean;
    hashTypes: string[];
    created: string;
  } {
    const hashTypes: string[] = ['md5', 'sha256'];
    
    if (fingerprint.perceptualHash) hashTypes.push('perceptual');
    if (fingerprint.dhash) hashTypes.push('dhash');
    if (fingerprint.phash) hashTypes.push('phash');
    if (fingerprint.averageHash) hashTypes.push('averageHash');

    return {
      mediaId: fingerprint.mediaId,
      hasPerceptualHashes: hashTypes.length > 2,
      hashTypes,
      created: fingerprint.created.toISOString(),
    };
  }
}