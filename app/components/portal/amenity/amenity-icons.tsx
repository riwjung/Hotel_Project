"use client";

import type { ReactNode } from "react";
import {
  BellOutlined,
  CarOutlined,
  CloudOutlined,
  CoffeeOutlined,
  DesktopOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  FireOutlined,
  KeyOutlined,
  LaptopOutlined,
  PhoneOutlined,
  SafetyOutlined,
  ShopOutlined,
  SkinOutlined,
  SoundOutlined,
  ThunderboltOutlined,
  WifiOutlined,
} from "@ant-design/icons";

// amenity.icon stores an icon component name. Only these are bundled, so the
// picker offers exactly this list; an unknown stored name shows as plain text.
export const AMENITY_ICONS: Record<string, ReactNode> = {
  WifiOutlined: <WifiOutlined />,
  CloudOutlined: <CloudOutlined />,
  DesktopOutlined: <DesktopOutlined />,
  CoffeeOutlined: <CoffeeOutlined />,
  ExperimentOutlined: <ExperimentOutlined />,
  EnvironmentOutlined: <EnvironmentOutlined />,
  LaptopOutlined: <LaptopOutlined />,
  CarOutlined: <CarOutlined />,
  KeyOutlined: <KeyOutlined />,
  ThunderboltOutlined: <ThunderboltOutlined />,
  SoundOutlined: <SoundOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  BellOutlined: <BellOutlined />,
  FireOutlined: <FireOutlined />,
  SkinOutlined: <SkinOutlined />,
  ShopOutlined: <ShopOutlined />,
  PhoneOutlined: <PhoneOutlined />,
};

export const amenityIconOptions = Object.entries(AMENITY_ICONS).map(([name, icon]) => ({
  value: name,
  label: (
    <span>
      {icon} {name.replace(/Outlined$/, "")}
    </span>
  ),
}));
