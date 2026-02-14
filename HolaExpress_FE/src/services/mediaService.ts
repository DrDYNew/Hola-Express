import apiClient from './api';
import { ApiResponse } from '../types/auth';

export interface UploadedMedia {
  mediaId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadDate: string;
}

class MediaService {
  /**
   * Upload một ảnh giấy tờ
   */
  async uploadDocument(uri: string, fileName: string, documentType: string = 'document'): Promise<UploadedMedia> {
    const formData = new FormData();
    
    // @ts-ignore - React Native FormData
    formData.append('file', {
      uri,
      name: fileName,
      type: 'image/jpeg',
    });
    formData.append('documentType', documentType);

    const response = await apiClient.post<ApiResponse<UploadedMedia>>(
      '/Media/upload-document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Upload thất bại');
    }

    return response.data.data;
  }

  /**
   * Upload nhiều ảnh cùng lúc
   */
  async uploadMultiple(
    files: Array<{ uri: string; fileName: string }>,
    documentType: string = 'document'
  ): Promise<UploadedMedia[]> {
    const formData = new FormData();
    
    files.forEach((file) => {
      // @ts-ignore - React Native FormData
      formData.append('files', {
        uri: file.uri,
        name: file.fileName,
        type: 'image/jpeg',
      });
    });
    formData.append('documentType', documentType);

    const response = await apiClient.post<ApiResponse<UploadedMedia[]>>(
      '/Media/upload-multiple',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Upload thất bại');
    }

    return response.data.data;
  }

  /**
   * Lấy thông tin media theo ID
   */
  async getMediaById(mediaId: number): Promise<UploadedMedia> {
    const response = await apiClient.get<ApiResponse<UploadedMedia>>(
      `/Media/${mediaId}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Không tìm thấy media');
    }

    return response.data.data;
  }
}

export default new MediaService();
