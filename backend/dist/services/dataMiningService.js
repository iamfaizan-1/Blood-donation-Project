"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataMiningService = void 0;
const User_js_1 = require("../models/User.js");
const BloodRequest_js_1 = require("../models/BloodRequest.js");
class DataMiningService {
    /**
     * Full KDD pipeline entry point — orchestrates all 5 stages and
     * returns a single insights object consumed by the analytics API.
     */
    static async generateInsights() {
        // ---- Stage 1: Selection ----
        const rawDonors = await User_js_1.User.find({ isDonor: true }).select('bloodGroup location isAvailable');
        const rawRequests = await BloodRequest_js_1.BloodRequest.find().select('bloodGroup urgency createdAt statusHistory status');
        // ---- Stage 2: Preprocessing (drop incomplete / invalid records) ----
        const cleanDonors = this.cleanDonorData(rawDonors);
        const cleanRequests = rawRequests.filter((r) => !!r.bloodGroup && !!r.urgency && !!r.createdAt);
        // ---- Stage 3: Transformation ----
        const geoPoints = cleanDonors.map((d) => ({
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
    static cleanDonorData(donors) {
        return donors.filter((d) => !!d.bloodGroup &&
            !!d.location &&
            typeof d.location.latitude === 'number' &&
            typeof d.location.longitude === 'number');
    }
    // ---------------- Stage 4a: K-Means Clustering ----------------
    /**
     * Simple K-Means over (latitude, longitude) to find donor
     * "hotspot" regions — useful for planning donation camps.
     */
    static kMeansClusterDonors(points, k) {
        if (points.length === 0 || k === 0)
            return [];
        // Initialize centroids using the first k distinct points (simple, deterministic seeding)
        let centroids = points.slice(0, k).map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
        const MAX_ITERATIONS = 15;
        let assignments = new Array(points.length).fill(0);
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
            if (converged && iter > 0)
                break;
            // Recompute centroids as mean of assigned points
            centroids = centroids.map((c, idx) => {
                const assigned = points.filter((_, i) => assignments[i] === idx);
                if (assigned.length === 0)
                    return c;
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
    static mostFrequentBloodGroup(members) {
        if (members.length === 0)
            return null;
        const counts = new Map();
        members.forEach((m) => counts.set(m.bloodGroup, (counts.get(m.bloodGroup) || 0) + 1));
        let best = null;
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
    static pickK(donorCount) {
        if (donorCount === 0)
            return 0;
        if (donorCount <= 4)
            return 1;
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
    static mineDemandPatterns(requests) {
        const total = requests.length;
        if (total === 0)
            return [];
        const groups = new Map();
        requests.forEach((r) => {
            const key = `${r.bloodGroup}__${r.urgency}`;
            const arr = groups.get(key) || [];
            arr.push(r);
            groups.set(key, arr);
        });
        const MIN_SUPPORT_PERCENT = 2; // ignore extremely rare combinations (noise)
        const patterns = [];
        groups.forEach((reqs, key) => {
            const [bloodGroup, urgency] = key.split('__');
            const frequency = reqs.length;
            const supportPercent = (frequency / total) * 100;
            if (supportPercent < MIN_SUPPORT_PERCENT)
                return;
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
    static averageFulfillmentHours(reqs) {
        const durations = [];
        reqs.forEach((r) => {
            const fulfilledEntry = r.statusHistory?.find((h) => h.status === 'fulfilled' || h.status === 'closed');
            if (fulfilledEntry) {
                const hours = (new Date(fulfilledEntry.timestamp).getTime() - new Date(r.createdAt).getTime()) /
                    (1000 * 60 * 60);
                if (hours >= 0)
                    durations.push(hours);
            }
        });
        if (durations.length === 0)
            return null;
        const avg = durations.reduce((s, h) => s + h, 0) / durations.length;
        return Number(avg.toFixed(1));
    }
    // ---------------- Stage 5: Interpretation ----------------
    static buildTopInsight(clusters, patterns) {
        const parts = [];
        if (clusters.length > 0) {
            const top = clusters[0];
            parts.push(`Largest donor hotspot has ${top.donorCount} donors` +
                (top.dominantBloodGroup ? ` (mostly ${top.dominantBloodGroup})` : '') +
                `.`);
        }
        if (patterns.length > 0) {
            const top = patterns[0];
            parts.push(`Most frequent demand pattern: ${top.urgency} requests for ${top.bloodGroup} ` +
                `(${top.supportPercent}% of all requests).`);
        }
        return parts.length > 0 ? parts.join(' ') : 'Not enough data yet to generate insights.';
    }
}
exports.DataMiningService = DataMiningService;
