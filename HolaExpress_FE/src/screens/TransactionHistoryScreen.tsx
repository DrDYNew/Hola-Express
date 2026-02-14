import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import walletService, { Transaction } from '../services/walletService';

export default function TransactionHistoryScreen({ navigation }: any) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      const data = await walletService.getTransactionHistory(pageNum, 20);
      // Show all transactions including pending/failed deposits
      
      if (pageNum === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions((prev) => [...prev, ...data.transactions]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadTransactions(page + 1);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'wallet-plus';
      case 'WITHDRAW':
        return 'wallet-minus';
      case 'PAYMENT':
        return 'cart';
      case 'REFUND':
        return 'cash-refund';
      case 'COMMISSION_DEDUCTION':
        return 'percent';
      case 'COD_COLLECTION':
        return 'cash-check';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'REFUND':
      case 'COD_COLLECTION':
        return '#10B981';
      case 'WITHDRAW':
      case 'PAYMENT':
      case 'COMMISSION_DEDUCTION':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'Nạp tiền';
      case 'WITHDRAW':
        return 'Rút tiền';
      case 'PAYMENT':
        return 'Thanh toán';
      case 'REFUND':
        return 'Hoàn tiền';
      case 'COMMISSION_DEDUCTION':
        return 'Phí dịch vụ';
      case 'COD_COLLECTION':
        return 'Thu hộ COD';
      default:
        return type;
    }
  };

  const getTransactionStatus = (transaction: Transaction) => {
    if (transaction.transactionType === 'DEPOSIT') {
      if (transaction.amount === 0) {
        return { text: 'Chưa thanh toán', color: '#F59E0B', bgColor: '#FEF3C7' };
      } else if (transaction.amount > 0) {
        return { text: 'Thành công', color: '#10B981', bgColor: '#D1FAE5' };
      }
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
      return 'Vừa xong';
    } else if (hours < 24) {
      return `${hours} giờ trước`;
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667EEA" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
          if (isCloseToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.map((transaction, index) => {
              const isPositive = transaction.amount > 0;
              const color = getTransactionColor(transaction.transactionType);

              return (
                <View key={transaction.transactionId || index} style={styles.transactionCard}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIconContainer, { backgroundColor: color + '15' }]}>
                      <MaterialCommunityIcons
                        name={getTransactionIcon(transaction.transactionType)}
                        size={24}
                        color={color}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <View style={styles.transactionTypeRow}>
                        <Text style={styles.transactionType}>
                          {getTransactionLabel(transaction.transactionType)}
                        </Text>
                        {getTransactionStatus(transaction) && (
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: getTransactionStatus(transaction)!.bgColor }
                          ]}>
                            <Text style={[
                              styles.statusText,
                              { color: getTransactionStatus(transaction)!.color }
                            ]}>
                              {getTransactionStatus(transaction)!.text}
                            </Text>
                          </View>
                        )}
                      </View>
                      {transaction.description && (
                        <Text style={styles.transactionDescription} numberOfLines={1}>
                          {transaction.description}
                        </Text>
                      )}
                      <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, { color }]}>
                    {isPositive ? '+' : ''}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              );
            })}

            {loading && page > 1 && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#667EEA" />
              </View>
            )}

            {!hasMore && transactions.length > 0 && (
              <View style={styles.endMessage}>
                <Text style={styles.endMessageText}>Đã hiển thị tất cả giao dịch</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  transactionsList: {
    padding: 16,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  transactionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endMessage: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endMessageText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
