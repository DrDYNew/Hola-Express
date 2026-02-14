import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import financialService from '../../services/financialService';

interface RefundRequest {
  id: number;
  orderCode: string;
  customerName: string;
  storeName: string;
  orderAmount: number;
  refundAmount: number;
  reason: string;
  requestDate: string;
  status: string;
  adminNote?: string;
  processedAt?: string;
}

export default function RefundManagement({ navigation }: any) {
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRefunds();
  }, [selectedFilter]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const response = await financialService.getRefundRequests(selectedFilter);
      
      if (response.success && response.data) {
        setRefundRequests(response.data);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tải danh sách hoàn tiền');
      }
    } catch (error) {
      console.error('Error loading refunds:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách hoàn tiền');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRefunds();
    setRefreshing(false);
  };

  const filteredRequests = refundRequests.filter(req => {
    const matchesSearch = 
      req.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.storeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    pending: refundRequests.filter(r => r.status === 'PENDING').length,
    processing: refundRequests.filter(r => r.status === 'APPROVED').length,
    totalAmount: refundRequests
      .filter(r => r.status === 'PENDING' || r.status === 'APPROVED')
      .reduce((sum, r) => sum + r.refundAmount, 0),
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    if (!adminNote.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập ghi chú');
      return;
    }

    Alert.alert(
      'Xác nhận duyệt',
      `Duyệt hoàn tiền ${selectedRequest.refundAmount.toLocaleString('vi-VN')} đ?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Duyệt',
          onPress: async () => {
            try {
              const response = await financialService.processRefund(
                selectedRequest.id,
                'APPROVED',
                adminNote
              );
              
              if (response.success) {
                setShowDetailModal(false);
                setAdminNote('');
                Alert.alert('Thành công', 'Đã duyệt yêu cầu hoàn tiền');
                loadRefunds(); // Reload data
              } else {
                Alert.alert('Lỗi', response.message || 'Không thể duyệt hoàn tiền');
              }
            } catch (error) {
              console.error('Error approving refund:', error);
              Alert.alert('Lỗi', 'Không thể duyệt hoàn tiền');
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!adminNote.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối');
      return;
    }

    Alert.alert(
      'Xác nhận từ chối',
      'Bạn có chắc muốn từ chối yêu cầu này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await financialService.processRefund(
                selectedRequest.id,
                'REJECTED',
                adminNote
              );
              
              if (response.success) {
                setShowDetailModal(false);
                setAdminNote('');
                Alert.alert('Thành công', 'Đã từ chối yêu cầu');
                loadRefunds(); // Reload data
              } else {
                Alert.alert('Lỗi', response.message || 'Không thể từ chối hoàn tiền');
              }
            } catch (error) {
              console.error('Error rejecting refund:', error);
              Alert.alert('Lỗi', 'Không thể từ chối hoàn tiền');
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    if (!selectedRequest) return;

    Alert.alert(
      'Xác nhận hoàn tiền',
      'Xác nhận đã hoàn tiền thành công cho khách hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const response = await financialService.processRefund(
                selectedRequest.id,
                'COMPLETED',
                selectedRequest.adminNote || ''
              );
              
              if (response.success) {
                setShowDetailModal(false);
                Alert.alert('Thành công', 'Đã hoàn tất hoàn tiền');
                loadRefunds(); // Reload data
              } else {
                Alert.alert('Lỗi', response.message || 'Không thể hoàn tất hoàn tiền');
              }
            } catch (error) {
              console.error('Error completing refund:', error);
              Alert.alert('Lỗi', 'Không thể hoàn tất hoàn tiền');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'APPROVED': return '#9C27B0';
      case 'COMPLETED': return '#4CAF50';
      case 'REJECTED': return '#F44336';
      default: return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã duyệt';
      case 'COMPLETED': return 'Hoàn tất';
      case 'REJECTED': return 'Từ chối';
      default: return status;
    }
  };

  const renderRefundCard = (request: RefundRequest) => (
    <TouchableOpacity
      key={request.id}
      style={styles.card}
      onPress={() => {
        setSelectedRequest(request);
        setAdminNote(request.adminNote || '');
        setShowDetailModal(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderCode}>{request.orderCode}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
          </View>
        </View>
        <Text style={styles.refundAmount}>{request.refundAmount.toLocaleString('vi-VN')} đ</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account" size={16} color="#666" />
          <Text style={styles.infoLabel}>Khách hàng:</Text>
          <Text style={styles.infoValue}>{request.customerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="store" size={16} color="#666" />
          <Text style={styles.infoLabel}>Cửa hàng:</Text>
          <Text style={styles.infoValue}>{request.storeName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={16} color="#666" />
          <Text style={styles.infoLabel}>Thời gian:</Text>
          <Text style={styles.infoValue}>{request.requestDate}</Text>
        </View>
        <View style={styles.reasonContainer}>
          <MaterialCommunityIcons name="message-text" size={16} color="#666" />
          <Text style={styles.reasonText} numberOfLines={2}>{request.reason}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!selectedRequest) return null;

    return (
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết hoàn tiền</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Status Badge */}
              <View style={styles.modalStatusContainer}>
                <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedRequest.status) }]}>
                  <Text style={styles.modalStatusText}>{getStatusText(selectedRequest.status)}</Text>
                </View>
              </View>

              {/* Order Info */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã đơn:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.orderCode}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Khách hàng:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.customerName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cửa hàng:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.storeName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Giá trị đơn:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.orderAmount.toLocaleString('vi-VN')} đ</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số tiền hoàn:</Text>
                  <Text style={[styles.detailValue, { color: '#F44336', fontWeight: 'bold' }]}>
                    {selectedRequest.refundAmount.toLocaleString('vi-VN')} đ
                  </Text>
                </View>
              </View>

              {/* Refund Reason */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Lý do hoàn tiền</Text>
                <Text style={styles.reasonDetailText}>{selectedRequest.reason}</Text>
              </View>

              {/* Admin Note */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Ghi chú quản trị</Text>
                <TextInput
                  style={styles.noteInput}
                  value={adminNote}
                  onChangeText={setAdminNote}
                  placeholder="Nhập ghi chú hoặc lý do từ chối..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={selectedRequest.status === 'PENDING'}
                />
              </View>
            </ScrollView>

            {/* Actions */}
            {selectedRequest.status === 'PENDING' && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.rejectButton]}
                  onPress={handleReject}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color="#FFF" />
                  <Text style={styles.modalButtonText}>Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.approveButton]}
                  onPress={handleApprove}
                >
                  <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
                  <Text style={styles.modalButtonText}>Duyệt</Text>
                </TouchableOpacity>
              </View>
            )}
            {selectedRequest.status === 'APPROVED' && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.completeButton]}
                  onPress={handleComplete}
                >
                  <MaterialCommunityIcons name="cash-check" size={20} color="#FFF" />
                  <Text style={styles.modalButtonText}>Xác nhận hoàn tiền</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý hoàn tiền</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#FF9800" />
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Chờ duyệt</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="progress-clock" size={24} color="#2196F3" />
          <Text style={styles.statValue}>{stats.processing}</Text>
          <Text style={styles.statLabel}>Đang xử lý</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="cash-refund" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{(stats.totalAmount / 1000000).toFixed(1)}M</Text>
          <Text style={styles.statLabel}>Tổng số tiền</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo mã đơn, khách hàng, cửa hàng..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {[
          { key: '', label: 'Tất cả' },
          { key: 'PENDING', label: 'Chờ duyệt' },
          { key: 'APPROVED', label: 'Đã duyệt' },
          { key: 'COMPLETED', label: 'Hoàn tất' },
          { key: 'REJECTED', label: 'Từ chối' }
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterButton, selectedFilter === filter.key && styles.filterButtonActive]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[styles.filterButtonText, selectedFilter === filter.key && styles.filterButtonTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map(renderRefundCard)
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cash-refund" size={60} color="#CCC" />
            <Text style={styles.emptyText}>Không có yêu cầu hoàn tiền nào</Text>
          </View>
        )}
      </ScrollView>

      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  filterContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderCode: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  refundAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  cardBody: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    width: 90,
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  reasonContainer: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  reasonText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalStatusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalStatusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalStatusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  reasonDetailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  approveButton: {
    backgroundColor: '#2196F3',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
