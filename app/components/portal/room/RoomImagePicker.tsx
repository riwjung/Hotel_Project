"use client";

import { Button, Empty, Image, Select, Space, Tag, Typography } from "antd";
import type { RoomImageOption } from "./types";

type Props = {
  value?: string[];
  onChange?: (value: string[]) => void;
  options: RoomImageOption[];
  loading?: boolean;
};

const FALLBACK = "/images/rooms/placeholder.svg";

const fileName = (url: string) => url.split("/").pop() ?? url;

/** Picks a room's gallery from photos other rooms already use. The first photo is the cover. */
export default function RoomImagePicker({ value = [], onChange, options, loading }: Props) {
  const byUrl = new Map(options.map((option) => [option.imageUrl, option]));
  const caption = (url: string) => byUrl.get(url)?.imageCaption || fileName(url);
  const makeCover = (url: string) => onChange?.([url, ...value.filter((item) => item !== url)]);

  return (
    <Space orientation="vertical" size="small" style={{ width: "100%" }}>
      <Select
        mode="multiple"
        allowClear
        loading={loading}
        disabled={loading}
        value={value}
        onChange={onChange}
        placeholder={loading ? "Loading photos…" : "Choose from photos in existing rooms"}
        optionFilterProp="label"
        maxTagCount="responsive"
        notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No room photos yet" />}
        options={options.map((option) => ({ value: option.imageUrl, label: caption(option.imageUrl) }))}
        optionRender={(item) => {
          const option = byUrl.get(String(item.value));
          return (
            <Space align="center">
              <Image
                src={String(item.value)}
                fallback={FALLBACK}
                alt=""
                preview={false}
                width={64}
                height={43}
                style={{ objectFit: "cover", borderRadius: 4 }}
              />
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <Typography.Text ellipsis>{item.label}</Typography.Text>
                {option && (
                  <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                    {option.usedBy}
                  </Typography.Text>
                )}
              </span>
            </Space>
          );
        }}
      />

      {value.length > 0 && (
        <Image.PreviewGroup>
          <Space wrap size="small" align="start">
            {value.map((url, index) => (
              <div key={url} style={{ width: 120 }}>
                <Image
                  src={url}
                  fallback={FALLBACK}
                  alt={caption(url)}
                  width={120}
                  height={80}
                  style={{ objectFit: "cover", borderRadius: 6 }}
                />
                {index === 0 ? (
                  <Tag color="gold" style={{ marginTop: 4 }}>Cover</Tag>
                ) : (
                  <Button type="link" size="small" style={{ padding: 0 }} onClick={() => makeCover(url)}>
                    Make cover
                  </Button>
                )}
              </div>
            ))}
          </Space>
        </Image.PreviewGroup>
      )}
    </Space>
  );
}
