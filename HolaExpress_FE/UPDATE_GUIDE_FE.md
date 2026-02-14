# 📱 Hướng Dẫn Cập Nhật Frontend - Upload Ảnh Giấy Tờ

## ✅ Đã Tạo Mới

### 1. **mediaService.ts** ✅
- `src/services/mediaService.ts` - Service upload ảnh lên server

### 2. **useDocumentUpload.ts** ✅ 
- `src/hooks/useDocumentUpload.ts` - Hook xử lý logic upload

### 3. **DocumentImagePicker.tsx** ✅
- `src/components/DocumentImagePicker.tsx` - Component picker ảnh có sẵn

### 4. **partner.ts** ✅ (Đã cập nhật)
- Đã bắt buộc các trường `mediaId` (không còn optional)

---

## 🔄 Cần Cập Nhật

### **ApplyShipperScreen.tsx** - Cách Cập Nhật

#### Step 1: Import các dependencies mới

```typescript
// Thêm vào phần import
import * as ImagePicker from 'expo-image-picker';
import mediaService from '../services/mediaService';
import { DocumentImagePicker } from '../components/DocumentImagePicker';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
```

#### Step 2: Thêm state quản lý ảnh

```typescript
const { uploadingImages, pickAndUploadImage } = useDocumentUpload();

const [documents, setDocuments] = useState({
  idCardFront: { uri: null as string | null, mediaId: null as number | null },
  idCardBack: { uri: null as string | null, mediaId: null as number | null },
  licenseFront: { uri: null as string | null, mediaId: null as number | null },
  licenseBack: { uri: null as string | null, mediaId: null as number | null },
});
```

#### Step 3: Hàm xử lý chọn và upload ảnh

```typescript
const handlePickImage = async (documentType: keyof typeof documents, label: string, type: string) => {
  const result = await pickAndUploadImage(type, label);
  
  if (result) {
    setDocuments(prev => ({
      ...prev,
      [documentType]: {
        uri: result.uri,
        mediaId: result.mediaId,
      }
    }));
  }
};
```

#### Step 4: Thêm validation ảnh trong handleSubmit

```typescript
const handleSubmit = async () => {
  // ... validation cũ ...

  // THÊM validation ảnh
  if (!documents.idCardFront.mediaId) {
    Alert.alert('Lỗi', 'Vui lòng upload ảnh CMND/CCCD mặt trước');
    return;
  }
  if (!documents.idCardBack.mediaId) {
    Alert.alert('Lỗi', 'Vui lòng upload ảnh CMND/CCCD mặt sau');
    return;
  }
  if (!documents.licenseFront.mediaId) {
    Alert.alert('Lỗi', 'Vui lòng upload ảnh bằng lái xe mặt trước');
    return;
  }
  if (!documents.licenseBack.mediaId) {
    Alert.alert('Lỗi', 'Vui lòng upload ảnh bằng lái xe mặt sau');
    return;
  }

  try {
    setLoading(true);
    await partnerService.applyForShipper({
      licenseNumber: formData.licenseNumber.trim(),
      vehiclePlate: formData.vehiclePlate.trim(),
      vehicleType: formData.vehicleType,
      notes: formData.notes.trim() || undefined,
      // THÊM các mediaIds
      idCardFrontMediaId: documents.idCardFront.mediaId!,
      idCardBackMediaId: documents.idCardBack.mediaId!,
      licenseFrontMediaId: documents.licenseFront.mediaId!,
      licenseBackMediaId: documents.licenseBack.mediaId!,
    });
    // ... rest of success handling ...
  }
};
```

#### Step 5: Thêm UI cho image pickers (TRƯỚC phần "Thông tin xe")

