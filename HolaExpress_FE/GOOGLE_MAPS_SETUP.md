# Google Maps Setup Guide

## Để sử dụng Google Maps trong ManageOrders screen, cần setup API key:

### 1. Lấy Google Maps API Key

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo hoặc chọn project
3. Enable APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Maps JavaScript API (nếu dùng web)
4. Tạo API key trong **Credentials**

### 2. Cấu hình Android

Thêm API key vào `app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.holaexpress.app",
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"
        }
      }
    }
  }
}
```

### 3. Cấu hình iOS

Thêm vào `app.json`:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"
      }
    }
  }
}
```

### 4. Rebuild app

```bash
# Xóa cache và rebuild
npx expo start -c

# Hoặc build production
eas build --platform android
eas build --platform ios
```

## Testing trong Development

Nếu chưa có API key, Maps vẫn hoạt động trong development mode nhưng có watermark "For development purposes only".

## Environment Variables (Optional)

Có thể dùng environment variables:

1. Tạo file `.env`:
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

2. Cài package:
```bash
npm install react-native-dotenv
```

3. Sử dụng trong code:
```typescript
import { EXPO_PUBLIC_GOOGLE_MAPS_API_KEY } from '@env';
```
