import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import adminService, {
  AdminRoleApplicationDetail,
  AdminProcessApplicationRequest,
} from '../../services/adminService';

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

const VEHICLE_TYPE_LABEL: Record<string, string> = {
  MOTORCYCLE: 'Xe máy',
  CAR: 'Ô tô',
  OTHER: 'Loại khác',
};

export default function AdminRoleApplicationDetailScreen({ navigation, route }: any) {
  const { applicationId } = route.params as { applicationId: number };

  const [detail, setDetail] = useState<AdminRoleApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    loadDetail();
  }, [applicationId]);

  const loadDetail = async () => {
    setLoading(true);
    const res = await adminService.getAdminRoleApplicationDetail(applicationId);
    if (res.success && res.data) {
      setDetail(res.data);
    } else {
      Alert.alert('Lỗi', res.message || 'Không thể tải chi tiết đơn', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
    setLoading(false);
  };

  const openModal = (action: 'APPROVED' | 'REJECTED') => {
    setModalAction(action);
    setAdminNotes('');
    setRejectionReason('');
    setModalVisible(true);
  };

  const handleProcess = async () => {
    if (modalAction === 'REJECTED' && !rejectionReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối');
      return;
    }
    setProcessing(true);
    const body: AdminProcessApplicationRequest = {
      status: modalAction,
      adminNotes: adminNotes.trim() || undefined,
      rejectionReason: modalAction === 'REJECTED' ? rejectionReason.trim() : undefined,
    };
    const res = await adminService.processAdminRoleApplication(applicationId, body);
    setProcessing(false);
    setModalVisible(false);
    if (res.success) {
      Alert.alert(
        'Thành công',
        modalAction === 'APPROVED' ? 'Đã phê duyệt đơn đăng ký' : 'Đã từ chối đơn đăng ký',
        [{ text: 'OK', onPress: () => { loadDetail(); } }],
      );
    } else {
      Alert.alert('Lỗi', res.message || 'Không thể xử lý đơn');
    }
  };

  const formatDate = (s?: string) =>
    s
      ? new Date(s).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ marginTop: 10, color: '#7c3aed' }}>Đang tải...</Text>
      </View>
    );
  }

  if (!detail) return null;

  const isShipper = detail.requestedRole === 'SHIPPER';
  const statusColor = STATUS_COLOR[detail.status] ?? '#6b7280';

  const docs = isShipper
    ? [
        { label: 'CMND/CCCD mặt trước', url: detail.idCardFrontUrl },
        { label: 'CMND/CCCD mặt sau', url: detail.idCardBackUrl },
        { label: 'Bằng lái xe mặt trước', url: detail.licenseFrontUrl },
        { label: 'Bằng lái xe mặt sau', url: detail.licenseBackUrl },
      ]
    : [
        { label: 'CMND/CCCD mặt trước', url: detail.idCardFrontUrl },
        { label: 'CMND/CCCD mặt sau', url: detail.idCardBackUrl },
        { label: 'Giấy phép kinh doanh', url: detail.businessLicenseDocumentUrl },
        { label: 'Giấy đăng ký MST', url: detail.taxCodeDocumentUrl },
      ];

  const hasDocs = docs.some(d => d.url);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn đăng ký</Text>
        <View
          style={[styles.headerStatusBadge, { backgroundColor: statusColor + '30' }]}
        >
          <Text style={[styles.headerStatusText, { color: '#fff' }]}>
            {STATUS_LABEL[detail.status] ?? detail.status}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* User section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account" size={18} color="#7c3aed" />
            <Text style={styles.sectionTitle}>Thông tin người đăng ký</Text>
          </View>
          <View style={styles.userRow}>
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: isShipper ? '#4CAF5015' : '#FF6B6B15' },
              ]}
            >
              <MaterialCommunityIcons
                name={isShipper ? 'moped' : 'store'}
                size={32}
                color={isShipper ? '#4CAF50' : '#FF6B6B'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{detail.userName}</Text>
              <Text style={styles.userPhone}>{detail.userPhone}</Text>
              {detail.userEmail && <Text style={styles.userEmail}>{detail.userEmail}</Text>}
            </View>
            <View style={[styles.roleBadge, { backgroundColor: isShipper ? '#4CAF5015' : '#FF6B6B15' }]}>
              <Text style={[styles.roleBadgeText, { color: isShipper ? '#4CAF50' : '#FF6B6B' }]}>
                {isShipper ? 'Shipper' : 'Chủ quán'}
              </Text>
            </View>
          </View>
        </View>

        {/* Shipper details */}
        {isShipper && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="moped" size={18} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Thông tin Shipper</Text>
            </View>
            <InfoRow label="Số GPLX" value={detail.licenseNumber} />
            <InfoRow label="Biển số xe" value={detail.vehiclePlate} />
            <InfoRow
              label="Loại xe"
              value={
                detail.vehicleType
                  ? detail.vehicleType === 'OTHER'
                    ? `Khác - ${detail.vehicleTypeOther ?? ''}`
                    : VEHICLE_TYPE_LABEL[detail.vehicleType] ?? detail.vehicleType
                  : undefined
              }
            />
          </View>
        )}

        {/* Owner details */}
        {!isShipper && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="store" size={18} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Thông tin Chủ quán</Text>
            </View>
            <InfoRow label="Tên cơ sở" value={detail.businessName} />
            <InfoRow label="Địa chỉ" value={detail.businessAddress} />
            <InfoRow label="Số GPKD" value={detail.businessLicense} />
            <InfoRow label="Mã số thuế" value={detail.taxCode} />
          </View>
        )}

        {/* Notes from applicant */}
        {detail.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="note-text-outline" size={18} color="#6b7280" />
              <Text style={styles.sectionTitle}>Ghi chú của người đăng ký</Text>
            </View>
            <Text style={styles.notesText}>{detail.notes}</Text>
          </View>
        )}

        {/* Documents */}
        {hasDocs && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="file-document-multiple-outline" size={18} color="#6b7280" />
              <Text style={styles.sectionTitle}>Tài liệu đính kèm</Text>
            </View>
            <View style={styles.docsGrid}>
              {docs.map(
                (doc, i) =>
                  doc.url ? (
                    <TouchableOpacity
                      key={i}
                      style={styles.docItem}
                      onPress={() => setFullscreenImage(doc.url!)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: doc.url }}
                        style={styles.docImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.docLabel} numberOfLines={1}>
                        {doc.label}
                      </Text>
                    </TouchableOpacity>
                  ) : null,
              )}
            </View>
          </View>
        )}

        {/* Processing result */}
        {(detail.adminNotes || detail.rejectionReason || detail.processedByName) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color="#7c3aed" />
              <Text style={styles.sectionTitle}>Kết quả xét duyệt</Text>
            </View>
            {detail.processedByName && (
              <InfoRow label="Admin duyệt" value={detail.processedByName} />
            )}
            {detail.processedDate && (
              <InfoRow label="Ngày xử lý" value={formatDate(detail.processedDate)} />
            )}
            {detail.adminNotes && (
              <View style={styles.noteBox}>
                <Text style={styles.noteBoxLabel}>Ghi chú admin:</Text>
                <Text style={styles.noteBoxText}>{detail.adminNotes}</Text>
              </View>
            )}
            {detail.rejectionReason && (
              <View style={[styles.noteBox, { backgroundColor: '#fef2f2' }]}>
                <Text style={[styles.noteBoxLabel, { color: '#ef4444' }]}>Lý do từ chối:</Text>
                <Text style={[styles.noteBoxText, { color: '#b91c1c' }]}>{detail.rejectionReason}</Text>
              </View>
            )}
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-clock" size={18} color="#6b7280" />
            <Text style={styles.sectionTitle}>Thời gian</Text>
          </View>
          <InfoRow label="Ngày nộp đơn" value={formatDate(detail.applicationDate)} />
          <InfoRow label="Ngày tạo" value={formatDate(detail.createdAt)} />
          {detail.processedDate && (
            <InfoRow label="Ngày xử lý" value={formatDate(detail.processedDate)} />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action buttons — only for PENDING */}
      {detail.status === 'PENDING' && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => openModal('REJECTED')}
          >
            <MaterialCommunityIcons name="close" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Từ chối</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => openModal('APPROVED')}
          >
            <MaterialCommunityIcons name="check" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Phê duyệt</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Process modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />

            {/* Header with color */}
            <LinearGradient
              colors={modalAction === 'APPROVED' ? ['#059669', '#10b981'] : ['#dc2626', '#ef4444']}
              style={styles.modalHeaderGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <View style={styles.modalHeaderIcon}>
                <MaterialCommunityIcons
                  name={modalAction === 'APPROVED' ? 'check-circle' : 'close-circle'}
                  size={22} color="#fff"
                />
              </View>
              <Text style={styles.modalTitle}>
                {modalAction === 'APPROVED' ? 'Phê duyệt đơn' : 'Từ chối đơn'}
              </Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Ghi chú của admin (không bắt buộc)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Nhập ghi chú..."
                value={adminNotes}
                onChangeText={setAdminNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#bbb"
              />

              {modalAction === 'REJECTED' && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                    Lý do từ chối <Text style={{ color: '#ef4444' }}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.textArea, { borderColor: rejectionReason ? '#e5e7eb' : '#fca5a5' }]}
                    placeholder="Nhập lý do từ chối..."
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    placeholderTextColor="#bbb"
                  />
                </>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={processing}
              >
                <Text style={styles.modalCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  modalAction === 'APPROVED' ? styles.approveBtn : styles.rejectBtn,
                  processing && { opacity: 0.6 },
                ]}
                onPress={handleProcess}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionBtnText}>
                    {modalAction === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen image viewer */}
      {fullscreenImage && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setFullscreenImage(null)}>
          <TouchableOpacity
            style={styles.fullscreenOverlay}
            activeOpacity={1}
            onPress={() => setFullscreenImage(null)}
          >
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
            <View style={styles.fullscreenClose}>
              <MaterialCommunityIcons name="close-circle" size={32} color="#fff" />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1, marginLeft: 10 },
  headerStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerStatusText: { fontSize: 12, fontWeight: '700' },

  scroll: { padding: 12, gap: 12 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  userPhone: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  userEmail: { fontSize: 13, color: '#9ca3af', marginTop: 1 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  roleBadgeText: { fontSize: 12, fontWeight: '700' },

  infoRow: { flexDirection: 'row', marginBottom: 10 },
  infoLabel: { width: 110, fontSize: 13, color: '#6b7280', fontWeight: '600' },
  infoValue: { flex: 1, fontSize: 13, color: '#1f2937' },

  notesText: { fontSize: 14, color: '#374151', lineHeight: 20 },

  noteBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  noteBoxLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 4 },
  noteBoxText: { fontSize: 13, color: '#374151', lineHeight: 18 },

  docsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  docItem: { width: '47%' },
  docImage: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#f3f4f6' },
  docLabel: { fontSize: 11, color: '#6b7280', marginTop: 4, textAlign: 'center' },

  actionBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  approveBtn: { backgroundColor: '#10b981' },
  rejectBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
  },
  modalHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 10,
  },
  modalHeaderIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#fff' },
  modalCloseBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { padding: 18 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  textArea: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    padding: 12,
    fontSize: 14,
    color: '#374151',
    minHeight: 80,
  },
  modalFooter: { flexDirection: 'row', paddingHorizontal: 18, gap: 10, marginTop: 4 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  modalCancelText: { fontSize: 15, color: '#6b7280', fontWeight: '600' },
  modalConfirmBtn: { flex: 1.4, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },

  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: { width: '100%', height: '80%' },
  fullscreenClose: { position: 'absolute', top: 50, right: 16 },
});
