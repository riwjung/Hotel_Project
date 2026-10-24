"use client";

import { Tag } from "antd";
import { AMENITY_ICONS } from "./amenity-icons";

type Props = {
  amenityName: string;
  icon?: string | null;
  note?: string | null;
};

export default function AmenityTag({ amenityName, icon, note }: Props) {
  return (
    <Tag icon={icon && Object.hasOwn(AMENITY_ICONS, icon) ? AMENITY_ICONS[icon] : undefined}>
      {amenityName}{note ? ` · ${note}` : ""}
    </Tag>
  );
}
