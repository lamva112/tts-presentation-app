// File: src/components/UploadForm.jsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook để chuyển trang
import api from '../services/api'; // Import API client đã tạo ở bước trước

function UploadForm() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0); // State theo dõi tiến trình %
  const navigate = useNavigate(); // Hook để điều hướng

  // Hàm xử lý khi người dùng chọn file
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.ppt') || file.name.endsWith('.pptx'))) {
      setSelectedFile(file);
      setError(''); // Xóa lỗi cũ (nếu có)
      setUploadProgress(0); // Reset tiến trình
    } else {
      setSelectedFile(null);
      setError('Please select a valid .ppt or .pptx file.');
    }
  };

  // Hàm xử lý callback tiến trình upload từ Axios
  const handleUploadProgress = useCallback((progressEvent) => {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    setUploadProgress(percentCompleted);
  }, []);

  // Hàm xử lý khi nhấn nút Upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Gọi hàm API upload đã định nghĩa trong api.js
      const presentationInfo = await api.uploadPresentation(selectedFile, handleUploadProgress);

      console.log('Upload successful:', presentationInfo);

      // Upload thành công, chuyển hướng đến trang xem slide
      // presentationInfo.id chứa ID trả về từ backend
      if (presentationInfo && presentationInfo.id) {
        navigate(`/presentation/${presentationInfo.id}`);
      } else {
         // Trường hợp API thành công nhưng không trả về ID như mong đợi
         console.error("API response successful but missing presentation ID:", presentationInfo);
         setError('Upload succeeded but failed to get presentation ID. Please try again.');
      }

    } catch (err) {
      console.error('Upload failed:', err);
      // Cố gắng lấy thông báo lỗi cụ thể từ response của API nếu có
      const errorMessage = err.response?.data?.detail || err.message || 'An unknown error occurred during upload.';
      setError(`Upload Failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-form">
      {/* Input chọn file */}
      <input
        type="file"
        accept=".ppt,.pptx" // Chỉ chấp nhận file ppt và pptx
        onChange={handleFileChange}
        disabled={isLoading} // Vô hiệu hóa khi đang tải lên
      />

      {/* Nút Upload */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isLoading} // Vô hiệu hóa nếu chưa chọn file hoặc đang tải
      >
        {isLoading ? `Uploading (${uploadProgress}%) ...` : 'Upload Presentation'}
      </button>

      {/* Hiển thị tên file đã chọn */}
      {selectedFile && !isLoading && <p>Selected file: {selectedFile.name}</p>}

      {/* Hiển thị lỗi nếu có */}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

       {/* (Tùy chọn) Hiển thị thanh tiến trình chi tiết hơn */}
       {isLoading && uploadProgress > 0 && (
         <div style={{ width: '100%', backgroundColor: '#e0e0e0', marginTop: '10px' }}>
           <div
             style={{
               width: `${uploadProgress}%`,
               height: '10px',
               backgroundColor: '#4caf50',
               textAlign: 'center',
               lineHeight: '10px',
               color: 'white',
               fontSize: '8px'
             }}
           >
             {/* {uploadProgress}% */}
           </div>
         </div>
       )}
    </div>
  );
}

export default UploadForm;