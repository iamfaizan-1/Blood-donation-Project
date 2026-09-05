import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { ScreenWrapper } from '../components/shared/ScreenWrapper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, BloodTypeBadge } from '../components/ui/Badge';
import { showAlert } from '../utils/alert';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius, TouchTarget } from '../constants/spacing';
import { TextStyles, FontWeights } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import {
  ChatService,
  chatService,
  ChatMessageItem,
  ConnectionStatus,
  PartnerInfo,
} from '../services/chatService';
import { useAuth } from '../context/AuthContext';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation<ChatNavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const { user } = useAuth();

  const requestId = route.params?.requestId || '';
  const initialPartnerName = route.params?.partnerName || 'Care Coordinator';
  const bloodType = route.params?.bloodType || 'O+';
  const hospital = route.params?.hospital || 'Hospital Blood Bank';

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [partner, setPartner] = useState<PartnerInfo>({
    id: '',
    name: initialPartnerName,
    bloodGroup: bloodType,
  });
  const [isBlocked, setIsBlocked] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);

  // Safety Modals
  const [safetyMenuVisible, setSafetyMenuVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('harassment');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    loadChatHistory();
    initSocketConnection();

    return () => {
      chatService.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [requestId]);

  const loadChatHistory = async () => {
    if (!requestId) return;
    setLoadingHistory(true);
    try {
      const history = await ChatService.getHistory(requestId);
      if (history) {
        setMessages(history.messages || []);
        if (history.partner) {
          setPartner(history.partner);
        }
        if (history.isBlocked) {
          setIsBlocked(true);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load chat history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const initSocketConnection = async () => {
    if (!requestId) return;

    // Listen for connection status changes
    const unsubStatus = chatService.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Listen for new incoming messages
    const unsubMsg = chatService.onNewMessage((message) => {
      setMessages((prev) => {
        // Prevent duplicate messages by ID
        if (prev.some((m) => m._id === message._id)) return prev;
        const currentUserId = user?._id || '';
        return [...prev, { ...message, isMe: message.senderId === currentUserId }];
      });
      scrollToBottom();
    });

    // Listen for typing indicator
    const unsubTyping = chatService.onPartnerTyping((data) => {
      setPartnerTyping(data.isTyping);
      if (data.isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000);
      }
    });

    // Listen for errors/blocks
    const unsubError = chatService.onError((error) => {
      if (error.isBlocked) {
        setIsBlocked(true);
      }
      Alert.alert('Notice', error.message);
    });

    // Connect and join room
    await chatService.connect(requestId);

    return () => {
      unsubStatus();
      unsubMsg();
      unsubTyping();
      unsubError();
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || isBlocked) return;
    const text = inputText.trim();
    setInputText('');

    chatService.sendMessage(requestId, text);
    chatService.sendTyping(requestId, false);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    chatService.sendTyping(requestId, text.length > 0);
  };

  const handleCall = async () => {
    try {
      const contact = partner.phone
        ? { phone: partner.phone, name: partner.name }
        : await ChatService.getSecureContact(requestId);

      if (contact?.phone) {
        showAlert(
          `Call ${contact.name || partner.name}`,
          `Direct dial: ${contact.phone}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Dial Phone',
              onPress: () => Linking.openURL(`tel:${contact.phone}`).catch(() => {}),
            },
          ]
        );
      } else {
        showAlert('Phone Unavailable', 'Phone number has not been provided.');
      }
    } catch (err: any) {
      showAlert('Call Error', err.response?.data?.message || 'Unable to connect call.');
    }
  };

  const handleShareLocation = async () => {
    setSharingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Location permission is required to share coordinates.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      chatService.shareLocation(
        requestId,
        coords.latitude,
        coords.longitude,
        `📍 Live Location Check-In: Near ${hospital}`
      );

      showAlert('Location Shared! 📍', 'Your live coordinates have been posted to the chat.');
    } catch (error: any) {
      showAlert('Location Error', 'Unable to retrieve current coordinates.');
    } finally {
      setSharingLocation(false);
    }
  };

  const handleBlockUser = () => {
    showAlert(
      'Block User?',
      `Are you sure you want to block ${partner.name}? Communication will be severed immediately and you will not match with this user again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block User',
          style: 'destructive',
          onPress: async () => {
            try {
              if (partner.id) {
                await ChatService.blockUser(partner.id);
                setIsBlocked(true);
                chatService.disconnect();
                showAlert('User Blocked', 'User has been blocked. Communication severed.');
              }
            } catch (err: any) {
              showAlert('Error', err.response?.data?.message || 'Failed to block user.');
            }
          },
        },
      ]
    );
  };

  const handleSubmitReport = async () => {
    if (!partner.id) return;
    setSubmittingReport(true);
    try {
      await ChatService.reportUser({
        reportedId: partner.id,
        requestId,
        reason: reportReason,
        details: reportDetails,
      });
      setReportModalVisible(false);
      setReportDetails('');
      showAlert(
        'Report Submitted',
        'Thank you for helping keep our life-saving community safe. Our team will review this promptly.'
      );
    } catch (err: any) {
      showAlert('Report Error', err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessageItem }) => {
    const isMe = item.isMe ?? (item.senderId === user?._id);

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.theirMessageRow]}>
        {!isMe && (
          <View style={styles.senderAvatar}>
            <Text style={styles.senderAvatarText}>{item.senderName?.charAt(0) || 'U'}</Text>
          </View>
        )}

        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {!isMe && <Text style={styles.senderLabel}>{item.senderName}</Text>}

          {item.messageType === 'location' ? (
            <View style={styles.locationMessage}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationContent}>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                  {item.message}
                </Text>
                {item.locationData && (
                  <Text style={[styles.coordsText, isMe ? styles.myCoordsText : styles.theirCoordsText]}>
                    Coordinates: {item.locationData.latitude.toFixed(4)}, {item.locationData.longitude.toFixed(4)}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
              {item.message}
            </Text>
          )}

          <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.theirTimeText]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {partner.name}
            </Text>
            <BloodTypeBadge bloodType={partner.bloodGroup as any} size="sm" />
          </View>

          {/* Real-time Connection State Indicator */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                connectionStatus === 'connected'
                  ? styles.statusDotConnected
                  : connectionStatus === 'reconnecting'
                  ? styles.statusDotReconnecting
                  : styles.statusDotDisconnected,
              ]}
            />
            <Text style={styles.statusLabel}>
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'reconnecting'
                ? 'Reconnecting...'
                : connectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Safety Menu Action */}
        <TouchableOpacity
          onPress={() => setSafetyMenuVisible(true)}
          style={styles.menuBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>🛡️</Text>
        </TouchableOpacity>
      </View>

      {/* Action Toolbar: Call & Share Location */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <Text style={styles.toolbarEmoji}>📞</Text>
          <Text style={styles.toolbarBtnText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolbarBtn, sharingLocation && styles.toolbarBtnActive]}
          onPress={handleShareLocation}
          disabled={sharingLocation || isBlocked}
          activeOpacity={0.8}
        >
          {sharingLocation ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Text style={styles.toolbarEmoji}>📍</Text>
              <Text style={styles.toolbarBtnText}>Share Location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Blocked Conversation Warning */}
      {isBlocked && (
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedBannerText}>
            🔒 This conversation is blocked. Communication has been severed.
          </Text>
        </View>
      )}

      {/* Messages Stream */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loadingHistory ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading encrypted conversation...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>Secure Emergency Channel</Text>
            <Text style={styles.emptySub}>
              Direct communication between requester and accepted donor is active. Coordinate hospital arrival, timing, and details.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToBottom}
          />
        )}

        {/* Partner Typing Indicator */}
        {partnerTyping && (
          <View style={styles.typingBox}>
            <Text style={styles.typingText}>{partner.name} is typing... 💬</Text>
          </View>
        )}

        {/* Input Bar */}
        {!isBlocked ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type message to donor / requester..."
              placeholderTextColor={Colors.textTertiary}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                !inputText.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.blockedInputBox}>
            <Text style={styles.blockedInputText}>Messaging disabled for blocked contact</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Safety Menu Modal */}
      <Modal
        visible={safetyMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSafetyMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSafetyMenuVisible(false)}
        >
          <View style={styles.menuModalContent}>
            <Text style={styles.menuModalTitle}>Safety & Privacy Options</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setSafetyMenuVisible(false);
                setReportModalVisible(true);
              }}
            >
              <Text style={styles.menuItemEmoji}>🚩</Text>
              <View>
                <Text style={styles.menuItemTitle}>Report User</Text>
                <Text style={styles.menuItemSub}>Flag inappropriate conduct, harassment, or no-show</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                setSafetyMenuVisible(false);
                handleBlockUser();
              }}
            >
              <Text style={styles.menuItemEmoji}>🚫</Text>
              <View>
                <Text style={[styles.menuItemTitle, { color: Colors.error }]}>Block User</Text>
                <Text style={styles.menuItemSub}>Sever chat and prevent future request matching</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.reportModalCard}>
            <Text style={styles.reportModalHeader}>Report User</Text>
            <Text style={styles.reportModalSub}>
              Select the issue you experienced with {partner.name}:
            </Text>

            <View style={styles.reasonsList}>
              {[
                { label: 'Harassment or Abuse', value: 'harassment' },
                { label: 'Inappropriate Behavior', value: 'inappropriate_behavior' },
                { label: 'Did Not Show Up', value: 'no_show' },
                { label: 'Fraud or Scam Attempt', value: 'fraud_or_scam' },
                { label: 'Safety Concern', value: 'safety_concern' },
                { label: 'Other Concern', value: 'other' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.reasonOption,
                    reportReason === r.value && styles.reasonOptionSelected,
                  ]}
                  onPress={() => setReportReason(r.value)}
                >
                  <Text
                    style={[
                      styles.reasonText,
                      reportReason === r.value && styles.reasonTextSelected,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.detailsInput}
              placeholder="Additional details (optional)..."
              placeholderTextColor={Colors.textTertiary}
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setReportModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={submittingReport ? 'Submitting...' : 'Submit Report'}
                variant="primary"
                size="md"
                loading={submittingReport}
                onPress={handleSubmitReport}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    ...TextStyles.subtitle,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusDotConnected: {
    backgroundColor: Colors.success,
  },
  statusDotReconnecting: {
    backgroundColor: Colors.warning,
  },
  statusDotDisconnected: {
    backgroundColor: Colors.textTertiary,
  },
  statusLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  menuBtn: {
    padding: Spacing.xs,
  },
  menuIcon: {
    fontSize: 20,
  },

  toolbar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  toolbarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    gap: 6,
  },
  toolbarBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  toolbarEmoji: {
    fontSize: 14,
  },
  toolbarBtnText: {
    fontSize: 13,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
  },

  blockedBanner: {
    backgroundColor: Colors.errorLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  blockedBannerText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
  },

  chatContainer: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...TextStyles.subtitle,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  emptySub: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  messageList: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginVertical: 2,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  senderAvatarText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderLight,
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFF',
  },
  theirMessageText: {
    color: Colors.text,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  theirTimeText: {
    color: Colors.textTertiary,
  },

  locationMessage: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  locationIcon: {
    fontSize: 18,
  },
  locationContent: {
    flex: 1,
  },
  coordsText: {
    fontSize: 11,
    marginTop: 2,
  },
  myCoordsText: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  theirCoordsText: {
    color: Colors.textSecondary,
  },

  typingBox: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFF',
    marginLeft: 2,
  },

  blockedInputBox: {
    padding: Spacing.md,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  blockedInputText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  menuModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  menuModalTitle: {
    ...TextStyles.subtitle,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemEmoji: {
    fontSize: 22,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  menuItemSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  reportModalCard: {
    maxHeight: '90%',
  },
  reportModalHeader: {
    ...TextStyles.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  reportModalSub: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  reasonsList: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  reasonOption: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  reasonOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  reasonText: {
    fontSize: 13,
    color: Colors.text,
  },
  reasonTextSelected: {
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
  detailsInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 13,
    color: Colors.text,
    textAlignVertical: 'top',
    minHeight: 70,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
