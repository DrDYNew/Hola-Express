import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import partnerService from '../../services/partnerService';
import { 
  PartnerApplication, 
  PartnerTypeLabels, 
  ApplicationStatusLabels,
  ApplicationStatusColors
} from '../../types/partner';

type FilterTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

export default function PartnerApplicationsScreen() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('PENDING');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState<PartnerApplication | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadApplications = async () => {
    try {
      if (activeTab === 'ALL') {
        // Load all pending first, can be improved to load all statuses
        const pending = await partnerService.getPendingApplications();
        const approved = await partnerService.getApplicationsByStatus('APPROVED');
        const rejected = await partnerService.getApplicationsByStatus('REJECTED');
        setApplications([...pending, ...approved, ...rejected]);
      } else {
        const data = activeTab === 'PENDING' 
          ? await partnerService.getPendingApplications()
          : await partnerService.getApplicationsByStatus(activeTab);
        setApplications(data);
      }
    } catch (error: any) {
      console.error('Error loading applications:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn đăng ký');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    filterApplications();
  }, [applications, activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadApplications();
    }, [activeTab])
  );

  const filterApplications = () => {
    if (activeTab === 'ALL') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(applications.filter(app => app.status === activeTab));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  const handleOpenModal = (app: PartnerApplication, status: 'APPROVED' | 'REJECTED') => {
    setSelectedApp(app);
    setProcessingStatus(status);
    setAdminNotes('');
    setRejectionReason('');
    setModalVisible(true);
  };

  const handleProcess = async () => {
    if (!selectedApp) return;

    if (processingStatus === 'REJECTED' && !rejectionReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setProcessing(true);
      await partnerService.processApplication({
        applicationId: selectedApp.applicationId,
        status: processingStatus,
        adminNotes: adminNotes.trim() || undefined,
        rejectionReason: processingStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
      });

      Alert.alert(
        'Thành công',
        processingStatus === 'APPROVED' 
          ? 'Đã phê duyệt đơn đăng ký' 
          : 'Đã từ chối đơn đăng ký'
      );

      setModalVisible(false);
      loadApplications();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể xử lý đơn đăng ký');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTabBar = () => {
    const tabs: { key: FilterTab; label: string; count?: number }[] = [
      { key: 'PENDING', label: 'Chờ duyệt' },
      { key: 'APPROVED', label: 'Đã duyệt' },
      { key: 'REJECTED', label: 'Đã từ chối' },
      { key: 'ALL', label: 'Tất cả' },
    ];

    return (
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderApplicationCard = ({ item }: { item: PartnerApplication }) => {
    const statusColor = ApplicationStatusColors[item.status];
    const isShipper = item.requestedRole === 'SHIPPER';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: isShipper ? '#4CAF501A' : '#FF6B6B1A' }]}>
            <MaterialCommunityIcons 
              name={isShipper ? 'moped' : 'store'} 
              size={28} 
              color={isShipper ? '#4CAF50' : '#FF6B6B'} 
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.roleText}>{PartnerTypeLabels[item.requestedRole]}</Text>
            <Text style={styles.userText}>Người nộp: {item.userName}</Text>
            <Text style={styles.dateText}>
              {formatDate(item.applicationDate)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {ApplicationStatusLabels[item.status]}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {isShipper ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>GPLX:</Text>
                <Text style={styles.infoValue}>{item.licenseNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Biển số:</Text>
                <Text style={styles.infoValue}>{item.vehiclePlate}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tên quán:</Text>
                <Text style={styles.infoValue}>{item.businessName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Địa chỉ:</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{item.businessAddress}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>GPKD:</Text>
                <Text style={styles.infoValue}>{item.businessLicense}</Text>
              </View>
              {item.taxCode && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>MST:</Text>
                  <Text style={styles.infoValue}>{item.taxCode}</Text>
                </View>
              )}
            </>
          )}

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Ghi chú:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}

          {item.status === 'PENDING' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleOpenModal(item, 'APPROVED')}
              >
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Phê duyệt</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleOpenModal(item, 'REJECTED')}
              >
                <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Từ chối</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabBar()}
      
      {filteredApplications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>Không có đơn nào</Text>
          <Text style={styles.emptyText}>
            Chưa có đơn đăng ký nào trong danh sách này
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredApplications}
          renderItem={renderApplicationCard}
          keyExtractor={(item) => item.applicationId.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Modal xử lý đơn */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {processingStatus === 'APPROVED' ? 'Phê duyệt đơn' : 'Từ chối đơn'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Ghi chú của admin</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ghi chú thêm (không bắt buộc)"
                value={adminNotes}
                onChangeText={setAdminNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {processingStatus === 'REJECTED' && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                    Lý do từ chối <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Nhập lý do từ chối..."
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
                disabled={processing}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalConfirmButton,
                  processingStatus === 'APPROVED' ? styles.approveButton : styles.rejectButton,
                  processing && { opacity: 0.6 }
                ]}
                onPress={handleProcess}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {processingStatus === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
  },
  activeTabText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  roleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    width: 80,
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  textArea: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 80,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
