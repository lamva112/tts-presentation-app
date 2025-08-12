// File: src/components/layout/AppHeader.jsx
import React from 'react';
import { Group, Burger, Title } from '@mantine/core';

function AppHeader({ mobileOpened, toggleMobile, desktopOpened, toggleDesktop }) {
  return (
    <Group h="100%" px="md" justify="space-between">
      {/* Burger menu cho mobile và nút ẩn/hiện sidebar desktop */}
      <Group>
        <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
        <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
        {/* Logo hoặc Tiêu đề ứng dụng */}
        <Title order={3} size="h4">PPT Presenter AI</Title>
      </Group>
    </Group>
  );
}

export default AppHeader;