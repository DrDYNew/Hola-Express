import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import homeService, { Store, Category } from '../services/homeService';

interface ViewAllScreenProps {
  navigation: any;
  route: {
    params?: {
      initialSearch?: string;
      title?: string;
      categoryId?: number;
    };
  };
}

const ITEMS_PER_PAGE = 20;

export default function ViewAllScreen({ navigation, route }: ViewAllScreenProps) {
  const params = route?.params || {};
  const initialSearch = params.initialSearch || '';
  const screenTitle = params.title || 'Tất Cả Quán Ăn';
  const categoryId = params.categoryId;

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [stores, setStores] = useState<Store[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    categoryId ?? null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const searchRef = useRef<TextInput>(null);

  // Auto-focus search if coming from search bar tap
  useEffect(() => {
    if (initialSearch !== undefined) {
      setTimeout(() => searchRef.current?.focus(), 300);
    }
    loadInitialData();
  }, []);

  // Re-filter whenever query or category changes
  useEffect(() => {
    filterStores();
  }, [searchQuery, selectedCategory, allStores]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [storesData, categoriesData] = await Promise.all([
        homeService.getStores({ page: 1, pageSize: 50, categoryId }),
        homeService.getCategories(),
      ]);
      setAllStores(storesData);
      setStores(storesData);
      setCategories(categoriesData);
      setPage(1);
      setHasMore(storesData.length >= ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error loading ViewAllScreen data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStores = () => {
    let filtered = [...allStores];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.storeName.toLowerCase().includes(q) ||
          (s.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== null) {
      const cat = categories.find((c) => c.categoryId === selectedCategory);
      if (cat) {
        filtered = filtered.filter((s) =>
          (s.tags || []).some((t) =>
            t.toLowerCase().includes(cat.categoryName.toLowerCase())
          )
        );
      }
    }

    setStores(filtered);
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore || searchQuery.trim() || selectedCategory !== null) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const moreStores = await homeService.getStores({
        page: nextPage,
        pageSize: ITEMS_PER_PAGE,
        categoryId,
      });
      if (moreStores.length > 0) {
        setAllStores((prev) => [...prev, ...moreStores]);
        setPage(nextPage);
        setHasMore(moreStores.length >= ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more stores:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const renderCategoryChip = ({ item }: { item: Category }) => {
    const active = selectedCategory === item.categoryId;
    return (
      <TouchableOpacity
        style={[styles.chip, active && styles.chipActive]}
        onPress={() =>
          setSelectedCategory(active ? null : item.categoryId)
        }
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {item.categoryName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('StoreDetail', { storeId: item.storeId })}
    >
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/400x200' }}
        style={styles.cardImage}
      />
      {item.discount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discount}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.storeName}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="star" size={13} color="#FFB800" />
          <Text style={styles.cardMetaText}>
            {(item.rating ?? 0) > 0 ? (item.rating ?? 0).toFixed(1) : 'Mới'}
          </Text>
          <Text style={styles.dot}>•</Text>
          <MaterialCommunityIcons name="clock-outline" size={13} color="#888" />
          <Text style={styles.cardMetaText}>{item.deliveryTime || 30} phút</Text>
          <Text style={styles.dot}>•</Text>
          <MaterialCommunityIcons name="map-marker-outline" size={13} color="#888" />
          <Text style={styles.cardMetaText}>
            {item.distance ? `${item.distance.toFixed(1)} km` : 'N/A'}
          </Text>
        </View>
        {(item.tags || []).length > 0 && (
          <View style={styles.tagRow}>
            {(item.tags || []).slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="food-off" size={72} color="#CCC" />
      <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
      <Text style={styles.emptySubtitle}>Thử từ khóa hoặc danh mục khác</Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4A90E2" />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header */}
      <LinearGradient colors={['#4A90E2', '#5BA3F5']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{screenTitle}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Tìm món ăn, quán ăn..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Category Chips */}
      {categories.length > 0 && (
        <View style={styles.chipBar}>
          <FlatList
            horizontal
            data={categories}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => `cat-${item.categoryId}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          />
        </View>
      )}

      {/* Active filters info */}
      {(searchQuery.trim() || selectedCategory !== null) && !isLoading && (
        <View style={styles.filterInfo}>
          <Text style={styles.filterInfoText}>
            {stores.length} kết quả
            {searchQuery.trim() ? ` cho "${searchQuery.trim()}"` : ''}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
          >
            <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={stores}
          renderItem={renderStoreItem}
          keyExtractor={(item, index) => `store-${item.storeId}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 0,
  },
  chipBar: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  chipList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#D0DEFF',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  chipText: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
  },
  filterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  filterInfoText: {
    fontSize: 13,
    color: '#555',
  },
  clearFilterText: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  cardMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 3,
  },
  dot: {
    fontSize: 12,
    color: '#CCC',
    marginHorizontal: 5,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F0F4FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: '#4A90E2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#888',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#555',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#888',
  },
});
