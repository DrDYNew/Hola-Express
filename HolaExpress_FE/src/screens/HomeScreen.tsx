import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Animated,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import homeService, { Category, Store, Product, Banner } from '../services/homeService';

const { width } = Dimensions.get('window');



interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Location state
  const [currentLocation, setCurrentLocation] = useState<string>('Đang lấy vị trí...');
  const [userCoords, setUserCoords] = useState<{latitude: number, longitude: number} | null>(null);

  // Data from BE
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [utilities, setUtilities] = useState<Category[]>([]);
  const [flashSaleItems, setFlashSaleItems] = useState<Product[]>([]);
  const [restaurants, setRestaurants] = useState<Store[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Store[]>([]);
  const [recommendedStores, setRecommendedStores] = useState<Store[]>([]);

  // Flash sale countdown (mock - would be calculated from server time)
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 34, seconds: 15 });

  // Facebook popup state
  const [showFBPopup, setShowFBPopup] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // Load location
  useEffect(() => {
    getUserLocation();
  }, []);

  // Load data after getting location
  useEffect(() => {
    if (userCoords || currentLocation === 'Không lấy được vị trí') {
      loadData();
    }
  }, [userCoords]);

  // Filter restaurants when search or category changes
  useEffect(() => {
    filterRestaurants();
  }, [searchQuery, selectedCategory, allRestaurants]);

  // Countdown timer for flash sale
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev; // Nếu hết thời gian thì giữ nguyên
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Animate Facebook popup on mount
  useEffect(() => {
    if (showFBPopup) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showFBPopup]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentLocation('Chọn địa chỉ');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        // Build address từ các phần có sẵn, bỏ qua các phần rỗng hoặc "Unnamed"
        const parts = [
          address.streetNumber,
          address.street,
          address.subregion,
          address.district,
          address.city
        ].filter(part => part && part.toLowerCase() !== 'unnamed');
        
        const shortAddress = parts.length > 0 
          ? parts.slice(0, 2).join(', ') // Lấy 2 phần đầu
          : 'Vị trí hiện tại';
        setCurrentLocation(shortAddress);
      } else {
        setCurrentLocation('Vị trí hiện tại');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setCurrentLocation('Không lấy được vị trí');
    }
  };

  const filterRestaurants = () => {
    let filtered = [...allRestaurants];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(store => 
        store.storeName.toLowerCase().includes(query) ||
        (store.tags || []).some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory) {
      // This would need category mapping from backend
      // For now, filter by tags
      const category = categories.find(c => c.categoryId.toString() === selectedCategory);
      if (category) {
        filtered = filtered.filter(store =>
          (store.tags || []).some(tag => 
            tag.toLowerCase().includes(category.categoryName.toLowerCase())
          )
        );
      }
    }

    setRestaurants(filtered);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get stores with user location for accurate distance
      const storesParams: any = { page: 1, pageSize: 50 };
      if (userCoords) {
        storesParams.userLat = userCoords.latitude;
        storesParams.userLng = userCoords.longitude;
      }

      const [bannersData, categoriesData, utilitiesData, flashSaleData, storesData] = await Promise.all([
        homeService.getBanners(),
        homeService.getCategories(),
        homeService.getUtilities(),
        homeService.getFlashSaleProducts(),
        homeService.getStores(storesParams),
      ]);

      setBanners(bannersData.filter(b => b.isActive));
      setCategories(categoriesData);
      setUtilities(utilitiesData);
      setFlashSaleItems(flashSaleData);
      setAllRestaurants(storesData);
      setRestaurants(storesData);
      setRecommendedStores(storesData.slice(0, 4));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get smart recommendation title based on time
  const getRecommendationTitle = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'Bữa Sáng Ngon';
    if (hour >= 11 && hour < 14) return 'Bữa Trưa Nhanh';
    if (hour >= 14 && hour < 17) return 'Ăn Vặt';
    if (hour >= 17 && hour < 21) return 'Bữa Tối Ngon';
    return 'Đêm Khuya Hungry';
  };

  const renderBannerItem = ({ item }: { item: Banner }) => (
    <View style={styles.bannerItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
    </View>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const handlePress = () => {
      // Nếu là utility "Gần bạn" thì navigate đến map
      if (item.categoryName.toLowerCase().includes('gần')) {
        navigation.navigate('NearbyStoresMap');
      } else {
        // Nếu không thì filter theo category
        setSelectedCategory(item.categoryId.toString());
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          selectedCategory === item.categoryId.toString() && styles.categoryItemActive,
        ]}
        onPress={handlePress}
      >
        <View style={[styles.categoryIcon, { backgroundColor: (item.color || '#4A90E2') + '20' }]}>
          <MaterialCommunityIcons 
            name={(item.icon || 'silverware-fork-knife') as any} 
            size={28} 
            color={item.color || '#4A90E2'}
          />
        </View>
        <Text style={styles.categoryText}>{item.categoryName}</Text>
      </TouchableOpacity>
    );
  };

  const renderFlashSaleItem = ({ item }: { item: Product }) => {
    const originalPrice = item.basePrice || 0;
    const salePrice = item.discount 
      ? (item.basePrice || 0) * (1 - item.discount / 100) 
      : (item.basePrice || 0);
    const soldCount = 45; // Mock - should come from BE
    const totalStock = 100; // Mock - should come from BE
    const soldPercent = (soldCount / totalStock) * 100;
    
    return (
      <TouchableOpacity style={styles.flashSaleItem}>
        <Image source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/150' }} style={styles.flashSaleImage} />
        <View style={styles.flashSaleBadge}>
          <Text style={styles.flashSaleBadgeText}>FLASH SALE</Text>
        </View>
        <View style={styles.flashSaleInfo}>
          <Text style={styles.flashSaleName} numberOfLines={1}>
            {item.productName}
          </Text>
          <Text style={styles.flashSaleRestaurant} numberOfLines={1}>
            {item.description || ''}
          </Text>
          <View style={styles.flashSalePriceRow}>
            <Text style={styles.flashSalePrice}>{salePrice.toLocaleString()}đ</Text>
            {item.discount && (
              <Text style={styles.flashSaleOriginalPrice}>
                {originalPrice.toLocaleString()}đ
              </Text>
            )}
          </View>
          {/* Progress bar */}
          <View style={styles.flashSaleProgressBg}>
            <LinearGradient
              colors={['#4A90E2', '#5BA3F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.flashSaleProgress, { width: `${soldPercent}%` }]}
            />
          </View>
          <Text style={styles.flashSaleSold}>Đã bán {soldCount}/{totalStock}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRestaurantItem = ({ item }: { item: Store }) => (
    <TouchableOpacity 
      style={styles.restaurantCard}
      onPress={() => navigation.navigate('StoreDetail', { storeId: item.storeId })}
    >
      <View style={styles.restaurantImageContainer}>
        <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/120' }} style={styles.restaurantImage} />
        {item.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount}</Text>
          </View>
        )}
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {item.storeName}
        </Text>
        <View style={styles.restaurantMeta}>
          <Ionicons name="star" size={14} color="#FFB800" />
          <Text style={styles.restaurantRating}>
            {item.rating > 0 ? item.rating.toFixed(1) : 'Mới'}
          </Text>
          <Text style={styles.restaurantDot}>•</Text>
          <Text style={styles.restaurantTime}>{item.deliveryTime || 30} phút</Text>
          <Text style={styles.restaurantDot}>•</Text>
          <Text style={styles.restaurantDistance}>
            {item.distance ? `${item.distance.toFixed(1)} km` : 'N/A'}
          </Text>
        </View>
        <View style={styles.restaurantTags}>
          {(item.tags || []).slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.restaurantTag}>
              <Text style={styles.restaurantTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleLoadMore = async () => {
    if (!isLoadingMore) {
      setIsLoadingMore(true);
      try {
        const moreStores = await homeService.getStores({ 
          page: Math.floor(restaurants.length / 20) + 1, 
          pageSize: 20 
        });
        if (moreStores.length > 0) {
          setRestaurants([...restaurants, ...moreStores]);
        }
      } catch (error) {
        console.error('Error loading more:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ marginTop: 12, color: '#666' }}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#4A90E2', '#5BA3F5']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#FFFFFF" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Giao đến</Text>
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={getUserLocation}
              >
                <Text style={styles.locationText} numberOfLines={1}>
                  {currentLocation}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>5</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm món ăn, quán ăn..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={filterRestaurants}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {
              // Show filter modal or reset filters
              setSelectedCategory(null);
              setSearchQuery('');
            }}
          >
            <MaterialCommunityIcons 
              name={selectedCategory || searchQuery ? "filter-off" : "tune-variant"} 
              size={22} 
              color="#4A90E2" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Banner Carousel */}
        {banners.length > 0 && (
          <View style={styles.section}>
            <FlatList
              horizontal
              data={banners}
              renderItem={renderBannerItem}
              keyExtractor={(item) => item.bannerId.toString()}
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              onMomentumScrollEnd={(event) => {
                const index = Math.floor(
                  event.nativeEvent.contentOffset.x / (width - 32)
                );
                setCurrentBanner(index);
              }}
            />
            <View style={styles.bannerIndicators}>
              {banners.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.bannerIndicator,
                    currentBanner === index && styles.bannerIndicatorActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.categoryId.toString()}
              numColumns={4}
              scrollEnabled={false}
              columnWrapperStyle={styles.categoryRow}
            />
          </View>
        )}

        {/* Utilities */}
        {utilities.length > 0 && (
          <View style={styles.section}>
            <FlatList
              data={utilities}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => `utility-${item.categoryId}`}
              numColumns={4}
              scrollEnabled={false}
              columnWrapperStyle={styles.categoryRow}
            />
          </View>
        )}

        {/* Smart Recommendations */}
        {recommendedStores.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="lightbulb-on" size={24} color="#4A90E2" />
                <Text style={styles.sectionTitle}>{getRecommendationTitle()}</Text>
              </View>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={recommendedStores}
              renderItem={renderRestaurantItem}
              keyExtractor={(item) => `rec-${item.storeId}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            />
          </View>
        )}

        {/* Flash Sale */}
        {flashSaleItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.flashSaleHeader}>
              <View style={styles.flashSaleTitleContainer}>
                <MaterialCommunityIcons name="flash" size={28} color="#4A90E2" />
                <Text style={styles.flashSaleTitle}>FLASH SALE</Text>
              </View>
              <View style={styles.flashSaleCountdown}>
                <Text style={styles.flashSaleCountdownLabel}>Kết thúc sau</Text>
                <View style={styles.flashSaleTime}>
                  <View style={styles.flashSaleTimeBox}>
                    <Text style={styles.flashSaleTimeText}>
                      {countdown.hours.toString().padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={styles.flashSaleTimeColon}>:</Text>
                  <View style={styles.flashSaleTimeBox}>
                    <Text style={styles.flashSaleTimeText}>
                      {countdown.minutes.toString().padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={styles.flashSaleTimeColon}>:</Text>
                  <View style={styles.flashSaleTimeBox}>
                    <Text style={styles.flashSaleTimeText}>
                      {countdown.seconds.toString().padStart(2, '0')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <FlatList
              horizontal
              data={flashSaleItems}
              renderItem={renderFlashSaleItem}
              keyExtractor={(item) => item.productId.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* All Restaurants */}
        {restaurants.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tất Cả Quán Ăn</Text>
            </View>
            {restaurants.map((item, index) => (
              <View key={`restaurant-${item.storeId}-${index}`}>{renderRestaurantItem({ item })}</View>
            ))}
            {isLoadingMore && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#4A90E2" />
                <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
              </View>
            )}
          </View>
        )}

        {/* Empty State */}
        {!isLoading && banners.length === 0 && categories.length === 0 && restaurants.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="food-off" size={80} color="#CCC" />
            <Text style={styles.emptyStateTitle}>Chưa có dữ liệu</Text>
            <Text style={styles.emptyStateText}>
              Backend chưa có API. Vui lòng triển khai API để hiển thị dữ liệu.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Facebook Popup - Floating ở góc phải */}
      {showFBPopup && (
        <Animated.View
          style={[
            styles.fbPopup,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fbCloseButton}
            onPress={() => {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => setShowFBPopup(false));
            }}
          >
            <MaterialCommunityIcons name="close" size={16} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.fbContent}
            onPress={() => Linking.openURL('https://www.facebook.com/drdynew.fpt/')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1877F2', '#0C63D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fbGradient}
            >
              <MaterialCommunityIcons name="facebook" size={18} color="#FFF" />
              <Text style={styles.fbText}>Follow</Text>
              <MaterialCommunityIcons name="chevron-right" size={14} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 4,
    maxWidth: width - 160,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  bannerItem: {
    width: width - 32,
    marginHorizontal: 16,
  },
  bannerImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  bannerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
    marginHorizontal: 4,
  },
  bannerIndicatorActive: {
    backgroundColor: '#4A90E2',
    width: 24,
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  categoryItem: {
    width: (width - 64) / 4,
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryItemActive: {
    opacity: 0.7,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  flashSaleHeader: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  flashSaleTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flashSaleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginLeft: 8,
  },
  flashSaleCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashSaleCountdownLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  flashSaleTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashSaleTimeBox: {
    backgroundColor: '#4A90E2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  flashSaleTimeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  flashSaleTimeColon: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 2,
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  flashSaleItem: {
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  flashSaleImage: {
    width: '100%',
    height: 120,
  },
  flashSaleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  flashSaleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  flashSaleInfo: {
    padding: 10,
  },
  flashSaleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  flashSaleRestaurant: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  flashSalePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flashSalePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginRight: 6,
  },
  flashSaleOriginalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  flashSaleProgressBg: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginBottom: 4,
  },
  flashSaleProgress: {
    height: '100%',
    borderRadius: 3,
  },
  flashSaleSold: {
    fontSize: 11,
    color: '#666',
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    minWidth: 200,
  },
  restaurantImageContainer: {
    position: 'relative',
  },
  restaurantImage: {
    width: 120,
    height: 120,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  restaurantInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantRating: {
    fontSize: 13,
    color: '#333',
    marginLeft: 4,
    fontWeight: '600',
  },
  restaurantDot: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 6,
  },
  restaurantTime: {
    fontSize: 12,
    color: '#666',
  },
  restaurantDistance: {
    fontSize: 12,
    color: '#666',
  },
  restaurantTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  restaurantTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  restaurantTagText: {
    fontSize: 11,
    color: '#666',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Facebook Popup
  fbPopup: {
    position: 'absolute',
    top: 180,
    right: 0,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  fbCloseButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fbContent: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: 'hidden',
  },
  fbGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 8,
    gap: 6,
  },
  fbText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
