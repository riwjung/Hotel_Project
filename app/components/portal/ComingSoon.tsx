"use client";

import { Card, Empty, Space, Tag, Typography } from "antd";

type Props = {
  label: string;
  moduleLabel: string;
  note?: string;
  tables: string[];
};

/** Placeholder for menu items whose status is "planned" in app/lib/nav.ts. */
export default function ComingSoon({ label, moduleLabel, note, tables }: Props) {
  return (
    <Card variant="outlined" title={label} extra={<Tag>{moduleLabel}</Tag>}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Space orientation="vertical" size={4}>
            <Typography.Text>This screen is planned but not built yet.</Typography.Text>
            <Typography.Text type="secondary">
              The database side is ready. Tables:{" "}
              {tables.map((t) => (
                <Typography.Text key={t} code>
                  {t}
                </Typography.Text>
              ))}
            </Typography.Text>
            {note && (
              <Typography.Text type="secondary">
                Backlog: <Typography.Text code>docs/{note}</Typography.Text>
              </Typography.Text>
            )}
          </Space>
        }
      />
    </Card>
  );
}
