import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import walletService, { Wallet, Transaction } from '../services/walletService';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

const { width } = Dimensions.get('window');

export default function WalletScreen({ navigation }: any) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, historyData] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactionHistory(1, 10),
      ]);
      setWallet(walletData);
      // Show all transactions including pending/failed deposits
      setTransactions(historyData.transactions);
    } catch (error: any) {
      setErrorMessage(error.message || 'Không thể tải thông tin ví');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'TOP_UP':
        return { name: 'arrow-down-circle', color: '#10B981' };
      case 'WITHDRAW':
        return { name: 'arrow-up-circle', color: '#EF4444' };
      case 'PAYMENT':
        return { name: 'shopping', color: '#F59E0B' };
      case 'REFUND':
        return { name: 'cash-refund', color: '#3B82F6' };
      case 'COD_COLLECTION':
        return { name: 'cash', color: '#10B981' };
      default:
        return { name: 'swap-horizontal', color: '#6B7280' };
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

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'TOP_UP':
        return 'Nạp tiền';
      case 'WITHDRAW':
        return 'Rút tiền';
      case 'PAYMENT':
        return 'Thanh toán';
      case 'REFUND':
        return 'Hoàn tiền';
      case 'COD_COLLECTION':
        return 'Thu tiền COD';
      case 'COMMISSION_DEDUCTION':
        return 'Trừ hoa hồng';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ví của tôi</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <MaterialCommunityIcons name="wallet" size={32} color="#FFF" />
            <View style={styles.balanceTextContainer}>
              <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(wallet?.balance || 0)}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('TopUp')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#10B981' }]}>
                <MaterialCommunityIcons name="plus-circle" size={24} color="#FFF" />
              </View>
              <Text style={styles.actionButtonText}>Nạp tiền</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Withdraw', { currentBalance: wallet?.balance || 0 })}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#EF4444' }]}>
                <MaterialCommunityIcons name="minus-circle" size={24} color="#FFF" />
              </View>
              <Text style={styles.actionButtonText}>Rút tiền</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('TransactionHistory')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#3B82F6' }]}>
                <MaterialCommunityIcons name="history" size={24} color="#FFF" />
              </View>
              <Text style={styles.actionButtonText}>Lịch sử</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="history" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => {
                const icon = getTransactionIcon(transaction.transactionType);
                return (
                  <View key={transaction.transactionId} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.transactionIcon, { backgroundColor: `${icon.color}20` }]}>
                        <MaterialCommunityIcons
                          name={icon.name as any}
                          size={24}
                          color={icon.color}
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <View style={styles.transactionTitleRow}>
                          <Text style={styles.transactionTitle}>
                            {getTransactionTypeText(transaction.transactionType)}
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
                        <Text style={styles.transactionDesc}>{transaction.description}</Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(transaction.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color:
                            transaction.amount >= 0
                              ? '#10B981'
                              : '#EF4444',
                        },
                      ]}
                    >
                      {transaction.amount >= 0 ? '+' : ''}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />

      <ErrorModal
        visible={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginLeft: 12,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  balanceTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#667EEA',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  section: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 12,
  },
  transactionsList: {
    paddingHorizontal: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  transactionTitle: {
    fontSize: 14,
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
  transactionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
