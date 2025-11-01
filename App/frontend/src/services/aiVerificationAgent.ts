// src/services/aiVerificationAgent.ts

export interface AnomalyReport {
  userId: string;
  epicNumber: string; // masked for privacy
  anomalyType: 'registration' | 'voting' | 'behavioral';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  indicators: Array<{
    type: string;
    confidence: number;
    evidence: string;
  }>;
  recommendedAction: 'allow' | 'flag' | 'block' | 'manual_review';
  timestamp: Date;
  autoBlocked: boolean;
}

interface RegistrationData {
  epicNumber: string;
  timestamp: number;
  ipAddress: string;
  completionTime: number; // in seconds
  location?: { lat: number; lon: number };
}

interface VotingData {
  epicNumber: string;
  timestamp: number;
  ipAddress: string;
  sessionDuration: number;
}

// In-memory stores (in production, use server-side database)
const registrationStore: RegistrationData[] = [];
const votingStore: VotingData[] = [];
const blockedUsers = new Set<string>();

export class AIVerificationAgent {
  
  // Monitor registration for anomalies
  static async analyzeRegistration(data: RegistrationData): Promise<AnomalyReport> {
    const indicators: AnomalyReport['indicators'] = [];
    let riskScore = 0;

    // 1. Check for bulk registration patterns
    const bulkPattern = this.detectBulkRegistration(data);
    if (bulkPattern.detected) {
      indicators.push({
        type: 'bulk_registration',
        confidence: bulkPattern.confidence,
        evidence: bulkPattern.evidence
      });
      riskScore += 30;
    }

    // 2. Check registration speed (too fast = automated)
    if (data.completionTime < 60) { // Less than 1 minute
      indicators.push({
        type: 'suspicious_speed',
        confidence: 0.8,
        evidence: `Registration completed in ${data.completionTime}s (expected: >180s)`
      });
      riskScore += 25;
    }

    // 3. Geographic anomaly detection
    const geoAnomaly = this.detectGeographicAnomaly(data);
    if (geoAnomaly.detected) {
      indicators.push({
        type: 'geographic_anomaly',
        confidence: geoAnomaly.confidence,
        evidence: geoAnomaly.evidence
      });
      riskScore += 20;
    }

    // Store registration data
    registrationStore.push(data);

    return this.createReport(
      data.epicNumber,
      'registration',
      riskScore,
      indicators
    );
  }

  // Monitor voting session for anomalies
  static async analyzeVotingSession(data: VotingData): Promise<AnomalyReport> {
    const indicators: AnomalyReport['indicators'] = [];
    let riskScore = 0;

    // 1. Check for IP clustering
    const ipCluster = this.detectIPClustering(data);
    if (ipCluster.detected) {
      indicators.push({
        type: 'ip_clustering',
        confidence: ipCluster.confidence,
        evidence: ipCluster.evidence
      });
      riskScore += 35;
    }

    // 2. Temporal pattern analysis
    const temporalAnomaly = this.detectTemporalAnomaly(data);
    if (temporalAnomaly.detected) {
      indicators.push({
        type: 'temporal_anomaly',
        confidence: temporalAnomaly.confidence,
        evidence: temporalAnomaly.evidence
      });
      riskScore += 25;
    }

    // 3. Session hijacking detection
    if (data.sessionDuration < 30) { // Less than 30 seconds
      indicators.push({
        type: 'suspicious_session',
        confidence: 0.75,
        evidence: `Unusually short voting session: ${data.sessionDuration}s`
      });
      riskScore += 20;
    }

    // Store voting data
    votingStore.push(data);

    return this.createReport(
      data.epicNumber,
      'voting',
      riskScore,
      indicators
    );
  }

  // Detect bulk registration from same source
  private static detectBulkRegistration(data: RegistrationData): {
    detected: boolean;
    confidence: number;
    evidence: string;
  } {
    const now = Date.now();
    const timeWindow = 3600000; // 1 hour
    
    // Count registrations from same IP in last hour
    const sameIPCount = registrationStore.filter(
      r => r.ipAddress === data.ipAddress && 
           now - r.timestamp < timeWindow
    ).length;

    // Check for sequential EPIC numbers
    const recentEPICs = registrationStore
      .filter(r => now - r.timestamp < timeWindow)
      .map(r => r.epicNumber)
      .sort();

    let sequentialCount = 0;
    for (let i = 1; i < recentEPICs.length; i++) {
      if (this.areEPICsSequential(recentEPICs[i-1], recentEPICs[i])) {
        sequentialCount++;
      }
    }

    const detected = sameIPCount > 5 || sequentialCount > 3;
    const confidence = detected ? Math.min((sameIPCount / 10) + (sequentialCount / 5), 1) : 0;

    return {
      detected,
      confidence,
      evidence: detected 
        ? `${sameIPCount} registrations from same IP, ${sequentialCount} sequential EPICs`
        : ''
    };
  }

  // Check if EPIC numbers are sequential
  private static areEPICsSequential(epic1: string, epic2: string): boolean {
    const num1 = parseInt(epic1.replace(/\D/g, ''));
    const num2 = parseInt(epic2.replace(/\D/g, ''));
    return !isNaN(num1) && !isNaN(num2) && Math.abs(num2 - num1) === 1;
  }

