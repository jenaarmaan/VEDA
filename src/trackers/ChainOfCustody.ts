import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { MediaFile, ChainOfCustody, ChainOfCustodyEntry } from '../types';

export class ChainOfCustodyTracker {
  private chains: Map<string, ChainOfCustody> = new Map();

  /**
   * Creates a new chain of custody for a media file
   */
  createChain(mediaFile: MediaFile, initialActor: string): ChainOfCustody {
    const chainId = mediaFile.id;
    
    const chain: ChainOfCustody = {
      mediaId: chainId,
      entries: [],
      integrityVerified: true,
      lastModified: new Date(),
    };

    // Add initial creation entry
    this.addEntry(chain, {
      action: 'created',
      actor: initialActor,
      description: `Initial creation of chain of custody for media file: ${mediaFile.filename || mediaFile.url}`,
      evidence: {
        mediaFile,
        timestamp: new Date(),
        systemInfo: this.getSystemInfo(),
      },
    });

    this.chains.set(chainId, chain);
    return chain;
  }

  /**
   * Adds an entry to the chain of custody
   */
  addEntry(
    chain: ChainOfCustody,
    entryData: {
      action: ChainOfCustodyEntry['action'];
      actor: string;
      description: string;
      evidence: any;
    }
  ): ChainOfCustodyEntry {
    const entry: ChainOfCustodyEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      action: entryData.action,
      actor: entryData.actor,
      description: entryData.description,
      evidence: entryData.evidence,
      hash: this.calculateEntryHash(entryData),
    };

    chain.entries.push(entry);
    chain.lastModified = new Date();
    
    // Verify chain integrity after adding entry
    chain.integrityVerified = this.verifyChainIntegrity(chain);

