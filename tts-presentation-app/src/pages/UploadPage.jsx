// File: src/pages/UploadPage.jsx (Cập nhật)
import React from 'react';
// import UploadForm from '../components/UploadForm'; // Xóa component cũ
import UploadDropzone from '../components/UploadDropzone'; // Import component mới

function UploadPage() {
  return (
    <div>
      {/* <h2>Upload Your Presentation</h2>
      <p>Select a .ppt or .pptx file to begin.</p> */}
      {/* Chỉ cần hiển thị Dropzone ở đây */}
      <UploadDropzone />
    </div>
  );
}

export default UploadPage;