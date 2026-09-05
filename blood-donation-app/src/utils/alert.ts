import { Alert as RNAlert, Platform } from 'react-native';

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  const fullMessage = message ? `${title}\n\n${message}` : title;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      if (!buttons || buttons.length <= 1) {
        window.alert(fullMessage);
        if (buttons && buttons[0]?.onPress) {
          buttons[0].onPress();
        }
      } else {
        // Find cancel and action buttons
        const cancelButton = buttons.find((b) => b.style === 'cancel');
        const confirmButton = buttons.find((b) => b.style !== 'cancel') || buttons[1];

        const confirmed = window.confirm(fullMessage);
        if (confirmed) {
          if (confirmButton?.onPress) confirmButton.onPress();
        } else {
          if (cancelButton?.onPress) cancelButton.onPress();
        }
      }
    }
  } else {
    RNAlert.alert(title, message, buttons);
  }
};
