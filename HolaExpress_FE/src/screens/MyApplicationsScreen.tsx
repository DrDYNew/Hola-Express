import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import partnerService from '../services/partnerService';
import { 
  PartnerApplication, 
  PartnerTypeLabels, 
  ApplicationStatusLabels,
  ApplicationStatusColors
} from '../types/partner';

export default function MyApplicationsScreen() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadApplications = async () => {
    try {
      const data = await partnerService.getMyApplications();
      setApplications(data);
    } catch (error: any) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadApplications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
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

  const renderApplicationCard = ({ item }: { item: PartnerApplication }) => {
    const statusColor = ApplicationStatusColors[item.status];
    const isShipper = item.requestedRole === 'SHIPPER';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: isShipper ? '#4CAF501A' : '#FF6B6B1A' }]}>
            <MaterialCommunityIcons 
              name={isShipper ? 'moped' : 'store'} 
              size={32} 
              color={isShipper ? '#4CAF50' : '#FF6B6B'} 
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.roleText}>{PartnerTypeLabels[item.requestedRole]}</Text>
            <Text style={styles.dateText}>
              Nộp đơn: {formatDate(item.applicationDate)}
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
                <MaterialCommunityIcons name="card-account-details" size={18} color="#666" />
                <Text style={styles.infoLabel}>GPLX:</Text>
                <Text style={styles.infoValue}>{item.licenseNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="motorbike" size={18} color="#666" />
                <Text style={styles.infoLabel}>Biển số:</Text>
                <Text style={styles.infoValue}>{item.vehiclePlate}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="store-outline" size={18} color="#666" />
                <Text style={styles.infoLabel}>Tên quán:</Text>
                <Text style={styles.infoValue}>{item.businessName}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="file-document" size={18} color="#666" />
                <Text style={styles.infoLabel}>GPKD:</Text>
                <Text style={styles.infoValue}>{item.businessLicense}</Text>
              </View>
            </>
          )}

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Ghi chú:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}

          {item.status === 'APPROVED' && item.processedDate && (
            <View style={styles.approvalInfo}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.approvalText}>
                Đã duyệt lúc {formatDate(item.processedDate)}
              </Text>
            </View>
          )}

          {item.status === 'REJECTED' && (
            <View style={styles.rejectionInfo}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#F44336" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rejectionTitle}>Lý do từ chối:</Text>
                <Text style={styles.rejectionText}>
                  {item.rejectionReason || 'Không có lý do cụ thể'}
                </Text>
              </View>
            </View>
          )}

          {item.adminNotes && (
            <View style={styles.adminNotesContainer}>
              <Text style={styles.adminNotesLabel}>Ghi chú từ admin:</Text>
              <Text style={styles.adminNotesText}>{item.adminNotes}</Text>
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
      {applications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>Chưa có đơn đăng ký</Text>
          <Text style={styles.emptyText}>
            Bạn chưa nộp đơn đăng ký nào. Hãy bắt đầu bằng cách đăng ký làm tài xế hoặc chủ cửa hàng.
          </Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplicationCard}
          keyExtractor={(item) => item.applicationId.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
    lineHeight: 20,
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
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  roleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
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
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  approvalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    gap: 8,
  },
  approvalText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  rejectionInfo: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    gap: 8,
  },
  rejectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C62828',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 13,
    color: '#C62828',
    lineHeight: 18,
  },
  adminNotesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  adminNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 4,
  },
  adminNotesText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
});
