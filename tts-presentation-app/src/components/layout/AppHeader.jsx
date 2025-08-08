// File: src/components/layout/AppHeader.jsx
import React from 'react';
import { Group, Burger, Title, Avatar, Menu, ActionIcon, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSettings, IconLogout, IconUserCircle } from '@tabler/icons-react'; // Icon cho menu

function AppHeader({ mobileOpened, toggleMobile, desktopOpened, toggleDesktop }) {
  // State cho việc mở/đóng user menu
  const [userMenuOpened, { toggle: toggleUserMenu }] = useDisclosure(false);

  // TODO: Thay thế bằng logic lấy thông tin user thật khi có xác thực
  const isLoggedIn = true; // Giả sử đã login
  const user = { name: 'User Name', email: 'user@example.com', avatarUrl: null }; // Dữ liệu user mẫu

  const handleLogout = () => {
      console.log("Logout clicked");
      // TODO: Thêm logic logout
  }

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

      {/* Khu vực User Menu */}
      <Group>
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
    </Group>
  );
}

export default AppHeader;