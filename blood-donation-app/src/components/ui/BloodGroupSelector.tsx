import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BloodType } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { TextStyles, FontWeights } from '../../constants/typography';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface BloodGroupSelectorProps {
  selectedType?: BloodType;
  onSelectType: (type: BloodType) => void;
  label?: string;
  allowAll?: boolean;
}

export const BloodGroupSelector: React.FC<BloodGroupSelectorProps> = ({
  selectedType,
  onSelectType,
  label = 'Select Blood Group',
  allowAll = false,
}) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.grid}>
        {BLOOD_TYPES.map((type) => {
          const isSelected = selectedType === type;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => onSelectType(type)}
              activeOpacity={0.7}
              style={[
                styles.item,
                isSelected && styles.itemSelected,
              ]}
            >
              <Text style={[styles.bloodText, isSelected && styles.bloodTextSelected]}>
                {type}
              </Text>
              {type === 'O-' && <Text style={styles.universalBadge}>Universal</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  item: {
    width: '23%',
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  itemSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  bloodText: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  bloodTextSelected: {
    color: Colors.textInverse,
  },
  universalBadge: {
    position: 'absolute',
    bottom: 3,
    fontSize: 8,
    color: Colors.primary,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
  },
});
