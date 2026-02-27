import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import notificationService, { NotificationItem } from '../services/notificationService';

interface Props { navigation: any; }

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  ORDER_PLACED:    { icon: 'shopping',         color: '#4A90E2', bg: '#EBF3FF' },
  ORDER_CONFIRMED: { icon: 'check-circle',      color: '#27AE60', bg: '#E8F8EF' },
  ORDER_PREPARING: { icon: 'chef-hat',          color: '#F39C12', bg: '#FEF6E7' },
  ORDER_READY:     { icon: 'package-variant',   color: '#8E44AD', bg: '#F5EEF8' },
  ORDER_CANCELLED: { icon: 'close-circle',      color: '#E74C3C', bg: '#FDEEEE' },
  WALLET_TOPUP:    { icon: 'wallet-plus',       color: '#27AE60', bg: '#E8F8EF' },
  WALLET_WITHDRAW: { icon: 'bank-transfer-out', color: '#E67E22', bg: '#FDF2E9' },
  RIDE_BOOKED:     { icon: 'car',               color: '#16A085', bg: '#E8F8F5' },
  RIDE_ACCEPTED:   { icon: 'car-connected',     color: '#1ABC9C', bg: '#E8F8F5' },
  GENERAL:         { icon: 'bell',              color: '#7F8C8D', bg: '#F2F3F4' },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG['GENERAL'];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export default function NotificationsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => { loadData(true); }, []);

  const loadData = async (reset = false) => {
    try {
      const p = reset ? 1 : page;
      const { list, unreadCount: cnt } = await notificationService.getNotifications(p, 20);
      if (reset) {
        setNotifications(list);
      } else {
        setNotifications((prev) => [...prev, ...list]);
      }
      setUnreadCount(cnt);
      setHasMore(list.length >= 20);
      if (!reset) setPage((prev) => prev + 1);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => { setIsRefreshing(true); loadData(true); };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) { setIsLoadingMore(true); loadData(false); }
  };

  const handleMarkRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    await notificationService.markRead(item.notiId);
    setNotifications((prev) => prev.map((n) => n.notiId === item.notiId ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleDelete = (item: NotificationItem) => {
    Alert.alert('Xóa thông báo', 'Bạn có chắc muốn xóa thông báo này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        await notificationService.delete(item.notiId);
        setNotifications((prev) => prev.filter((n) => n.notiId !== item.notiId));
        if (!item.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      }},
    ]);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const cfg = getConfig(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        activeOpacity={0.75}
        onPress={() => handleMarkRead(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <MaterialCommunityIcons name={cfg.icon as any} size={24} color={cfg.color} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      <LinearGradient colors={['#4A90E2', '#5BA3F5']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Thông Báo</Text>
            {unreadCount > 0 && <Text style={styles.headerSub}>{unreadCount} chưa đọc</Text>}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
              <MaterialCommunityIcons name="check-all" size={20} color="#FFF" />
              <Text style={styles.markAllText}>Đọc tất cả</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={{ marginTop: 10, color: '#888' }}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.notiId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#4A90E2']} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="bell-sleep-outline" size={80} color="#DDD" />
              <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
              <Text style={styles.emptySub}>Các thông báo về đơn hàng, ví, xe sẽ hiển thị ở đây</Text>
            </View>
          }
          ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#4A90E2" style={{ marginVertical: 16 }} /> : null}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingTop: 12, paddingBottom: 16, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, gap: 4,
  },
  markAllText: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row', backgroundColor: '#FFF',
    borderRadius: 14, marginBottom: 10, padding: 14,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#4A90E2', backgroundColor: '#FAFCFF' },
  iconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#444' },
  cardTitleUnread: { color: '#111', fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4A90E2', marginLeft: 6 },
  cardMessage: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 5 },
  cardTime: { fontSize: 11, color: '#AAA' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#555', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
