// File: src/services/api.js
import axios from 'axios';

// Đọc base URL từ biến môi trường (do Vite cung cấp qua import.meta.env)
// Mặc định sử dụng Azure URL thay vì localhost
const apiBaseFromEnv = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = apiBaseFromEnv === undefined ? 'https://aipresentationapp-fdf7a2djgpf5ercp.southeastasia-01.azurewebsites.net' : apiBaseFromEnv;
// Cho phép override API_PREFIX qua biến môi trường; mặc định '/api/v1'
const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? '/api/v1';

// Tạo một instance của axios với cấu hình mặc định
const apiClient = axios.create({
  // Kết hợp base URL và prefix một cách chính xác bằng template literal
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json', // Header mặc định khi gửi JSON
    'Accept': 'application/json',      // Header mặc định mong muốn nhận JSON
  },
  // timeout: 15000, // Có thể đặt timeout chung (ví dụ: 15 giây)
});

/**
 * Upload file thuyết trình.
 * @param {File} file - Đối tượng File được chọn từ input.
 * @param {function(ProgressEvent): void} [onUploadProgress] - (Tùy chọn) Callback để theo dõi tiến trình upload.
 * @returns {Promise<object>} - Promise chứa dữ liệu PresentationInfo trả về từ API (khi thành công với status 202).
 */
export const uploadPresentation = async (file, onUploadProgress) => {
  const formData = new FormData();
  // Key 'file' phải khớp với tham số 'file: UploadFile = File(...)' ở backend FastAPI
  formData.append('file', file);

  try {
    // Log URL đầy đủ để kiểm tra (có thể xóa sau khi debug)
    console.log(`Uploading to: ${apiClient.defaults.baseURL}/presentations/upload`);

    const response = await apiClient.post('/presentations/upload', formData, {
      headers: {
        // Ghi đè Content-Type cho request upload file này
        'Content-Type': 'multipart/form-data',
      },
      // Truyền callback theo dõi tiến trình cho axios
      onUploadProgress: onUploadProgress,
    });
    // API upload thành công sẽ trả về status 202 và body chứa thông tin ban đầu
    console.log("Upload API successful (202 Accepted):", response.data);
    return response.data;
  } catch (error) {
    // Log lỗi chi tiết hơn để dễ debug
    if (error.response) {
      // Server đã phản hồi với status code lỗi (4xx, 5xx)
      console.error('Upload Error - Status:', error.response.status);
      console.error('Upload Error - Data:', error.response.data);
      console.error('Upload Error - Headers:', error.response.headers);
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được phản hồi (lỗi mạng, server không chạy?)
      console.error('Upload Error - No Response:', error.request);
    } else {
      // Lỗi xảy ra trong quá trình thiết lập request
      console.error('Upload Error - Request Setup:', error.message);
    }
    // Ném lỗi ra để component React có thể bắt và hiển thị thông báo phù hợp
    throw error;
  }
};

/**
 * Lấy thông tin trạng thái và metadata của bài thuyết trình.
 * @param {string} presentationId - ID của bài thuyết trình.
 * @returns {Promise<object>} - Promise chứa dữ liệu PresentationInfo.
 */
export const getPresentationStatus = async (presentationId) => {
  if (!presentationId) throw new Error("getPresentationStatus requires a presentationId");
  try {
    const response = await apiClient.get(`/presentations/${presentationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting status for presentation ${presentationId}:`, error.response || error.message);
    throw error;
  }
};

/**
 * Lấy SAS URL để xem bài thuyết trình.
 * @param {string} presentationId - ID của bài thuyết trình.
 * @returns {Promise<object>} - Promise chứa dữ liệu ViewUrlResponse { presentationId, viewUrl, sasExpiry }.
 */
export const getViewUrl = async (presentationId) => {
  if (!presentationId) throw new Error("getViewUrl requires a presentationId");
  try {
    const response = await apiClient.get(`/presentations/${presentationId}/view-url`);
    return response.data;
  } catch (error) {
    console.error(`Error getting view URL for presentation ${presentationId}:`, error.response || error.message);
    throw error;
  }
};

/**
 * Lấy audio giọng nói cho text GỐC của slide.
 * @param {string} presentationId - ID bài thuyết trình.
 * @param {number} slideNumber - Số thứ tự slide (1-based).
 * @param {string} [voice] - (Tùy chọn) Tên giọng đọc.
 * @returns {Promise<Blob>} - Promise chứa dữ liệu audio dưới dạng Blob.
 */
export const getOriginalSpeech = async (presentationId, slideNumber, voice) => {
  if (!presentationId || !slideNumber) throw new Error("getOriginalSpeech requires presentationId and slideNumber");
  try {
    const params = { slide_number: slideNumber }; // Truyền slide_number qua query params
    if (voice) params.voice = voice; // Thêm voice nếu có
    const response = await apiClient.get(`/presentations/${presentationId}/bot-script-speech`, {
      params: params, // Truyền slide_number và voice qua query params
      responseType: 'blob', // Quan trọng: Yêu cầu axios trả về dạng Blob
    });
    return response.data; // Dữ liệu là một Blob object
  } catch (error) {
    console.error(`Error getting bot script speech for slide ${slideNumber}:`, error.response || error.message);
    throw error;
  }
};

/**
 * Lấy text kịch bản do LLM tạo ra cho slide.
 * @param {string} presentationId - ID bài thuyết trình.
 * @param {number} slideNumber - Số thứ tự slide (1-based).
 * @returns {Promise<object>} - Promise chứa dữ liệu GeneratedScriptResponse { presentationId, slideNumber, script, source }.
 */
