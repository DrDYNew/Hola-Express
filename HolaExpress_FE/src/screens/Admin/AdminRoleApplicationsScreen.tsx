import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import adminService, {
  AdminRoleApplicationListItem,
  AdminRoleApplicationFilter,
} from '../../services/adminService';

type StatusTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
type RoleFilter = 'ALL' | 'SHIPPER' | 'OWNER';

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
  { key: 'ALL', label: 'Tất cả' },
];

const ROLE_FILTERS: { key: RoleFilter; label: string; icon: string; color: string }[] = [
  { key: 'ALL', label: 'Tất cả', icon: 'account-group', color: '#6b7280' },
  { key: 'SHIPPER', label: 'Shipper', icon: 'moped', color: '#4CAF50' },
  { key: 'OWNER', label: 'Chủ quán', icon: 'store', color: '#FF6B6B' },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const PAGE_SIZE = 10;

export default function AdminRoleApplicationsScreen({ navigation }: any) {
  const [items, setItems] = useState<AdminRoleApplicationListItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [activeTab, setActiveTab] = useState<StatusTab>('PENDING');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [search, setSearch] = useState('');
  const searchDebounce = useRef<NodeJS.Timeout | null>(null);

  const buildFilter = useCallback(
    (p: number, s: string): AdminRoleApplicationFilter => ({
      page: p,
      limit: PAGE_SIZE,
      status: activeTab === 'ALL' ? undefined : activeTab,
      requestedRole: roleFilter === 'ALL' ? undefined : roleFilter,
      search: s.trim() || undefined,
    }),
    [activeTab, roleFilter],
  );

  const loadStats = useCallback(async () => {
    const res = await adminService.getAdminRoleApplicationStats();
    if (res.success && res.data) setStats(res.data);
  }, []);

  const loadApplications = useCallback(
    async (p: number = 1, s: string = search, append = false) => {
      if (p === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const filter = buildFilter(p, s);
        const res = await adminService.getAdminRoleApplications(filter);
        if (res.success && res.data) {
          setItems(prev => (append ? [...prev, ...res.data!.items] : res.data!.items));
          setPage(res.data.page);
          setTotalPages(res.data.totalPages);
          setTotal(res.data.total);
        } else {
          Alert.alert('Lỗi', res.message || 'Không thể tải danh sách');
        }
      } catch {
        Alert.alert('Lỗi', 'Không thể tải danh sách đơn đăng ký');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [buildFilter, search],
  );

  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadApplications(1, search, false);
    }, [activeTab, roleFilter]),
  );

  const handleTabChange = (tab: StatusTab) => {
    setActiveTab(tab);
    setItems([]);
  };

  const handleRoleFilter = (role: RoleFilter) => {
    setRoleFilter(role);
    setItems([]);
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setItems([]);
      loadApplications(1, text, false);
    }, 400);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
    loadApplications(1, search, false);
  };

  const handleLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    loadApplications(page + 1, search, true);
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const renderStats = () => (
    <View style={styles.statsRow}>
      {[
        { key: 'PENDING', icon: 'clock-outline', color: '#f59e0b' },
        { key: 'APPROVED', icon: 'check-circle-outline', color: '#10b981' },
        { key: 'REJECTED', icon: 'close-circle-outline', color: '#ef4444' },
      ].map(s => (
        <TouchableOpacity
          key={s.key}
          style={styles.statChip}
          onPress={() => handleTabChange(s.key as StatusTab)}
        >
          <MaterialCommunityIcons name={s.icon as any} size={18} color={s.color} />
          <Text style={[styles.statCount, { color: s.color }]}>{stats[s.key] ?? 0}</Text>
          <Text style={styles.statLabel}>{STATUS_LABEL[s.key]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: AdminRoleApplicationListItem }) => {
    const isShipper = item.requestedRole === 'SHIPPER';
    const statusColor = STATUS_COLOR[item.status] ?? '#6b7280';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('AdminRoleApplicationDetail', { applicationId: item.applicationId })
        }
        activeOpacity={0.85}
      >
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.roleIcon,
              { backgroundColor: isShipper ? '#4CAF5015' : '#FF6B6B15' },
            ]}
          >
            <MaterialCommunityIcons
              name={isShipper ? 'moped' : 'store'}
              size={26}
              color={isShipper ? '#4CAF50' : '#FF6B6B'}
            />
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.userName}>{item.userName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABEL[item.status] ?? item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.cardPhone}>{item.userPhone}</Text>
          <View style={styles.cardBottomRow}>
            <Text style={styles.roleLabel}>
              {isShipper ? 'Đăng ký Shipper' : 'Đăng ký Chủ quán'}
            </Text>
            <Text style={styles.dateText}>{formatDate(item.applicationDate)}</Text>
          </View>
          {item.processedByName && (
            <Text style={styles.processedBy}>Xét duyệt bởi: {item.processedByName}</Text>
          )}
        </View>

        <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn đăng ký vai trò</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      {renderStats()}

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên, số điện thoại, email..."
          value={search}
          onChangeText={handleSearchChange}
          placeholderTextColor="#bbb"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#bbb" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role filter chips */}
      <View style={styles.roleFilterRow}>
        {ROLE_FILTERS.map(rf => (
          <TouchableOpacity
            key={rf.key}
            style={[
              styles.roleChip,
              roleFilter === rf.key && { backgroundColor: rf.color + '20', borderColor: rf.color },
            ]}
            onPress={() => handleRoleFilter(rf.key)}
          >
            <MaterialCommunityIcons
              name={rf.icon as any}
              size={14}
              color={roleFilter === rf.key ? rf.color : '#999'}
            />
            <Text
              style={[
                styles.roleChipText,
                roleFilter === rf.key && { color: rf.color, fontWeight: '700' },
              ]}
            >
              {rf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status tabs */}
      <View style={styles.tabBar}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => handleTabChange(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            {tab.key !== 'ALL' && stats[tab.key] !== undefined && (
              <View
                style={[
                  styles.tabBadge,
                  { backgroundColor: activeTab === tab.key ? '#7c3aed' : '#e5e7eb' },
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    { color: activeTab === tab.key ? '#fff' : '#6b7280' },
                  ]}
                >
                  {stats[tab.key] ?? 0}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="file-document-outline" size={72} color="#e0e0e0" />
          <Text style={styles.emptyTitle}>Không có đơn nào</Text>
          <Text style={styles.emptyText}>Không có kết quả phù hợp với bộ lọc hiện tại</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.applicationId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#7c3aed']} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListFooterComponentStyle={{ paddingBottom: 16 }}
        />
      )}

      {/* Total count */}
      {!loading && items.length > 0 && (
        <View style={styles.totalBar}>
          <Text style={styles.totalText}>Tổng: {total} đơn</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  statCount: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#888' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },

  roleFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  roleChipText: { fontSize: 12, color: '#999' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#7c3aed' },
  tabText: { fontSize: 12, color: '#999' },
  activeTabText: { color: '#7c3aed', fontWeight: '700' },
  tabBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeText: { fontSize: 10, fontWeight: '700' },

  list: { padding: 12, gap: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  cardLeft: {},
  roleIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: { fontSize: 15, fontWeight: '700', color: '#1f2937', flex: 1, marginRight: 8 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardPhone: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleLabel: { fontSize: 12, color: '#9ca3af' },
  dateText: { fontSize: 11, color: '#bbb' },
  processedBy: { fontSize: 11, color: '#a78bfa', marginTop: 2 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 10, color: '#7c3aed' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 6 },

  loadMoreContainer: { paddingVertical: 16, alignItems: 'center' },

  totalBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  totalText: { fontSize: 13, color: '#6b7280' },
});