```tsx
{/* THÊM phần này TRƯỚC section "Thông tin xe" */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>📸 Giấy tờ tùy thân</Text>
  <Text style={styles.sectionDescription}>
    Upload ảnh CMND/CCCD 2 mặt (ảnh rõ ràng, không bị mờ)
  </Text>
  
  <DocumentImagePicker
    label="CMND/CCCD mặt trước"
    icon="card-account-details"
    imageUri={documents.idCardFront.uri}
    isUploaded={!!documents.idCardFront.mediaId}
    isUploading={uploadingImages}
    onPick={() => handlePickImage('idCardFront', 'CMND/CCCD mặt trước', 'id_card')}
  />

  <DocumentImagePicker
    label="CMND/CCCD mặt sau"
    icon="card-account-details-outline"
    imageUri={documents.idCardBack.uri}
    isUploaded={!!documents.idCardBack.mediaId}
    isUploading={uploadingImages}
    onPick={() => handlePickImage('idCardBack', 'CMND/CCCD mặt sau', 'id_card')}
  />
</View>

<View style={styles.section}>
  <Text style={styles.sectionTitle}>🪪 Bằng lái xe</Text>
  <Text style={styles.sectionDescription}>
    Upload ảnh bằng lái xe 2 mặt
  </Text>
  
  <DocumentImagePicker
    label="Bằng lái xe mặt trước"
    icon="license"
    imageUri={documents.licenseFront.uri}
    isUploaded={!!documents.licenseFront.mediaId}
    isUploading={uploadingImages}
    onPick={() => handlePickImage('licenseFront', 'Bằng lái xe mặt trước', 'license')}
  />

  <DocumentImagePicker
    label="Bằng lái xe mặt sau"
    icon="license"
    imageUri={documents.licenseBack.uri}
    isUploaded={!!documents.licenseBack.mediaId}
    isUploading={uploadingImages}
    onPick={() => handlePickImage('licenseBack', 'Bằng lái xe mặt sau', 'license')}
  />
</View>
```

#### Step 6: Cập nhật submitButton để disable khi đang upload

```tsx
<TouchableOpacity 
  style={[styles.submitButton, (loading || uploadingImages) && styles.submitButtonDisabled]}
  onPress={handleSubmit}
  disabled={loading || uploadingImages}  // THÊM uploadingImages
>
```

#### Step 7: Thêm style mới (nếu muốn tùy chỉnh)

```typescript
// Thêm vào styles
sectionDescription: {
  fontSize: 13,
  color: '#666',
  marginBottom: 16,
  lineHeight: 18,
},
```

---

### **ApplyOwnerScreen.tsx** - Cập Nhật Tương Tự

Áp dụng các bước tương tự như ApplyShipperScreen, nhưng với 4 ảnh khác:

1. **CMND/CCCD** (2 ảnh) - giống shipper
2. **Giấy phép kinh doanh** (1 ảnh)
3. **Mã số thuế** (1 ảnh)

```typescript
const [documents, setDocuments] = useState({
  idCardFront: { uri: null as string | null, mediaId: null as number | null },
  idCardBack: { uri: null as string | null, mediaId: null as number | null },
  businessLicense: { uri: null as string | null, mediaId: null as number | null },
  taxCode: { uri: null as string | null, mediaId: null as number | null },
});

// Validation
if (!documents.businessLicense.mediaId) {
  Alert.alert('Lỗi', 'Vui lòng upload ảnh giấy phép kinh doanh');
  return;
}
if (!documents.taxCode.mediaId) {
  Alert.alert('Lỗi', 'Vui lòng upload ảnh giấy đăng ký mã số thuế');
  return;
}

// Submit
await partnerService.applyForOwner({
  businessName: formData.businessName.trim(),
  businessAddress: formData.businessAddress.trim(),
  businessLicense: formData.businessLicense.trim(),
  taxCode: formData.taxCode.trim() || undefined,
  notes: formData.notes.trim() || undefined,
  idCardFrontMediaId: documents.idCardFront.mediaId!,
  idCardBackMediaId: documents.idCardBack.mediaId!,
  businessLicenseMediaId: documents.businessLicense.mediaId!,
  taxCodeMediaId: documents.taxCode.mediaId!,
});
```

UI cho Owner:
```tsx
<View style={styles.section}>
  <Text style={styles.sectionTitle}>📸 Giấy tờ tùy thân</Text>
  {/* 2 DocumentImagePicker cho CMND */}
</View>

<View style={styles.section}>
  <Text style={styles.sectionTitle}>🏢 Giấy tờ kinh doanh</Text>
  
  <DocumentImagePicker
    label="Giấy phép kinh doanh"
    icon="file-document"
    imageUri={documents.businessLicense.uri}
    isUploaded={!!documents.businessLicense.mediaId}
    isUploading={uploadingImages}
    onPick={() => handlePickImage('businessLicense', 'Giấy phép kinh doanh', 'business_license')}
  />

  <DocumentImagePicker
    label="Giấy đăng ký mã số thuế"
    icon="file-certificate"
    imageUri={documents.taxCode.uri}
    isUploaded={!!documents.taxCode.mediaId}
    isUploading={uploadingImages}
    onPick={() => handlePickImage('taxCode', 'Giấy đăng ký mã số thuế', 'business_license')}
  />
</View>
```

