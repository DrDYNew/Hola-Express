import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import partnerService from '../services/partnerService';
import {
  PartnerApplication,
  PartnerTypeLabels,
  ApplicationStatusLabels,
  ApplicationStatusColors,
} from '../types/partner';

interface RoleApplicationDetailScreenRoute {
  params: {
    applicationId: number;
  };
}

export default function RoleApplicationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RoleApplicationDetailScreenRoute>();
  const [application, setApplication] = useState<PartnerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { width } = Dimensions.get('window');

  useEffect(() => {
    loadApplicationDetails();
  }, [route.params.applicationId]);

  const loadApplicationDetails = async () => {
    try {
      const data = await partnerService.getApplicationById(route.params.applicationId);
      setApplication(data);
    } catch (error: any) {
      console.error('Error loading application details:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết đơn đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={80} color="#F44336" />
        <Text style={styles.errorText}>Không tìm thấy đơn đăng ký</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isShipper = application.requestedRole === 'SHIPPER';
  const statusColor = ApplicationStatusColors[application.status];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn đăng ký</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: statusColor + '1A' }]}>
        <View style={[styles.statusCircle, { backgroundColor: statusColor }]}>
          <MaterialCommunityIcons
            name={
              application.status === 'APPROVED'
                ? 'check-circle'
                : application.status === 'REJECTED'
                ? 'close-circle'
                : 'clock-outline'
            }
            size={32}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusTitle, { color: statusColor }]}>
            {ApplicationStatusLabels[application.status]}
          </Text>
          <Text style={styles.statusDate}>
            Nộp lúc: {formatDate(application.applicationDate)}
          </Text>
        </View>
      </View>

      {/* Role Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loại đăng ký</Text>
        <View style={styles.roleBox}>
          <MaterialCommunityIcons
            name={isShipper ? 'moped' : 'store'}
            size={40}
            color={isShipper ? '#4CAF50' : '#FF6B6B'}
          />
          <Text style={styles.roleLabel}>
            {PartnerTypeLabels[application.requestedRole]}
          </Text>
        </View>
      </View>

      {/* Shipper Information */}
      {isShipper && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Thông tin tài xế</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="card-account-details" size={20} color="#FF6B6B" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số GPLX</Text>
                <Text style={styles.infoValue}>{application.licenseNumber}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="motorbike" size={20} color="#4CAF50" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Biển số xe</Text>
                <Text style={styles.infoValue}>{application.vehiclePlate}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="car" size={20} color="#2196F3" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Loại xe</Text>
                <Text style={styles.infoValue}>{application.vehicleType}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Owner Information */}
      {!isShipper && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏪 Thông tin cửa hàng</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="store" size={20} color="#FF6B6B" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tên cửa hàng</Text>
                <Text style={styles.infoValue}>{application.businessName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#FF9800" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{application.businessAddress}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="file-document" size={20} color="#4CAF50" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số GPKD</Text>
                <Text style={styles.infoValue}>{application.businessLicense}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="identifier" size={20} color="#2196F3" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mã số thuế</Text>
                <Text style={styles.infoValue}>{application.taxCode}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📄 Giấy tờ đăng ký</Text>

        {[
          { label: 'CMND/CCCD mặt trước', url: application.idCardFrontUrl },
          { label: 'CMND/CCCD mặt sau', url: application.idCardBackUrl },
          ...(isShipper ? [
            { label: 'Bằng lái xe mặt trước', url: application.licenseFrontUrl },
            { label: 'Bằng lái xe mặt sau', url: application.licenseBackUrl },
          ] : [
            { label: 'Giấy phép kinh doanh', url: application.businessLicenseDocumentUrl },
            { label: 'Giấy đăng ký mã số thuế', url: application.taxCodeDocumentUrl },
          ]),
        ].map((doc, i) =>
          doc.url ? (
            <View key={i} style={styles.documentItem}>
              <Text style={styles.documentLabel}>{doc.label}</Text>
              <TouchableOpacity
                style={styles.documentThumbnail}
                onPress={() => setSelectedImage(doc.url!)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: doc.url }} style={styles.documentImage} />
                <View style={styles.zoomHint}>
                  <MaterialCommunityIcons name="magnify-plus" size={18} color="#fff" />
                  <Text style={styles.zoomHintText}>Nhấn để xem to</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : null
        )}

        {!application.idCardFrontUrl && !application.idCardBackUrl &&
         !application.licenseFrontUrl && !application.licenseBackUrl &&
         !application.businessLicenseDocumentUrl && !application.taxCodeDocumentUrl && (
          <View style={styles.noDocumentsBox}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color="#CCC" />
            <Text style={styles.noDocumentsText}>Chưa có giấy tờ nào được upload</Text>
          </View>
        )}
      </View>

      {/* Notes */}
      {application.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✍️ Ghi chú của bạn</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{application.notes}</Text>
          </View>
        </View>
      )}

      {/* Admin Notes */}
      {application.adminNotes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Ghi chú từ admin</Text>
          <View style={styles.adminNotesBox}>
            <Text style={styles.adminNotesText}>{application.adminNotes}</Text>
          </View>
        </View>
      )}

      {/* Rejection Reason */}
      {application.status === 'REJECTED' && application.rejectionReason && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❌ Lý do từ chối</Text>
          <View style={styles.rejectionBox}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#F44336" />
            <Text style={styles.rejectionText}>{application.rejectionReason}</Text>
          </View>
        </View>
      )}

      {/* Approval Info */}
      {application.status === 'APPROVED' && application.processedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Thông tin duyệt</Text>
          <View style={styles.approvalBox}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.approvalText}>
              Đã được duyệt lúc {formatDate(application.processedDate)}
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {application.status === 'REJECTED' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.reapplyButton}
            onPress={() => {
              navigation.navigate('ApplyShipper');
            }}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.reapplyButtonText}>Nộp lại đơn</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Image Zoom Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}
        >
          <Image
            source={{ uri: selectedImage! }}
            style={[styles.modalImage, { width: width - 32 }]}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedImage(null)}>
            <MaterialCommunityIcons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  statusCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  roleBox: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  documentItem: {
    marginBottom: 16,
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  documentThumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  documentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  zoomHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  zoomHintText: {
    color: '#fff',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    height: 420,
    borderRadius: 12,
  },
  modalClose: {
    marginTop: 20,
  },
  noDocumentsBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  noDocumentsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  notesBox: {
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  adminNotesBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  adminNotesText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    gap: 12,
  },
  rejectionText: {
    flex: 1,
    fontSize: 14,
    color: '#C62828',
    lineHeight: 20,
  },
  approvalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    gap: 12,
  },
  approvalText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  actionButtons: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  reapplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  reapplyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 24,
  },
});
