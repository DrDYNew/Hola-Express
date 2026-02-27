import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  buttonText?: string;
}

export default function ErrorModal({
  visible,
  title = 'Lỗi',
  message,
  onClose,
  buttonText = 'Đóng',
}: ErrorModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      // Shake icon
      Animated.sequence([
        Animated.delay(200),
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      shakeAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 150, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* Top accent strip */}
          <LinearGradient colors={['#ef4444', '#f87171']} style={styles.topStrip} />

          {/* Icon */}
          <View style={styles.iconWrap}>
            <LinearGradient colors={['#f87171', '#ef4444', '#dc2626']} style={styles.iconCircle}>
              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <MaterialCommunityIcons name="alert-circle-outline" size={38} color="#fff" />
              </Animated.View>
            </LinearGradient>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.btn} onPress={handleClose} activeOpacity={0.85}>
            <LinearGradient colors={['#f87171', '#ef4444']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.btnText}>{buttonText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    width: Math.min(width - 64, 360),
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 14,
    paddingBottom: 32,
  },
  topStrip: { width: '100%', height: 5 },
  iconWrap: { marginTop: 32, marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center', paddingHorizontal: 24 },
  message: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, paddingHorizontal: 24, marginBottom: 4 },
  btn: { marginTop: 24, borderRadius: 14, overflow: 'hidden', width: width - 128 },
  btnGradient: { paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