---

## 📦 Dependencies Cần Cài

```bash
npx expo install expo-image-picker
```

---

## 📄 MyApplicationsScreen - Hiển Thị Ảnh

Trong `MyApplicationsScreen.tsx`, thêm hiển thị ảnh:

```tsx
{application.idCardFrontUrl && (
  <View style={styles.documentSection}>
    <Text style={styles.documentTitle}>Giấy tờ đã upload:</Text>
    <ScrollView horizontal>
      {application.idCardFrontUrl && (
        <Image 
          source={{ uri: application.idCardFrontUrl }} 
          style={styles.documentImage}
        />
      )}
      {application.idCardBackUrl && (
        <Image 
          source={{ uri: application.idCardBackUrl }} 
          style={styles.documentImage}
        />
      )}
      {/* Thêm các ảnh khác... */}
    </ScrollView>
  </View>
)}
```

```typescript
documentSection: {
  marginTop: 16,
},
documentTitle: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
  marginBottom: 8,
},
documentImage: {
  width: 150,
  height: 100,
  borderRadius: 8,
  marginRight: 8,
},
```

---

## 🎯 Checklist

### ApplyShipperScreen
- [ ] Import dependencies mới
- [ ] Thêm state cho documents
- [ ] Thêm hook useDocumentUpload
- [ ] Thêm hàm handlePickImage
- [ ] Cập nhật validation trong handleSubmit
- [ ] Thêm mediaIds vào API call
- [ ] Thêm UI ImagePickers (4 ảnh)
- [ ] Disable button khi đang upload
- [ ] Test upload ảnh
- [ ] Test validation
- [ ] Test submit form

### ApplyOwnerScreen
- [ ] Import dependencies mới
- [ ] Thêm state cho documents
- [ ] Thêm hook useDocumentUpload
- [ ] Thêm hàm handlePickImage
- [ ] Cập nhật validation trong handleSubmit
- [ ] Thêm mediaIds vào API call
- [ ] Thêm UI ImagePickers (4 ảnh)
- [ ] Disable button khi đang upload
- [ ] Test upload ảnh
- [ ] Test validation
- [ ] Test submit form

### MyApplicationsScreen
- [ ] Hiển thị ảnh giấy tờ đã upload
- [ ] Cho phép xem ảnh fullscreen (optional)
- [ ] Test hiển thị đúng URLs

---

## 🚀 Testing

### Test Upload
1. Chọn ảnh từ thư viện
2. Xem loading indicator
3. Kiểm tra badge "✓" xuất hiện
4. Check console log mediaId

### Test Validation
1. Bỏ trống 1 ảnh → Phải báo lỗi
2. Upload đủ ảnh → Submit thành công
3. Bỏ trống số GPLX → Phải báo lỗi

### Test Backend
1. Check API `/api/media/upload-document` trả về mediaId
2. Check API `/api/roleapplication/apply-shipper` nhận mediaIds
3. Check API `/api/roleapplication/my-applications` trả về URLs ảnh

---

## 💡 Tips

1. **Optimize ảnh trước khi upload**: Dùng `quality: 0.8` trong ImagePicker
2. **Error handling**: Hiển thị lỗi rõ ràng khi upload fail
3. **UX**: Disable form khi đang upload
4. **Preview**: Cho phép xem lại ảnh đã chọn trước khi submit
5. **Retry**: Cho phép chọn lại ảnh khác nếu upload fail

---

## 🐛 Troubleshooting

**Lỗi: "Cần cấp quyền truy cập thư viện ảnh"**
- Check permissions trong app.json
- Request permission trước khi mở picker

**Upload fail: "File size must be less than 5MB"**
- Giảm quality trong ImagePicker options
- Resize ảnh trước khi upload

**mediaId null sau upload**
- Check response từ API
- Check error handling trong try/catch

**Ảnh không hiển thị trong MyApplicationsScreen**
- Check URL từ API có đúng không
- Check Cloudinary URL accessible
