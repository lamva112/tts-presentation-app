// File: src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
// 1. Import MantineProvider và CSS
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
// Import CSS của Mantine (quan trọng!)
import '@mantine/core/styles.css';
// Import CSS cho Dropzone (nếu cần style mặc định)
import '@mantine/dropzone/styles.css';

import App from './App';
// import './index.css'; // File CSS gốc của Vite (có thể giữ hoặc xóa/sửa)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Thêm ColorSchemeScript để quản lý theme server-side/client-side */}
    <ColorSchemeScript defaultColorScheme="dark" />
    {/* 2. Bọc App trong MantineProvider */}
    {/* Đặt defaultColorScheme="dark" để bật chế độ tối mặc định */}
    <MantineProvider defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);