export const getGeneratedScript = async (presentationId, slideNumber) => {
  if (!presentationId || !slideNumber) throw new Error("getGeneratedScript requires presentationId and slideNumber");
  try {
    const response = await apiClient.get(`/presentations/${presentationId}/slides/${slideNumber}/generated-script`);
    return response.data;
  } catch (error) {
    console.error(`Error getting generated script for slide ${slideNumber}:`, error.response || error.message);
    throw error;
  }
};

/**
 * Lấy audio giọng nói cho kịch bản LLM của slide.
 * @param {string} presentationId - ID bài thuyết trình.
 * @param {number} slideNumber - Số thứ tự slide (1-based).
 * @param {string} [voice] - (Tùy chọn) Tên giọng đọc.
 * @returns {Promise<Blob>} - Promise chứa dữ liệu audio dưới dạng Blob.
 */
export const getGeneratedSpeech = async (presentationId, slideNumber, voice) => {
  if (!presentationId || !slideNumber) throw new Error("getGeneratedSpeech requires presentationId and slideNumber");
  try {
    const params = voice ? { voice } : {};
    const response = await apiClient.get(`/presentations/${presentationId}/slides/${slideNumber}/generated-speech`, {
      params: params,
      responseType: 'blob', // Quan trọng: Yêu cầu axios trả về dạng Blob
    });
    return response.data;
  } catch (error) {
    console.error(`Error getting generated speech for slide ${slideNumber}:`, error.response || error.message);
    throw error;
  }
};

/**
 * Upload tài liệu (Word/PDF) để xử lý.
 * @param {FormData} formData - FormData chứa file và description.
 * @returns {Promise<object>} - Promise chứa dữ liệu trả về từ API.
 */
export const uploadDocument = async (formData) => {
  try {
    console.log(`Uploading document to: ${apiClient.defaults.baseURL}/documents/upload`);

    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log("Document upload successful:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Document Upload Error - Status:', error.response.status);
      console.error('Document Upload Error - Data:', error.response.data);
      console.error('Document Upload Error - Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Document Upload Error - No Response:', error.request);
    } else {
      console.error('Document Upload Error - Request Setup:', error.message);
    }
    throw error;
  }
};

/**
 * Upload presentation materials (Word/PDF) cho một bài thuyết trình cụ thể.
 * @param {FormData} formData - FormData chứa file.
 * @param {string} presentationId - ID của bài thuyết trình.
 * @returns {Promise<object>} - Promise chứa dữ liệu trả về từ API.
 */
export const uploadPresentationMaterials = async (formData, presentationId) => {
  if (!presentationId) throw new Error("uploadPresentationMaterials requires a presentationId");

  try {
    console.log(`Uploading materials to: ${apiClient.defaults.baseURL}/presentations/${presentationId}/upload-user-script`);

    const response = await apiClient.post(`/presentations/${presentationId}/upload-user-script`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log("Materials upload successful:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Materials Upload Error - Status:', error.response.status);
      console.error('Materials Upload Error - Data:', error.response.data);
      console.error('Materials Upload Error - Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Materials Upload Error - No Response:', error.request);
    } else {
      console.error('Materials Upload Error - Request Setup:', error.message);
    }
    throw error;
  }
};

/**
 * Upload user script for a presentation.
 * @param {string} presentationId - ID của bài thuyết trình.
 * @returns {Promise<object>} - Promise chứa dữ liệu trả về từ API.
 */
export const uploadUserScript = async (presentationId) => {
  if (!presentationId) throw new Error("uploadUserScript requires a presentationId");
  try {
    console.log(`Uploading user script for presentation: ${presentationId}`);
    const response = await apiClient.post(`/presentations/${presentationId}/upload-user-script`);
    console.log("User script upload successful:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('User Script Upload Error - Status:', error.response.status);
      console.error('User Script Upload Error - Data:', error.response.data);
      console.error('User Script Upload Error - Headers:', error.response.headers);
    } else if (error.request) {
      console.error('User Script Upload Error - No Response:', error.request);
    } else {
      console.error('User Script Upload Error - Request Setup:', error.message);
    }
    throw error;
  }
};

/**
 * Generate bot script for a presentation.
 * @param {string} presentationId - ID của bài thuyết trình.
 * @returns {Promise<object>} - Promise chứa dữ liệu trả về từ API.
 */
export const generateBotScript = async (presentationId) => {
  if (!presentationId) throw new Error("generateBotScript requires a presentationId");
  try {
    console.log(`Generating bot script for presentation: ${presentationId}`);
    const response = await apiClient.post(`/presentations/${presentationId}/generate-bot-script`);
    console.log("Bot script generation successful:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Bot Script Generation Error - Status:', error.response.status);
      console.error('Bot Script Generation Error - Data:', error.response.data);
      console.error('Bot Script Generation Error - Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Bot Script Generation Error - No Response:', error.request);
    } else {
      console.error('Bot Script Generation Error - Request Setup:', error.message);
    }
    throw error;
  }
};

// Export một object chứa tất cả các hàm API
export default {
  uploadPresentation,
  uploadDocument,
  uploadPresentationMaterials, // Thêm function mới
  getPresentationStatus,
  getViewUrl,
  getOriginalSpeech,
  getGeneratedScript,
  getGeneratedSpeech,
  uploadUserScript,
  generateBotScript,
};