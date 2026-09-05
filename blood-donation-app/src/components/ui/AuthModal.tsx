import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Input } from './Input';
import { Button } from './Button';
import { BloodGroupSelector } from './BloodGroupSelector';
import { showAlert } from '../../utils/alert';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { TextStyles, FontWeights } from '../../constants/typography';
import { BloodType } from '../../types';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields - clean by default for user's own credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodType>('O+');

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [visible, initialMode]);

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleFillDemo = () => {
    setErrorMessage(null);
    if (mode === 'login') {
      setEmail('john.doe@healthnet.org');
      setPassword('secret123');
    } else {
      const randId = Math.floor(1000 + Math.random() * 9000);
      setName('Sarah Jenkins');
      setEmail(`donor.${randId}@healthnet.org`);
      setPassword('secret123');
      setPhone('+1 (555) 234-4921');
      setBloodGroup('O+');
    }
  };

  const validateForm = (): string | null => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      return 'Please enter your email address.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return 'Please enter a valid email address (e.g., user@example.com).';
    }

    if (!cleanPassword) {
      return 'Please enter your password.';
    }

    if (cleanPassword.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    if (mode === 'register') {
      const cleanName = name.trim();
      if (!cleanName || cleanName.length < 2) {
        return 'Please enter your full name (at least 2 characters).';
      }

      const cleanPhone = phone.trim();
      if (!cleanPhone) {
        return 'Please enter your phone number.';
      }

      const phoneDigits = cleanPhone.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        return 'Phone number must contain between 7 and 15 digits.';
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: cleanEmail, password: cleanPassword });
        setSuccessMessage('Welcome back! Signed in successfully.');
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        const cleanName = name.trim();
        const cleanPhone = phone.trim();

        await register({
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          phone: cleanPhone,
          bloodGroup,
        });

        setSuccessMessage('Account created successfully! Welcome to LifeSaver ❤️');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (error: any) {
      let msg =
        error.response?.data?.message ||
        error.message ||
        'Authentication failed. Please check your credentials.';

      if (
        msg.includes('Network Error') ||
        error.code === 'ERR_NETWORK' ||
        !error.response
      ) {
        msg =
          'Unable to connect to the backend server. Please verify the server is running on port 5000.';
      }

      setErrorMessage(msg);
      showAlert('Authentication Notice', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'login' ? '🔑 Sign In to LifeSaver' : '🩸 Create Donor Account'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Control Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'login' && styles.tabButtonActive]}
              onPress={() => handleSwitchMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                🔑 Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, mode === 'register' && styles.tabButtonActive]}
              onPress={() => handleSwitchMode('register')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                🩸 Register Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* In-Modal Alert Banners */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successMessage}>{successMessage}</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Quick Demo Fill Helper */}
            <TouchableOpacity
              onPress={handleFillDemo}
              style={styles.demoFillBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.demoFillText}>
                {mode === 'login'
                  ? '⚡ Auto-Fill Demo Credentials (john.doe@healthnet.org)'
                  : '⚡ Auto-Fill Valid New Donor Details'}
              </Text>
            </TouchableOpacity>

            {mode === 'register' && (
              <Input
                label="Full Name *"
                placeholder="e.g. Sarah Jenkins"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (errorMessage) setErrorMessage(null);
                }}
              />
            )}

            <Input
              label="Email Address *"
              placeholder="e.g. your.email@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errorMessage) setErrorMessage(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password *"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errorMessage) setErrorMessage(null);
              }}
              secureTextEntry
              hint="Minimum 6 characters"
            />

            {mode === 'register' && (
              <>
                <Input
                  label="Phone Number *"
                  placeholder="e.g. +1 555-0192 or 03001234567"
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="phone-pad"
                  hint="Between 7 and 15 digits"
                />

                <BloodGroupSelector
                  selectedType={bloodGroup}
                  onSelectType={setBloodGroup}
                  label="Your Blood Group *"
                />
              </>
            )}

            <Button
              title={
                loading
                  ? 'Processing...'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account & Save Lives'
              }
              onPress={handleSubmit}
              loading={loading}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.submitBtn}
            />

            {/* Mode Switcher Footer */}
            <TouchableOpacity
              onPress={() => handleSwitchMode(mode === 'login' ? 'register' : 'login')}
              style={styles.switchRow}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                {mode === 'login'
                  ? "Don't have an account? Tap here to register as Donor"
                  : 'Already registered? Tap here to Sign In'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    ...TextStyles.subtitle,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: Colors.textTertiary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabText: {
    ...TextStyles.caption,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: FontWeights.bold,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  errorMessage: {
    ...TextStyles.bodySmall,
    color: '#B91C1C',
    flex: 1,
    fontWeight: FontWeights.semibold,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  successIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  successMessage: {
    ...TextStyles.bodySmall,
    color: '#15803D',
    flex: 1,
    fontWeight: FontWeights.semibold,
  },
  demoFillBtn: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.2)',
  },
  demoFillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  submitBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  switchRow: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  switchText: {
    ...TextStyles.bodySmall,
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
  },
});
