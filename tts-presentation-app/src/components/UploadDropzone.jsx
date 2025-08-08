// File: src/components/UploadDropzone.jsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group, Text, rem, Center } from '@mantine/core'; // Component của Mantine
import { Dropzone, MIME_TYPES } from '@mantine/dropzone'; // Import Dropzone và MIME types
import { IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react'; // Icons
import api from '../services/api'; // API client

// Style cho Dropzone (có thể đặt trong file CSS)
const dropzoneStyle = {
  border: `2px dashed #495057`, // Viền đứt nét màu xám tối
  padding: rem(50), // Padding lớn
  borderRadius: 'var(--mantine-radius-md)',
  backgroundColor: 'var(--mantine-color-dark-6)', // Nền tối hơn một chút
  minHeight: rem(220), // Chiều cao tối thiểu
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  // Chiếm khoảng 30% viewport width, max-width để không quá lớn
  width: 'clamp(300px, 30vw, 600px)', // min, preferred, max width
  margin: 'auto', // Căn giữa
  cursor: 'pointer',
  transition: 'background-color 0.15s ease', // Hiệu ứng hover

  '&:hover': {
    backgroundColor: 'var(--mantine-color-dark-5)',
  },
};

const iconStyle = {
  width: rem(52),
  height: rem(52),
  color: 'var(--mantine-color-dimmed)', // Màu icon mờ
};

function UploadDropzone() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Hàm xử lý khi file được thả vào hoặc chọn
  const handleDrop = useCallback(async (files) => {
    setError('');
    if (files.length === 0) {
      setError('No file selected.');
      return;
    }
    if (files.length > 1) {
      setError('Please upload only one file at a time.');
      return;
    }

    const file = files[0];
    console.log('Accepted file:', file.name, file.size);
    setIsLoading(true);

    try {
      // Gọi API upload
      const presentationInfo = await api.uploadPresentation(file, (progressEvent) => {
        // Có thể cập nhật state tiến trình ở đây nếu muốn hiển thị chi tiết hơn
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload Progress: ${percentCompleted}%`);
      });

      console.log('Upload successful:', presentationInfo);
      if (presentationInfo && presentationInfo.id) {
        navigate(`/presentation/${presentationInfo.id}`); // Chuyển trang khi thành công
      } else {
        throw new Error('API response successful but missing presentation ID.');
      }

    } catch (err) {
      console.error('Upload failed:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'An unknown error occurred during upload.';
      setError(`Upload Failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return (
    <div style={{ padding: '20px 0' }}>
      <Dropzone
        onDrop={handleDrop}
        onReject={(files) => {
            console.log('rejected files', files);
            setError('File rejected. Please ensure it is a .ppt or .pptx file.');
        }}
        maxSize={50 * 1024 ** 2} // Giới hạn 50MB (ví dụ)
        accept={[
          MIME_TYPES.ppt, // application/vnd.ms-powerpoint
          MIME_TYPES.pptx, // application/vnd.openxmlformats-officedocument.presentationml.presentation
        ]}
        loading={isLoading} // Hiển thị trạng thái loading của Dropzone
        style={dropzoneStyle} // Áp dụng style đã định nghĩa
        // disabled={isLoading} // Có thể disable khi đang loading
      >
        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
          {/* Icon và Text hướng dẫn */}
          <Dropzone.Accept>
            <IconDownload style={iconStyle} stroke={1.5} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX style={iconStyle} stroke={1.5} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconCloudUpload style={iconStyle} stroke={1.5} />
          </Dropzone.Idle>

          <div style={{ textAlign: 'center' }}>
            <Text size="xl" inline>
              Drag presentation here or click to select file
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Attach one .ppt or .pptx file, up to 50MB
            </Text>
          </div>
        </Group>
      </Dropzone>

      {/* Hiển thị lỗi nếu có */}
      {error && <Text c="red" ta="center" mt="md">Error: {error}</Text>}
      {isLoading && <Text ta="center" mt="md">Uploading, please wait...</Text>}
    </div>
  );
}

export default UploadDropzone;