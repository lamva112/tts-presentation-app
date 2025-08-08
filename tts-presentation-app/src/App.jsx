// File: src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppShell, Burger, Group, Title, NavLink, Text } from '@mantine/core'; // Import component Mantine
import { useDisclosure } from '@mantine/hooks'; // Hook để quản lý trạng thái đóng/mở navbar mobile
import { IconHome2, IconFileText } from '@tabler/icons-react'; // Import icon (cần cài @tabler/icons-react)

// Import các trang
import UploadPage from './pages/UploadPage';
import PresentationViewerPage from './pages/PresentationViewerPage';
// Import các component layout (sẽ tạo)
import AppHeader from './components/layout/AppHeader'; // Header riêng
// import AppNavbar from './components/layout/AppNavbar'; // Navbar riêng (nếu cần phức tạp)

// Cài đặt icons nếu chưa có: npm install @tabler/icons-react
// hoặc: yarn add @tabler/icons-react

function App() {
  // Hook quản lý trạng thái mở/đóng navbar trên mobile
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  // Hook quản lý trạng thái mở/đóng navbar trên desktop (nếu dùng sidebar thu gọn)
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <BrowserRouter>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 250, // Độ rộng navbar
          breakpoint: 'sm', // Ẩn navbar thành burger menu khi màn hình nhỏ hơn 'sm'
          collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
        }}
        padding="md" // Padding cho vùng nội dung chính
      >
        {/* Header */}
        <AppShell.Header>
           {/* Component Header tùy chỉnh */}
           <AppHeader mobileOpened={mobileOpened} toggleMobile={toggleMobile} desktopOpened={desktopOpened} toggleDesktop={toggleDesktop}/>
        </AppShell.Header>

        {/* Navbar (Sidebar) */}
        <AppShell.Navbar p="md">
          <Text fw={500} mb="sm">Navigation</Text>
          {/* Sử dụng NavLink của Mantine kết hợp Link của React Router */}
          <NavLink
              href="/"
              label="Home / Upload"
              leftSection={<IconHome2 size="1rem" stroke={1.5} />}
              component={Link} // Quan trọng: Dùng component Link của router
              to="/"
              onClick={toggleMobile} // Đóng navbar mobile khi click link
          />
          <NavLink
              href="/manage" // Đường dẫn ví dụ cho trang quản lý
              label="Manage Documents"
              leftSection={<IconFileText size="1rem" stroke={1.5} />}
              component={Link}
              to="/manage" // Thay đổi thành route thực tế nếu có
              onClick={toggleMobile}
              disabled // Tạm thời vô hiệu hóa
          />
          {/* Thêm các link điều hướng khác ở đây */}
        </AppShell.Navbar>

        {/* Main Content Area */}
        <AppShell.Main>
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/presentation/:presentationId" element={<PresentationViewerPage />} />
            {/* Thêm route cho /manage nếu có */}
            <Route path="/manage" element={<div>Manage Documents Page (Not Implemented)</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;