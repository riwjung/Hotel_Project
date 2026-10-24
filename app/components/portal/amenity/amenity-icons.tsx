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
// Shared muted colors keep each icon consistent in tables, tags and pickers.
const COLORS = {
  connectivity: "#2563a6",
  comfort: "#177d8d",
  entertainment: "#7053a1",
  food: "#976335",
  nature: "#43814b",
  service: "#8a6c37",
  warmth: "#b35638",
};

export const AMENITY_ICONS: Record<string, ReactNode> = {
  WifiOutlined: <WifiOutlined style={{ color: COLORS.connectivity }} />,
  CloudOutlined: <CloudOutlined style={{ color: COLORS.comfort }} />,
  DesktopOutlined: <DesktopOutlined style={{ color: COLORS.entertainment }} />,
  CoffeeOutlined: <CoffeeOutlined style={{ color: COLORS.food }} />,
  ExperimentOutlined: <ExperimentOutlined style={{ color: COLORS.comfort }} />,
  EnvironmentOutlined: <EnvironmentOutlined style={{ color: COLORS.nature }} />,
  LaptopOutlined: <LaptopOutlined style={{ color: COLORS.connectivity }} />,
  CarOutlined: <CarOutlined style={{ color: COLORS.connectivity }} />,
  KeyOutlined: <KeyOutlined style={{ color: COLORS.service }} />,
  ThunderboltOutlined: <ThunderboltOutlined style={{ color: COLORS.service }} />,
  SoundOutlined: <SoundOutlined style={{ color: COLORS.entertainment }} />,
  SafetyOutlined: <SafetyOutlined style={{ color: COLORS.nature }} />,
  BellOutlined: <BellOutlined style={{ color: COLORS.service }} />,
  FireOutlined: <FireOutlined style={{ color: COLORS.warmth }} />,
  SkinOutlined: <SkinOutlined style={{ color: COLORS.entertainment }} />,
  ShopOutlined: <ShopOutlined style={{ color: COLORS.food }} />,
  PhoneOutlined: <PhoneOutlined style={{ color: COLORS.connectivity }} />,
};

export const amenityIconOptions = Object.entries(AMENITY_ICONS).map(([name, icon]) => ({
  value: name,
  label: (
    <span>
      {icon} {name.replace(/Outlined$/, "")}
    </span>
  ),
}));
