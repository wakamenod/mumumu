import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import Colors from '@/constants/Colors';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** true にすると確認ボタンが赤色（破壊的操作）になる */
  destructive?: boolean;
};

/**
 * クロスプラットフォーム対応の確認ダイアログ。
 * React Native 組み込みの Modal を使用し、Web でも正しく動作する。
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          // 内側タップでは閉じない
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.levelLabel }]}>{title}</Text>

          {message != null && (
            <Text style={[styles.message, { color: colors.levelDescription }]}>{message}</Text>
          )}

          <View style={styles.buttonRow}>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: scheme === 'dark' ? '#2E3F7F' : '#E8ECFA' },
              ]}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { color: colors.levelLabel }]}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: destructive ? '#E53935' : colors.accent,
                },
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    gap: 16,
    // Shadow (iOS + Android + Web)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
