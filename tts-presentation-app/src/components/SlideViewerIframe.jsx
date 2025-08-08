// File: src/components/SlideViewerIframe.jsx (Đã sửa)
import React from 'react';

function SlideViewerIframe({ officeUrl }) {
  if (!officeUrl) {
    return <div>Loading viewer URL...</div>;
  }

  // Áp dụng CSS để xóa đường viền và đặt kích thước
  // Bạn có thể đặt các style này trong file CSS riêng và dùng className
  const iframeStyle = {
    width: '100%',
    height: '500px', // Hoặc dùng kỹ thuật CSS khác để giữ tỷ lệ khung hình
    border: 'none'   // <<< Sử dụng CSS border: 'none' thay cho frameBorder='0'
  };

  return (
    // Div container vẫn giữ border của nó như ví dụ trước
    <div className="iframe-container" style={{ border: '1px solid #ccc', margin: '10px 0' }}>
      <iframe
        src={officeUrl}
        style={iframeStyle} // Áp dụng style CSS
        // frameBorder="0" // <<< XÓA BỎ thuộc tính đã lỗi thời này
        title="Presentation Viewer - Office Online" // Giữ lại title cho accessibility
        allowFullScreen // Giữ lại nếu muốn cho phép toàn màn hình
      >
        Trình duyệt của bạn không hỗ trợ iframe.
        {/* Your browser does not support iframes. */}
      </iframe>
    </div>
  );
}

export default SlideViewerIframe;