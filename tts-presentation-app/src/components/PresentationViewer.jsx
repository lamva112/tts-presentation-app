// File: src/components/PresentationViewer.jsx
// Sử dụng react-documents và truyền isLoading xuống ControlPanel

import React, { useState, useEffect, useCallback } from 'react';
import { DocumentViewer } from 'react-documents'; // Import DocumentViewer
import api from '../services/api'; // API client
import ControlPanel from './ControlPanel'; // Component chứa nút điều khiển

// Không cần định nghĩa OFFICE_VIEWER_BASE_URL khi dùng react-documents với viewer="office"

function PresentationViewer({ presentationId }) {
  // State lưu SAS URL thô nhận từ backend
  const [sasUrl, setSasUrl] = useState('');
  // State cho trạng thái loading khi gọi API lấy SAS URL và status
  const [isLoading, setIsLoading] = useState(true); // Bắt đầu là true
  // State lưu lỗi
  const [error, setError] = useState('');
  // State lưu slide hiện tại (do frontend quản lý cho các nút control)
  const [currentSlideNumber, setCurrentSlideNumber] = useState(1);
  // State lưu tổng số slide
  const [totalSlides, setTotalSlides] = useState(0);

  // Log khi component mount hoặc ID thay đổi
  console.log("PresentationViewer (react-documents) mounted/updated with ID:", presentationId);

  // Hàm fetch dữ liệu (SAS URL và Status/Slide Count)
  const fetchData = useCallback(async () => {
    if (!presentationId) {
        console.error("PresentationViewer: presentationId prop is missing.");
        setError("Presentation ID is missing.");
        setIsLoading(false);
        return;
    };

    console.log(`PresentationViewer: Bắt đầu lấy dữ liệu cho ID: ${presentationId}`);
    setIsLoading(true);
    setError('');
    setSasUrl('');
    setTotalSlides(0);
    setCurrentSlideNumber(1);

    try {
      // --- Lấy SAS URL ---
      console.log(`PresentationViewer: Đang gọi API /view-url...`);
      const viewUrlData = await api.getViewUrl(presentationId);
      console.log("PresentationViewer: Dữ liệu thô từ /view-url:", viewUrlData);

      if (viewUrlData && viewUrlData.viewUrl && typeof viewUrlData.viewUrl === 'string') {
        const rawSasUrl = viewUrlData.viewUrl;
        console.log(`PresentationViewer: Đã nhận SAS URL (hết hạn ${viewUrlData.sasExpiry}): ${rawSasUrl.substring(0, 100)}...`);
        // Cập nhật state với SAS URL thô
        setSasUrl(rawSasUrl);
        // react-documents với viewer="office" sẽ tự xử lý việc nhúng vào URL Office
      } else {
        throw new Error('Dữ liệu URL xem không hợp lệ hoặc bị thiếu từ API.');
      }

      // --- Lấy Status/Slide Count ---
      console.log(`PresentationViewer: Đang gọi API /presentations/{id} để lấy status...`);
      try {
            const statusData = await api.getPresentationStatus(presentationId);
            console.log("PresentationViewer: Dữ liệu thô từ /presentations/{id}:", statusData);
            if (statusData && typeof statusData.slideCount === 'number' && statusData.slideCount >= 0) {
                setTotalSlides(statusData.slideCount);
                console.log(`PresentationViewer: Tổng số slide được cập nhật: ${statusData.slideCount}`);
            } else {
                console.warn("PresentationViewer: Không thể lấy được số slide hợp lệ.");
            }
      } catch (statusError) {
          console.error("PresentationViewer: Lỗi khi lấy status/slide count:", statusError);
          // Không chặn hiển thị viewer chỉ vì lỗi lấy status
      }

    } catch (err) {
      // Xử lý lỗi chung khi fetch data
      console.error('PresentationViewer: Lỗi trong quá trình fetchData:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể tải dữ liệu bài thuyết trình.';
      setError(errorMessage);
      setSasUrl(''); // Xóa SAS URL nếu lỗi
    } finally {
      // Luôn tắt loading
      setIsLoading(false);
      console.log("PresentationViewer: fetchData hoàn thành, isLoading = false");
    }
  }, [presentationId]);

  // Gọi fetchData khi mount hoặc presentationId thay đổi
  useEffect(() => {
    console.log("PresentationViewer: useEffect được kích hoạt, gọi fetchData.");
    fetchData();
  }, [fetchData]);

  // Callback cho ControlPanel để đổi slide number (phía frontend)
  const handleSlideChange = useCallback((newSlideNumber) => {
    if (newSlideNumber >= 1 && (totalSlides <= 0 || newSlideNumber <= totalSlides)) {
       console.log("PresentationViewer: Số slide hiện tại (frontend) thay đổi thành:", newSlideNumber);
       setCurrentSlideNumber(newSlideNumber);
    } else {
        console.warn(`PresentationViewer: Cố gắng chuyển đến slide không hợp lệ: ${newSlideNumber} (Tổng số: ${totalSlides})`);
    }
  }, [totalSlides]);

  // --- Logic Render ---
  console.log("PresentationViewer: Chuẩn bị render với State:", { isLoading, error, sasUrl: sasUrl ? sasUrl.substring(0,60)+'...' : sasUrl, currentSlideNumber, totalSlides });

  // Hiển thị Loading
  if (isLoading) {
    return <div>Đang tải trình xem bài thuyết trình... Vui lòng đợi.</div>;
  }

  // Hiển thị Lỗi
  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>Lỗi tải bài thuyết trình: {error}</div>;
  }

  // Hiển thị chờ nếu chưa có URL (sau khi hết loading và không có lỗi)
  if (!sasUrl) {
      return <div>Đang chờ URL bài thuyết trình...</div>;
  }

  // Render giao diện chính
  return (
    <div className="presentation-viewer">
      <h3>Trình xem Bài thuyết trình</h3>
      <p>Slide Hiện tại (cho Audio/Script): {currentSlideNumber}{totalSlides > 0 ? ` / ${totalSlides}` : ''}</p>
      <p style={{fontSize: '0.8em', color: 'gray', fontStyle: 'italic'}}>
          Lưu ý: Sử dụng các nút điều khiển bên trong khung xem dưới đây để chuyển slide hiển thị.
          Sử dụng các nút điều khiển bên dưới khung xem cho các tính năng Âm thanh và Kịch bản AI tương ứng với số "Slide Hiện tại" hiển thị ở trên.
      </p>

      {/* Sử dụng DocumentViewer thay cho iframe tự tạo */}
      <div className="viewer-container" style={{ border: '1px solid #ccc', margin: '10px 0', height: '600px' }}>
        <DocumentViewer
          url={sasUrl} // Truyền SAS URL thô
          viewer="office" // Sử dụng Office Online viewer
          style={{ width: '100%', height: '100%' }} // Style cho component viewer
        />
      </div>

      {/* Render ControlPanel và truyền prop isLoading xuống */}
      <ControlPanel
        presentationId={presentationId}
        currentSlideNumber={currentSlideNumber}
        totalSlides={totalSlides}
        onSlideChange={handleSlideChange}
        isLoading={isLoading} // <<< Đã thêm prop này để sửa lỗi ReferenceError
      />
    </div>
  );
}

export default PresentationViewer;