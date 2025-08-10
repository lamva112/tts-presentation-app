// File: src/components/layout/AppHeader.jsx
import React, { useState, useEffect } from 'react';
import { Group, Burger, Title, Avatar, Menu, ActionIcon, Text, Button, Modal, FileInput, Stack, Badge, Progress } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSettings, IconLogout, IconUserCircle, IconUpload, IconFileText, IconFileDescription, IconCheck, IconX, IconPresentation, IconLoader } from '@tabler/icons-react'; // Icon cho menu
import { uploadDocument, uploadUserScript, generateBotScript } from '../../services/api';

function AppHeader({ mobileOpened, toggleMobile, desktopOpened, toggleDesktop }) {
  // State cho việc mở/đóng user menu
  const [userMenuOpened, { toggle: toggleUserMenu }] = useDisclosure(false);
  // State cho modal upload
  const [uploadModalOpened, { open: openUploadModal, close: closeUploadModal }] = useDisclosure(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [notification, setNotification] = useState(null);
  const [hasPresentation, setHasPresentation] = useState(false);
  const [presentationId, setPresentationId] = useState(null);
  const [processingStep, setProcessingStep] = useState(''); // 'uploading', 'user-script', 'bot-script'
  const [progressValue, setProgressValue] = useState(0);

  // TODO: Thay thế bằng logic lấy thông tin user thật khi có xác thực
  const isLoggedIn = true; // Giả sử đã login
  const user = { name: 'User Name', email: 'user@example.com', avatarUrl: null }; // Dữ liệu user mẫu

  // Kiểm tra xem có presentation nào đã được upload chưa
  useEffect(() => {
    // TODO: Thay thế bằng logic thực tế kiểm tra presentation
    // Tạm thời set false để test UI khi không có presentation
    setHasPresentation(false);
    setPresentationId(null);
  }, []);

  const handleLogout = () => {
    console.log("Logout clicked");
    // TODO: Thêm logic logout
  }

  const showNotification = (title, message, color = 'blue') => {
    setNotification({ title, message, color });
    setTimeout(() => setNotification(null), 5000); // Auto hide after 5 seconds
  };

  const handleDocumentUpload = async () => {
    if (!uploadFile) return;

    // Kiểm tra xem có presentation ID không
    if (!presentationId) {
      showNotification('No Presentation Found', 'Please upload a PowerPoint presentation first before uploading materials.', 'red');
      return;
    }

    setUploading(true);
    setProcessingStep('uploading');
    setProgressValue(0);

    try {
      // Step 1: Upload materials
      const formData = new FormData();
      formData.append('file', uploadFile);

      console.log('Step 1: Uploading materials...');
      setProgressValue(20);
      const response = await uploadDocument(formData);
      console.log('Materials uploaded successfully:', response);
      setProgressValue(40);

      // Step 2: Upload user script
      console.log('Step 2: Uploading user script...');
      setProcessingStep('user-script');
      setProgressValue(60);
      await uploadUserScript(presentationId);
      console.log('User script uploaded successfully');
      setProgressValue(80);

      // Step 3: Generate bot script
      console.log('Step 3: Generating bot script...');
      setProcessingStep('bot-script');
      setProgressValue(90);
      await generateBotScript(presentationId);
      console.log('Bot script generated successfully');
      setProgressValue(100);

      // Success notification
      showNotification('Processing Complete!', `Materials processed and scripts generated successfully for "${uploadFile.name}".`, 'green');

      // Reset form and close modal
      setUploadFile(null);
      closeUploadModal();

    } catch (error) {
      console.error('Processing failed:', error);

      // Show error notification
      let errorMessage = 'Processing failed. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification('Processing Failed', errorMessage, 'red');
    } finally {
      setUploading(false);
      setProcessingStep('');
      setProgressValue(0);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setProcessingStep('');
    setProgressValue(0);
  };

  const getStepText = () => {
    switch (processingStep) {
      case 'uploading':
        return 'Uploading materials...';
      case 'user-script':
        return 'Processing user script...';
      case 'bot-script':
        return 'Generating bot script...';
      default:
        return 'Processing...';
    }
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
          {/* <img src="/path/to/logo.png" alt="Logo" height={30} /> */}
        </Group>

        {/* Khu vực Upload Button và User Menu */}
        <Group>
          {/* Upload Presentation Materials Button - chỉ hiện khi có presentation */}
          {hasPresentation ? (
            <Button
              leftSection={uploading ? <IconLoader size={18} className="rotating" /> : <IconPresentation size={18} />}
              rightSection={!uploading && <Badge size="xs" variant="light" color="blue">Materials</Badge>}
              variant={uploading ? "light" : "gradient"}
              gradient={uploading ? undefined : { from: 'blue', to: 'cyan', deg: 45 }}
              color={uploading ? "blue" : undefined}
              onClick={openUploadModal}
              size="md"
              radius="xl"
              loading={uploading}
              disabled={uploading}
              style={{
                boxShadow: uploading ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease',
                fontWeight: 600,
                letterSpacing: '0.5px',
                minWidth: '180px'
              }}
              onMouseEnter={(e) => {
                if (!uploading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!uploading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                }
              }}
            >
              {uploading ? getStepText() : 'Upload Materials'}
            </Button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <IconPresentation size={16} color="#6b7280" />
              <Text size="sm" c="dimmed">
                Upload a PowerPoint presentation first to enable materials upload
              </Text>
            </div>
          )}

          {isLoggedIn ? (
            <Menu shadow="md" width={200} opened={userMenuOpened} onChange={toggleUserMenu}>
              <Menu.Target>
                {/* Sử dụng ActionIcon nếu không có ảnh avatar */}
                <ActionIcon variant="default" size="lg" radius="xl" aria-label="User menu">
                  {user.avatarUrl ? (
                    <Avatar src={user.avatarUrl} alt={user.name} radius="xl" />
                  ) : (
                    <IconUserCircle style={{ width: '70%', height: '70%' }} stroke={1.5} />
                  )}
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {user.name && <Menu.Label>{user.name}</Menu.Label>}
                <Menu.Item leftSection={<IconSettings size={14} />}>
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" onClick={handleLogout} leftSection={<IconLogout size={14} />}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Text>Login</Text> // Hoặc Button Login
          )}
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

            {/* Progress Bar khi đang xử lý */}
            {uploading && (
              <div>
                <Text size="sm" fw={500} mb="xs" c="blue">
                  {getStepText()}
                </Text>
                <Progress
                  value={progressValue}
                  color="blue"
                  size="md"
                  radius="md"
                  striped
                  animated
                />
                <Text size="xs" c="dimmed" mt="xs" ta="center">
                  {progressValue}% Complete
                </Text>
              </div>
            )}

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
                {uploading ? 'Processing...' : 'Upload Materials'}
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Group>

      {/* CSS cho icon rotating */}
      <style jsx>{`
        .rotating {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default AppHeader;