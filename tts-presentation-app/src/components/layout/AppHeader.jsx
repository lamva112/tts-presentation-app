// File: src/components/layout/AppHeader.jsx
import React, { useState } from 'react';
import { Group, Burger, Title, Text, Button, Modal, FileInput, Stack, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUpload, IconFileText, IconFileDescription, IconPresentation } from '@tabler/icons-react';
import { uploadDocument } from '../../services/api';

function AppHeader({ mobileOpened, toggleMobile, desktopOpened, toggleDesktop }) {
  const [uploadModalOpened, { open: openUploadModal, close: closeUploadModal }] = useDisclosure(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (title, message, color = 'blue') => {
    setNotification({ title, message, color });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDocumentUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      console.log('Uploading materials...');
      const response = await uploadDocument(formData);
      console.log('Materials uploaded successfully:', response);

      showNotification('Upload Complete!', `Materials uploaded successfully: "${uploadFile.name}"`, 'green');

      // Reset form and close modal
      setUploadFile(null);
      closeUploadModal();

    } catch (error) {
      console.error('Upload failed:', error);

      let errorMessage = 'Upload failed. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification('Upload Failed', errorMessage, 'red');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
  };

  return (
    <>
      {/* Notification Banner */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '20px',
          zIndex: 1000,
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: notification.color === 'green' ? '#4caf50' : notification.color === 'red' ? '#f44336' : '#2196f3',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '300px',
          wordWrap: 'break-word'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{notification.title}</div>
          <div style={{ fontSize: '14px' }}>{notification.message}</div>
        </div>
      )}

      <Group h="100%" px="md" justify="space-between">
        {/* Burger menu cho mobile và nút ẩn/hiện sidebar desktop */}
        <Group>
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
          <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
          {/* Logo hoặc Tiêu đề ứng dụng */}
          <Title order={3} size="h4">PPT Presenter AI</Title>
        </Group>

        {/* Khu vực Upload Button */}
        <Group>
          {/* Upload Presentation Materials Button */}
          <Button
            leftSection={<IconPresentation size={18} />}
            rightSection={<Badge size="xs" variant="light" color="blue">Materials</Badge>}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
            onClick={openUploadModal}
            size="md"
            radius="xl"
            style={{
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
              fontWeight: 600,
              letterSpacing: '0.5px',
              minWidth: '180px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
            }}
          >
            Upload Materials
          </Button>
        </Group>

        {/* Upload Materials Modal */}
        <Modal
          opened={uploadModalOpened}
          onClose={closeUploadModal}
          title={
            <Group gap="sm">
              <IconPresentation size={20} color="#3b82f6" />
              <Text fw={600}>Upload Presentation Materials</Text>
            </Group>
          }
          size="md"
          onCloseComplete={resetUploadForm}
          styles={{
            title: {
              fontSize: '18px',
              fontWeight: 600
            }
          }}
        >
          <Stack gap="lg">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <IconFileDescription size={48} color="#6b7280" />
              <Text size="sm" c="dimmed" mt="xs">
                Upload supporting materials for your presentation
              </Text>
            </div>

            <FileInput
              label="Select Materials"
              placeholder="Choose Word, PDF, or other supporting files"
              accept=".doc,.docx,.pdf,.txt,.md,.rtf"
              value={uploadFile}
              onChange={setUploadFile}
              leftSection={<IconFileText size={16} />}
              required
              disabled={uploading}
              styles={{
                input: {
                  borderColor: '#e5e7eb',
                  '&:focus': {
                    borderColor: '#3b82f6'
                  }
                }
              }}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={closeUploadModal} radius="md" disabled={uploading}>
                Cancel
              </Button>
              <Button
                onClick={handleDocumentUpload}
                loading={uploading}
                disabled={!uploadFile || uploading}
                leftSection={<IconUpload size={16} />}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
                radius="md"
                style={{ fontWeight: 600 }}
              >
                {uploading ? 'Uploading...' : 'Upload Materials'}
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Group>
    </>
  );
}

export default AppHeader;