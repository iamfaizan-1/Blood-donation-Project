import { User, BloodGroup, IUserDocument } from '../models/User.js';
import { BloodRequest, UrgencyLevel } from '../models/BloodRequest.js';
import { Donation } from '../models/Donation.js';

/**
 * ============================================================
 * DATA MINING SERVICE — KDD (Knowledge Discovery in Databases)
 * ============================================================
 * Implements the classic KDD pipeline on top of the app's
 * MongoDB collections (User, BloodRequest, Donation):
 *
 *   1. Selection      -> pull raw records from the DB
 *   2. Preprocessing   -> clean / drop incomplete records
 *   3. Transformation  -> normalize into feature vectors
 *   4. Data Mining     -> clustering + frequent-pattern mining
 *   5. Interpretation  -> turn mined patterns into readable insights
 *
 * Two mining techniques are implemented:
 *   - K-Means clustering on donor geo-location -> donor "hotspots"
 *   - Frequent pattern / association-rule style mining on
 *     (bloodGroup, urgency) request combinations -> demand patterns
 * ============================================================
 */

export interface DonorClusterDTO {
  clusterId: number;
  centerLatitude: number;
  centerLongitude: number;
  donorCount: number;
  dominantBloodGroup: BloodGroup | null;
}

export interface DemandPatternDTO {
  bloodGroup: BloodGroup;
  urgency: UrgencyLevel;
  frequency: number;
  supportPercent: number; // (frequency / totalRequests) * 100
  avgFulfillmentHours: number | null;
}

export interface DataMiningInsightsDTO {
  generatedAt: string;
  totalDonorsAnalyzed: number;
  totalRequestsAnalyzed: number;
  donorClusters: DonorClusterDTO[];
  demandPatterns: DemandPatternDTO[];
  topInsight: string;
}

interface GeoPoint {
  latitude: number;
  longitude: number;
  bloodGroup: BloodGroup;
}

export class DataMiningService {
  /**
   * Full KDD pipeline entry point — orchestrates all 5 stages and
   * returns a single insights object consumed by the analytics API.
   */
  public static async generateInsights(): Promise<DataMiningInsightsDTO> {
    // ---- Stage 1: Selection ----
    const rawDonors = await User.find({ isDonor: true }).select(
      'bloodGroup location isAvailable'
    );
    const rawRequests = await BloodRequest.find().select(
      'bloodGroup urgency createdAt statusHistory status'
    );

    // ---- Stage 2: Preprocessing (drop incomplete / invalid records) ----
    const cleanDonors = this.cleanDonorData(rawDonors);
    const cleanRequests = rawRequests.filter(
      (r) => !!r.bloodGroup && !!r.urgency && !!r.createdAt
    );

    // ---- Stage 3: Transformation ----
    const geoPoints: GeoPoint[] = cleanDonors.map((d) => ({
      latitude: d.location.latitude,
      longitude: d.location.longitude,
      bloodGroup: d.bloodGroup,
    }));

    // ---- Stage 4: Mining ----
    const donorClusters = this.kMeansClusterDonors(geoPoints, this.pickK(geoPoints.length));
    const demandPatterns = this.mineDemandPatterns(cleanRequests);

    // ---- Stage 5: Interpretation ----
    const topInsight = this.buildTopInsight(donorClusters, demandPatterns);

    return {
      generatedAt: new Date().toISOString(),
      totalDonorsAnalyzed: cleanDonors.length,
      totalRequestsAnalyzed: cleanRequests.length,
      donorClusters,
      demandPatterns,
      topInsight,
    };
  }

  // ---------------- Stage 2: Preprocessing ----------------
  private static cleanDonorData(donors: IUserDocument[]) {
    return donors.filter(
      (d) =>
        !!d.bloodGroup &&
        !!d.location &&
        typeof d.location.latitude === 'number' &&
        typeof d.location.longitude === 'number'
    );
  }

  // ---------------- Stage 4a: K-Means Clustering ----------------
  /**
   * Simple K-Means over (latitude, longitude) to find donor
   * "hotspot" regions — useful for planning donation camps.
   */
  private static kMeansClusterDonors(points: GeoPoint[], k: number): DonorClusterDTO[] {
    if (points.length === 0 || k === 0) return [];

    // Initialize centroids using the first k distinct points (simple, deterministic seeding)
    let centroids = points.slice(0, k).map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

    const MAX_ITERATIONS = 15;
    let assignments: number[] = new Array(points.length).fill(0);

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      // Assign each point to nearest centroid
      const newAssignments = points.map((p) => {
        let bestIdx = 0;
        let bestDist = Infinity;
        centroids.forEach((c, idx) => {
          const dist = Math.hypot(p.latitude - c.latitude, p.longitude - c.longitude);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
          }
        });
        return bestIdx;
      });

      const converged = newAssignments.every((a, i) => a === assignments[i]);
      assignments = newAssignments;
      if (converged && iter > 0) break;

