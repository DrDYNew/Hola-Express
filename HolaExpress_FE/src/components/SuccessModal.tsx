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

interface SuccessModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export default function SuccessModal({
  visible,
  title = 'Thành công',
  message,
  onClose,
  autoClose = true,
  autoCloseDuration = 2000,
}: SuccessModalProps) {
  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const checkAnim  = useRef(new Animated.Value(0)).current;
  const ringAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      Animated.sequence([
        Animated.delay(150),
        Animated.spring(checkAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      ]).start();

      Animated.sequence([
        Animated.delay(300),
        Animated.loop(
          Animated.sequence([
            Animated.timing(ringAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(ringAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
          ]),
          { iterations: 3 }
        ),
      ]).start();

      if (autoClose) {
        const t = setTimeout(handleClose, autoCloseDuration);
        return () => clearTimeout(t);
      }
    } else {
      scaleAnim.setValue(0);
      checkAnim.setValue(0);
      ringAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 150, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.15, 0] });

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* Top accent strip */}
          <LinearGradient colors={['#10b981', '#34d399']} style={styles.topStrip} />

          {/* Icon */}
          <View style={styles.iconWrap}>
            {/* Pulsing ring */}
            <Animated.View style={[
              styles.ringOuter,
              { transform: [{ scale: ringScale }], opacity: ringOpacity },
            ]} />
            <LinearGradient colors={['#34d399', '#10b981', '#059669']} style={styles.iconCircle}>
              <Animated.View style={{ transform: [{ scale: checkAnim }] }}>
                <MaterialCommunityIcons name="check-bold" size={38} color="#fff" />
              </Animated.View>
            </LinearGradient>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {!autoClose && (
            <TouchableOpacity style={styles.btn} onPress={handleClose} activeOpacity={0.85}>
              <LinearGradient colors={['#34d399', '#10b981']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.btnText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
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
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 14,
    paddingBottom: 32,
  },
  topStrip: { width: '100%', height: 5 },
  iconWrap: { marginTop: 32, marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  ringOuter: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#10b981',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center', paddingHorizontal: 24 },
  message: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, paddingHorizontal: 24 },
  btn: { marginTop: 24, borderRadius: 14, overflow: 'hidden', width: width - 128 },
  btnGradient: { paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