    return entry;
  }

  /**
   * Transfers custody to a new actor
   */
  transferCustody(
    chain: ChainOfCustody,
    fromActor: string,
    toActor: string,
    reason: string
  ): ChainOfCustodyEntry {
    return this.addEntry(chain, {
      action: 'transferred',
      actor: toActor,
      description: `Custody transferred from ${fromActor} to ${toActor}. Reason: ${reason}`,
      evidence: {
        fromActor,
        toActor,
        reason,
        transferTimestamp: new Date(),
        systemInfo: this.getSystemInfo(),
      },
    });
  }

  /**
   * Records an analysis action
   */
  recordAnalysis(
    chain: ChainOfCustody,
    actor: string,
    analysisType: string,
    results: any
  ): ChainOfCustodyEntry {
    return this.addEntry(chain, {
      action: 'analyzed',
      actor,
      description: `Performed ${analysisType} analysis`,
      evidence: {
        analysisType,
        results,
        analysisTimestamp: new Date(),
        systemInfo: this.getSystemInfo(),
      },
    });
  }

  /**
   * Records a verification action
   */
  recordVerification(
    chain: ChainOfCustody,
    actor: string,
    verificationType: string,
    result: boolean,
    details: string
  ): ChainOfCustodyEntry {
    return this.addEntry(chain, {
      action: 'verified',
      actor,
      description: `Performed ${verificationType} verification: ${result ? 'PASSED' : 'FAILED'}`,
      evidence: {
        verificationType,
        result,
        details,
        verificationTimestamp: new Date(),
        systemInfo: this.getSystemInfo(),
      },
    });
  }

  /**
   * Records a modification action
   */
  recordModification(
    chain: ChainOfCustody,
    actor: string,
    modificationType: string,
    beforeState: any,
    afterState: any
  ): ChainOfCustodyEntry {
    return this.addEntry(chain, {
      action: 'modified',
      actor,
      description: `Modified ${modificationType}`,
      evidence: {
        modificationType,
        beforeState,
        afterState,
        modificationTimestamp: new Date(),
        systemInfo: this.getSystemInfo(),
      },
    });
  }

  /**
   * Gets chain of custody by media ID
   */
  getChain(mediaId: string): ChainOfCustody | undefined {
    return this.chains.get(mediaId);
  }

  /**
   * Gets all chains
   */
  getAllChains(): ChainOfCustody[] {
    return Array.from(this.chains.values());
  }

  /**
   * Calculates hash for an entry
   */
  private calculateEntryHash(entryData: any): string {
    const hashInput = JSON.stringify({
      timestamp: entryData.timestamp || new Date(),
      action: entryData.action,
      actor: entryData.actor,
      description: entryData.description,
      evidence: entryData.evidence,
    });
    
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Verifies chain integrity
   */
  private verifyChainIntegrity(chain: ChainOfCustody): boolean {
    try {
      // Check if all entries have valid hashes
      for (const entry of chain.entries) {
        if (!entry.hash) {
          return false;
        }
        
        // Verify entry hash
        const expectedHash = this.calculateEntryHash(entry);
        if (entry.hash !== expectedHash) {
          return false;
        }
      }
      
      // Check chronological order
      for (let i = 1; i < chain.entries.length; i++) {
        if (chain.entries[i].timestamp < chain.entries[i - 1].timestamp) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Chain integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Gets system information for evidence
   */
  private getSystemInfo(): any {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Generates chain integrity report
   */
  generateIntegrityReport(chain: ChainOfCustody): {
    isValid: boolean;
    totalEntries: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check chain integrity
    if (!chain.integrityVerified) {
      issues.push('Chain integrity verification failed');
      recommendations.push('Review chain entries for tampering or corruption');
    }
    
    // Check for missing entries
    if (chain.entries.length === 0) {
      issues.push('No entries in chain of custody');
      recommendations.push('Add initial creation entry');
    }
    
    // Check for gaps in custody
    const custodyGaps = this.detectCustodyGaps(chain);
    if (custodyGaps.length > 0) {
      issues.push(`Custody gaps detected: ${custodyGaps.join(', ')}`);
      recommendations.push('Document all custody transfers and access events');
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = this.detectSuspiciousPatterns(chain);
    if (suspiciousPatterns.length > 0) {
      issues.push(`Suspicious patterns detected: ${suspiciousPatterns.join(', ')}`);
      recommendations.push('Review chain entries for unusual activity');
    }
    
    return {
      isValid: issues.length === 0,
      totalEntries: chain.entries.length,
      issues,
      recommendations,
    };
  }

  /**
   * Detects gaps in custody
   */
  private detectCustodyGaps(chain: ChainOfCustody): string[] {
    const gaps: string[] = [];
    
    // Check for long periods without entries
    for (let i = 1; i < chain.entries.length; i++) {
      const timeDiff = chain.entries[i].timestamp.getTime() - chain.entries[i - 1].timestamp.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff > 24) { // More than 24 hours
        gaps.push(`Gap of ${Math.round(hoursDiff)} hours between entries`);
      }
    }
    
    return gaps;
  }

  /**
   * Detects suspicious patterns in chain
   */
  private detectSuspiciousPatterns(chain: ChainOfCustody): string[] {
    const patterns: string[] = [];
    
    // Check for rapid successive modifications
    const modifications = chain.entries.filter(entry => entry.action === 'modified');
    for (let i = 1; i < modifications.length; i++) {
      const timeDiff = modifications[i].timestamp.getTime() - modifications[i - 1].timestamp.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      if (minutesDiff < 5) { // Less than 5 minutes
        patterns.push('Rapid successive modifications detected');
        break;
      }
    }
    
    // Check for unusual actor patterns
    const actors = new Set(chain.entries.map(entry => entry.actor));
    if (actors.size > 10) {
      patterns.push('Unusually high number of different actors');
    }
    
    // Check for missing verification entries
    const verifications = chain.entries.filter(entry => entry.action === 'verified');
    if (verifications.length === 0 && chain.entries.length > 5) {
      patterns.push('No verification entries found despite multiple operations');
    }
    
    return patterns;
  }

  /**
   * Exports chain to JSON format
   */
  exportChain(chain: ChainOfCustody): string {
    return JSON.stringify(chain, null, 2);
  }

  /**
   * Imports chain from JSON format
   */
  importChain(jsonData: string): ChainOfCustody {
    try {
      const chain = JSON.parse(jsonData) as ChainOfCustody;
      
      // Convert timestamp strings back to Date objects
      chain.entries.forEach(entry => {
        entry.timestamp = new Date(entry.timestamp);
      });
      chain.lastModified = new Date(chain.lastModified);
      
      // Verify imported chain
      chain.integrityVerified = this.verifyChainIntegrity(chain);
      
      this.chains.set(chain.mediaId, chain);
      return chain;
    } catch (error) {
      throw new Error(`Failed to import chain: ${error}`);
    }
  }

  /**
   * Generates audit trail for compliance
   */
  generateAuditTrail(chain: ChainOfCustody): {
    mediaId: string;
    totalEntries: number;
    timeSpan: string;
    actors: string[];
    actions: string[];
    integrityStatus: string;
    lastModified: string;
  } {
    const actors = [...new Set(chain.entries.map(entry => entry.actor))];
    const actions = [...new Set(chain.entries.map(entry => entry.action))];
    
    let timeSpan = 'Unknown';
    if (chain.entries.length > 0) {
      const firstEntry = chain.entries[0];
      const lastEntry = chain.entries[chain.entries.length - 1];
      const diff = lastEntry.timestamp.getTime() - firstEntry.timestamp.getTime();
      const daysDiff = diff / (1000 * 60 * 60 * 24);
      timeSpan = `${daysDiff.toFixed(1)} days`;
    }
    
    return {
      mediaId: chain.mediaId,
      totalEntries: chain.entries.length,
      timeSpan,
      actors,
      actions,
      integrityStatus: chain.integrityVerified ? 'VERIFIED' : 'COMPROMISED',
      lastModified: chain.lastModified.toISOString(),
    };
  }

  /**
   * Searches entries by criteria
   */
  searchEntries(
    chain: ChainOfCustody,
    criteria: {
      action?: string;
      actor?: string;
      dateRange?: { start: Date; end: Date };
      keyword?: string;
    }
  ): ChainOfCustodyEntry[] {
    return chain.entries.filter(entry => {
      if (criteria.action && entry.action !== criteria.action) {
        return false;
      }
      
      if (criteria.actor && entry.actor !== criteria.actor) {
        return false;
      }
      
      if (criteria.dateRange) {
        if (entry.timestamp < criteria.dateRange.start || entry.timestamp > criteria.dateRange.end) {
          return false;
        }
      }
      
      if (criteria.keyword) {
        const searchText = `${entry.description} ${JSON.stringify(entry.evidence)}`.toLowerCase();
        if (!searchText.includes(criteria.keyword.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Cleans up old chains (for maintenance)
   */
  cleanupOldChains(maxAge: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);
    
    let cleanedCount = 0;
    
    for (const [mediaId, chain] of this.chains.entries()) {
      if (chain.lastModified < cutoffDate) {
        this.chains.delete(mediaId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
}