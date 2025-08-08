// File: src/pages/PresentationViewerPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom'; // useParams để lấy ID từ URL
import PresentationViewer from '../components/PresentationViewer'; // Component xem chính (sẽ tạo)

function PresentationViewerPage() {
  // Lấy presentationId từ tham số route (định nghĩa trong App.jsx là /presentation/:presentationId)
  const { presentationId } = useParams();

  if (!presentationId) {
    // Xử lý trường hợp không có ID (dù route thường sẽ không khớp)
    return (
      <div>
        <h2>Error: Presentation ID missing.</h2>
        <Link to="/">Go back to upload</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Có thể thêm tiêu đề hoặc thông tin khác ở đây */}
      <PresentationViewer presentationId={presentationId} />
      <hr />
      <Link to="/">Upload another presentation</Link>
    </div>
  );
}

export default PresentationViewerPage;