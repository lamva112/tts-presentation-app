// File: src/components/layout/AppHeader.jsx
import React, { useState } from 'react';
import { Group, Burger, Title, Avatar, Menu, ActionIcon, Text, Button, Modal, FileInput, Textarea, Stack, notifications } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSettings, IconLogout, IconUserCircle, IconUpload, IconFileText, IconFileDescription, IconCheck, IconX } from '@tabler/icons-react'; // Icon cho menu
import { uploadDocument } from '../../services/api';

function AppHeader({ mobileOpened, toggleMobile, desktopOpened, toggleDesktop }) {
  // State cho việc mở/đóng user menu
  const [userMenuOpened, { toggle: toggleUserMenu }] = useDisclosure(false);
  // State cho modal upload
  const [uploadModalOpened, { open: openUploadModal, close: closeUploadModal }] = useDisclosure(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');

  // TODO: Thay thế bằng logic lấy thông tin user thật khi có xác thực
  const isLoggedIn = true; // Giả sử đã login
  const user = { name: 'User Name', email: 'user@example.com', avatarUrl: null }; // Dữ liệu user mẫu

  const handleLogout = () => {
      console.log("Logout clicked");
      // TODO: Thêm logic logout
  }

  const handleDocumentUpload = async () => {
    if (!uploadFile) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadDescription.trim()) {
        formData.append('description', uploadDescription.trim());
      }
      
      const response = await uploadDocument(formData);
      console.log('Document uploaded successfully:', response);
      
      // Show success notification
      notifications.show({
        title: 'Upload Successful!',
        message: `Document "${uploadFile.name}" has been uploaded successfully.`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
      // Reset form and close modal
      setUploadFile(null);
      setUploadDescription('');
      closeUploadModal();
      
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Show error notification
      let errorMessage = 'Upload failed. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      notifications.show({
        title: 'Upload Failed',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadDescription('');
  };

  return (
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
          {/* Upload Document Button */}
          <Button
            leftSection={<IconUpload size={16} />}
            variant="light"
            color="blue"
            onClick={openUploadModal}
            size="sm"
          >
            Upload Document
          </Button>

          {isLoggedIn ? (
               <Menu shadow="md" width={200} opened={userMenuOpened} onChange={toggleUserMenu}>
                 <Menu.Target>
                   {/* Sử dụng ActionIcon nếu không có ảnh avatar */}
                   <ActionIcon variant="default" size="lg" radius="xl" aria-label="User menu">
                     {user.avatarUrl ? (
                         <Avatar src={user.avatarUrl} alt={user.name} radius="xl" />
                     ) : (
                         <IconUserCircle style={{ width: '70%', height: '70%' }} stroke={1.5}/>
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

      {/* Upload Document Modal */}
      <Modal 
        opened={uploadModalOpened} 
        onClose={closeUploadModal}
        title="Upload Document"
        size="md"
        onCloseComplete={resetUploadForm}
      >
        <Stack gap="md">
          <FileInput
            label="Select Document"
            placeholder="Choose Word or PDF file"
            accept=".doc,.docx,.pdf"
            value={uploadFile}
            onChange={setUploadFile}
            leftSection={<IconFileText size={16} />}
            required
          />
          
          <Textarea
            label="Description (Optional)"
            placeholder="Add a description for this document..."
            value={uploadDescription}
            onChange={(event) => setUploadDescription(event.currentTarget.value)}
            leftSection={<IconFileDescription size={16} />}
            rows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={closeUploadModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleDocumentUpload}
              loading={uploading}
              disabled={!uploadFile}
              leftSection={<IconUpload size={16} />}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Group>
  );
}

export default AppHeader;