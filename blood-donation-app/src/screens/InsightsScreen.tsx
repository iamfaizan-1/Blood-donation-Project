import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../components/shared/ScreenWrapper';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { analyticsService, DataMiningInsights } from '../services/analyticsService';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius } from '../constants/spacing';
import { TextStyles, FontWeights } from '../constants/typography';

export const InsightsScreen: React.FC = () => {
  const [insights, setInsights] = useState<DataMiningInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getInsights();
      setInsights(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not load insights right now.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInsights();
    }, [])
  );

  return (
    <ScreenWrapper>
      <Header
        title="📊 Data Mining Insights"
        subtitle="KDD pipeline over donor & request data"
        showBack
      />

      {loading && (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: Spacing['3xl'] }} />
      )}

      {!loading && error && (
        <Card variant="outlined" padding="md" style={{ marginTop: Spacing.lg }}>
          <Text style={[TextStyles.body, { color: Colors.error, textAlign: 'center' }]}>{error}</Text>
          <Button title="Retry" onPress={fetchInsights} variant="outline" size="sm" style={{ marginTop: Spacing.md, alignSelf: 'center' }} />
        </Card>
      )}

      {!loading && !error && insights && (
        <>
          {/* Top-line summary */}
          <Card variant="elevated" padding="md" style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>💡 Key Insight</Text>
            <Text style={styles.summaryText}>{insights.topInsight}</Text>
            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatNumber}>{insights.totalDonorsAnalyzed}</Text>
                <Text style={styles.summaryStatLabel}>Donors Analyzed</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatNumber}>{insights.totalRequestsAnalyzed}</Text>
                <Text style={styles.summaryStatLabel}>Requests Analyzed</Text>
              </View>
            </View>
          </Card>

          {/* Donor Clusters (K-Means) */}
          <Text style={styles.sectionTitle}>Donor Hotspot Clusters</Text>
          <Text style={styles.sectionSub}>K-Means clustering on donor geo-location</Text>
          {insights.donorClusters.length === 0 ? (
            <Card variant="outlined" padding="md">
              <Text style={TextStyles.bodySmall}>Not enough donor location data yet.</Text>
            </Card>
          ) : (
            insights.donorClusters.map((c) => (
              <Card key={c.clusterId} variant="default" padding="md" style={styles.rowCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.rowTitle}>Cluster #{c.clusterId + 1}</Text>
                  <Badge label={`${c.donorCount} donors`} variant="info" size="sm" />
                </View>
                <Text style={styles.rowSub}>
                  Center: {c.centerLatitude.toFixed(3)}, {c.centerLongitude.toFixed(3)}
                </Text>
                {c.dominantBloodGroup && (
                  <Text style={styles.rowSub}>Dominant blood group: {c.dominantBloodGroup}</Text>
                )}
              </Card>
            ))
          )}

          {/* Demand Patterns (association-rule style) */}
          <Text style={styles.sectionTitle}>Frequent Demand Patterns</Text>
          <Text style={styles.sectionSub}>Association-rule mining on (blood group, urgency)</Text>
          {insights.demandPatterns.length === 0 ? (
            <Card variant="outlined" padding="md">
              <Text style={TextStyles.bodySmall}>Not enough request data yet.</Text>
            </Card>
          ) : (
            insights.demandPatterns.map((p, idx) => (
              <Card key={`${p.bloodGroup}-${p.urgency}-${idx}`} variant="default" padding="md" style={styles.rowCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.rowTitle}>
                    {p.bloodGroup} · {p.urgency}
                  </Text>
                  <Badge label={`${p.supportPercent}% support`} variant="warning" size="sm" />
                </View>
                <Text style={styles.rowSub}>Occurred {p.frequency} time(s)</Text>
                {p.avgFulfillmentHours !== null && (
                  <Text style={styles.rowSub}>
                    Avg. fulfillment time: {p.avgFulfillmentHours} hrs
                  </Text>
                )}
              </Card>
            ))
          )}
        </>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  summaryTitle: {
    ...TextStyles.subtitle,
    fontWeight: FontWeights.bold,
    color: Colors.primaryDark,
  },
  summaryText: {
    ...TextStyles.body,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatNumber: {
    ...TextStyles.h2,
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
  summaryStatLabel: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    ...TextStyles.h3,
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  sectionSub: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  rowCard: {
    marginBottom: Spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    ...TextStyles.subtitle,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
  },
  rowSub: {
    ...TextStyles.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