      // Recompute centroids as mean of assigned points
      centroids = centroids.map((c, idx) => {
        const assigned = points.filter((_, i) => assignments[i] === idx);
        if (assigned.length === 0) return c;
        const avgLat = assigned.reduce((s, p) => s + p.latitude, 0) / assigned.length;
        const avgLng = assigned.reduce((s, p) => s + p.longitude, 0) / assigned.length;
        return { latitude: avgLat, longitude: avgLng };
      });
    }

    // Build cluster DTOs with dominant blood group per cluster
    return centroids
      .map((c, idx) => {
        const members = points.filter((_, i) => assignments[i] === idx);
        return {
          clusterId: idx,
          centerLatitude: Number(c.latitude.toFixed(5)),
          centerLongitude: Number(c.longitude.toFixed(5)),
          donorCount: members.length,
          dominantBloodGroup: this.mostFrequentBloodGroup(members),
        };
      })
      .filter((c) => c.donorCount > 0)
      .sort((a, b) => b.donorCount - a.donorCount);
  }

  private static mostFrequentBloodGroup(members: GeoPoint[]): BloodGroup | null {
    if (members.length === 0) return null;
    const counts = new Map<BloodGroup, number>();
    members.forEach((m) => counts.set(m.bloodGroup, (counts.get(m.bloodGroup) || 0) + 1));
    let best: BloodGroup | null = null;
    let bestCount = 0;
    counts.forEach((count, bg) => {
      if (count > bestCount) {
        bestCount = count;
        best = bg;
      }
    });
    return best;
  }

  /** Choose a reasonable number of clusters relative to dataset size. */
  private static pickK(donorCount: number): number {
    if (donorCount === 0) return 0;
    if (donorCount <= 4) return 1;
    return Math.min(5, Math.max(2, Math.round(Math.sqrt(donorCount / 2))));
  }

  // ---------------- Stage 4b: Frequent Pattern Mining ----------------
  /**
   * Association-rule-style mining: finds how frequently each
   * (bloodGroup, urgency) combination occurs among requests, and
   * the average time it historically takes to fulfil that pattern.
   * Patterns above a minimum support threshold are treated as
   * "frequent itemsets" (KDD terminology).
   */
  private static mineDemandPatterns(
    requests: Array<{
      bloodGroup: BloodGroup;
      urgency: UrgencyLevel;
      createdAt: Date;
      statusHistory: { status: string; timestamp: Date }[];
      status: string;
    }>
  ): DemandPatternDTO[] {
    const total = requests.length;
    if (total === 0) return [];

    const groups = new Map<string, typeof requests>();
    requests.forEach((r) => {
      const key = `${r.bloodGroup}__${r.urgency}`;
      const arr = groups.get(key) || [];
      arr.push(r);
      groups.set(key, arr);
    });

    const MIN_SUPPORT_PERCENT = 2; // ignore extremely rare combinations (noise)

    const patterns: DemandPatternDTO[] = [];
    groups.forEach((reqs, key) => {
      const [bloodGroup, urgency] = key.split('__') as [BloodGroup, UrgencyLevel];
      const frequency = reqs.length;
      const supportPercent = (frequency / total) * 100;
      if (supportPercent < MIN_SUPPORT_PERCENT) return;

      const avgFulfillmentHours = this.averageFulfillmentHours(reqs);

      patterns.push({
        bloodGroup,
        urgency,
        frequency,
        supportPercent: Number(supportPercent.toFixed(1)),
        avgFulfillmentHours,
      });
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private static averageFulfillmentHours(
    reqs: Array<{ createdAt: Date; statusHistory: { status: string; timestamp: Date }[] }>
  ): number | null {
    const durations: number[] = [];
    reqs.forEach((r) => {
      const fulfilledEntry = r.statusHistory?.find(
        (h) => h.status === 'fulfilled' || h.status === 'closed'
      );
      if (fulfilledEntry) {
        const hours =
          (new Date(fulfilledEntry.timestamp).getTime() - new Date(r.createdAt).getTime()) /
          (1000 * 60 * 60);
        if (hours >= 0) durations.push(hours);
      }
    });
    if (durations.length === 0) return null;
    const avg = durations.reduce((s, h) => s + h, 0) / durations.length;
    return Number(avg.toFixed(1));
  }

  // ---------------- Stage 5: Interpretation ----------------
  private static buildTopInsight(
    clusters: DonorClusterDTO[],
    patterns: DemandPatternDTO[]
  ): string {
    const parts: string[] = [];

    if (clusters.length > 0) {
      const top = clusters[0];
      parts.push(
        `Largest donor hotspot has ${top.donorCount} donors` +
          (top.dominantBloodGroup ? ` (mostly ${top.dominantBloodGroup})` : '') +
          `.`
      );
    }

    if (patterns.length > 0) {
      const top = patterns[0];
      parts.push(
        `Most frequent demand pattern: ${top.urgency} requests for ${top.bloodGroup} ` +
          `(${top.supportPercent}% of all requests).`
      );
    }

    return parts.length > 0 ? parts.join(' ') : 'Not enough data yet to generate insights.';
  }
}