  // Detect geographic anomalies (e.g., NRI registering from non-NRI location)
  private static detectGeographicAnomaly(data: RegistrationData): {
    detected: boolean;
    confidence: number;
    evidence: string;
  } {
    // Simplified: In production, use IP geolocation and cross-reference with claimed status
    // For now, random detection for demonstration
    const anomalyDetected = Math.random() < 0.1; // 10% chance for demo

    return {
      detected: anomalyDetected,
      confidence: anomalyDetected ? 0.7 : 0,
      evidence: anomalyDetected 
        ? 'IP location inconsistent with NRI status claim'
        : ''
    };
  }

  // Detect multiple votes from same IP/location
  private static detectIPClustering(data: VotingData): {
    detected: boolean;
    confidence: number;
    evidence: string;
  } {
    const now = Date.now();
    const timeWindow = 3600000; // 1 hour
    
    const sameIPVotes = votingStore.filter(
      v => v.ipAddress === data.ipAddress && 
           now - v.timestamp < timeWindow
    ).length;

    const detected = sameIPVotes > 10;
    const confidence = detected ? Math.min(sameIPVotes / 20, 1) : 0;

    return {
      detected,
      confidence,
      evidence: detected 
        ? `${sameIPVotes} votes from same IP in last hour`
        : ''
    };
  }

  // Detect suspicious voting time patterns
  private static detectTemporalAnomaly(data: VotingData): {
    detected: boolean;
    confidence: number;
    evidence: string;
  } {
    const hour = new Date(data.timestamp).getHours();
    
    // Flag if voting between 1 AM - 5 AM (unusual hours)
    const isUnusualHour = hour >= 1 && hour <= 5;
    
    // Check for burst patterns (many votes in short time)
    const now = Date.now();
    const last5MinVotes = votingStore.filter(
      v => now - v.timestamp < 300000 // 5 minutes
    ).length;

    const burstDetected = last5MinVotes > 50;

    const detected = isUnusualHour || burstDetected;
    const confidence = detected ? 0.75 : 0;

    const evidence = [];
    if (isUnusualHour) evidence.push(`Voting at unusual hour: ${hour}:00`);
    if (burstDetected) evidence.push(`${last5MinVotes} votes in last 5 minutes`);

    return {
      detected,
      confidence,
      evidence: evidence.join('; ')
    };
  }

  // Create anomaly report with recommended action
  private static createReport(
    epicNumber: string,
    type: AnomalyReport['anomalyType'],
    riskScore: number,
    indicators: AnomalyReport['indicators']
  ): AnomalyReport {
    
    const maskedEPIC = this.maskEPIC(epicNumber);
    const riskLevel = this.calculateRiskLevel(riskScore);
    const recommendedAction = this.getRecommendedAction(riskScore);
    const autoBlocked = riskScore >= 86;

    if (autoBlocked) {
      blockedUsers.add(epicNumber);
    }

    return {
      userId: `user_${Math.random().toString(36).substr(2, 9)}`,
      epicNumber: maskedEPIC,
      anomalyType: type,
      riskLevel,
      indicators,
      recommendedAction,
      timestamp: new Date(),
      autoBlocked
    };
  }

  // Mask EPIC for privacy
  private static maskEPIC(epic: string): string {
    if (epic.length <= 4) return epic;
    return 'X'.repeat(epic.length - 4) + epic.slice(-4);
  }

  // Calculate risk level from score
  private static calculateRiskLevel(score: number): AnomalyReport['riskLevel'] {
    if (score <= 30) return 'low';
    if (score <= 60) return 'medium';
    if (score <= 85) return 'high';
    return 'critical';
  }

  // Get recommended action based on risk score
  private static getRecommendedAction(score: number): AnomalyReport['recommendedAction'] {
    if (score <= 30) return 'allow';
    if (score <= 60) return 'flag';
    if (score <= 85) return 'manual_review';
    return 'block';
  }

  // Check if user is blocked
  static isUserBlocked(epicNumber: string): boolean {
    return blockedUsers.has(epicNumber);
  }

  // Generate summary statistics
  static getStatistics(): {
    totalRegistrations: number;
    totalVotes: number;
    blockedUsers: number;
    averageRiskScore: number;
  } {
    return {
      totalRegistrations: registrationStore.length,
      totalVotes: votingStore.length,
      blockedUsers: blockedUsers.size,
      averageRiskScore: 0 // Would calculate from stored reports
    };
  }

  // Clear all data (for testing)
  static clearData(): void {
    registrationStore.length = 0;
    votingStore.length = 0;
    blockedUsers.clear();
  }
}

// Helper function to simulate ML-based anomaly detection
export const detectBehavioralAnomaly = async (
  userBehavior: {
    clickPattern: number[];
    mouseMovement: { x: number; y: number }[];
    keystrokes: number[];
  }
): Promise<{ anomalyDetected: boolean; confidence: number }> => {
  // In production, this would use a trained ML model
  // For now, simple heuristics
  
  const avgClickInterval = userBehavior.clickPattern.reduce((a, b) => a + b, 0) / 
                          userBehavior.clickPattern.length;
  
  // Too regular = bot
  const isBot = avgClickInterval > 0 && 
                Math.abs(avgClickInterval - userBehavior.clickPattern[0]) < 10;
  
  return {
    anomalyDetected: isBot,
    confidence: isBot ? 0.85 : 0.2
  };
};