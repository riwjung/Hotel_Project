"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftOutlined, HomeOutlined, PictureOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Empty, Image, Space, Tag, Typography } from "antd";
import { formatMoney } from "@/app/lib/format";
import { ROOM_STATUS } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import LoadError from "../LoadError";
import StatusTag from "../StatusTag";
import { fetchRoom } from "./room.api";

const FALLBACK = "/images/rooms/placeholder.svg";

export default function RoomDetailPage({ roomId }: { roomId: number }) {
  const router = useRouter();
  const state = useApiData((signal) => fetchRoom(roomId, signal), String(roomId));
  if (state.error) return <LoadError error={state.error} onRetry={state.reload} />;
  if (!state.data) return <Card variant="outlined" loading />;
  const room = state.data;

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Space wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/rooms")}>Back to rooms</Button>
        <Typography.Title level={3} style={{ margin: 0 }}>{room.branchCode} · Room {room.roomNumber}</Typography.Title>
        <StatusTag value={room.roomStatus} palette={ROOM_STATUS} />
      </Space>

      <Card variant="outlined" title={<Space><PictureOutlined />Gallery</Space>}>
        {room.images.length ? (
          <Image.PreviewGroup>
            <Space wrap size="middle" align="start">
              {room.images.map((item) => (
                <div key={item.imageId} style={{ width: 280, maxWidth: "100%" }}>
                  <Image
                    src={item.imageUrl}
                    fallback={FALLBACK}
                    alt={item.imageCaption || `Room ${room.roomNumber}`}
                    width="100%"
                    height={180}
                    style={{ objectFit: "cover", borderRadius: 8 }}
                  />
                  <Typography.Text type="secondary">
                    {item.imageCaption || "Room photo"}{item.isCover ? " · Cover" : ""}
                  </Typography.Text>
                </div>
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No room photos yet." />
        )}
      </Card>

      <Card variant="outlined" title={<Space><HomeOutlined />Room information</Space>}>
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, lg: 3 }}
          styles={{ label: { fontWeight: 600 } }}
          items={[
            { key: "name", label: "Name", children: room.roomName || "—" },
            { key: "type", label: "Type", children: `${room.typeName} (${room.typeCode})` },
            { key: "capacity", label: "Capacity", children: `${room.capacity} guest(s)` },
            { key: "bed", label: "Bed", children: room.bedType },
            { key: "floor", label: "Floor", children: room.floor },
            { key: "zone", label: "Zone", children: room.locationZone || "—" },
            { key: "rate", label: "Current rate", children: room.currentPrice === null ? "—" : `${room.currentRateName} · ${formatMoney(room.currentPrice)} / night` },
            { key: "minimum", label: "Minimum stay", children: room.minNights === null ? "—" : `${room.minNights} night(s)` },
            { key: "description", label: "Description", children: room.description || "—", span: 3 },
          ]}
        />
      </Card>

      <Card variant="outlined" title="Amenities">
        {room.amenities.length ? (
          <Space wrap>{room.amenities.map((item) => <Tag key={item.amenityId}>{item.amenityName}{item.note ? ` · ${item.note}` : ""}</Tag>)}</Space>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No amenities assigned to this room type." />
        )}
      </Card>
    </Space>
  );
}
