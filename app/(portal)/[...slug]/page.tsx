import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComingSoon from "@/app/components/portal/ComingSoon";
import RequirePermission from "@/app/components/portal/RequirePermission";
import { NAV_ITEMS, findNavItem } from "@/app/lib/nav";

// Serves every menu item marked status: "planned" in app/lib/nav.ts.
// When a screen is built, give it its own folder under app/(portal)/ and flip
// its status to "ready" — the specific route then wins over this catch-all.

const planned = NAV_ITEMS.filter((item) => item.status === "planned");

const lookup = (slug: string[]) => {
  const item = findNavItem(`/${slug.join("/")}`);
  return item && item.status === "planned" && item.path === `/${slug.join("/")}` ? item : undefined;
};

export function generateStaticParams() {
  return planned.map((item) => ({ slug: item.path.slice(1).split("/") }));
}

export async function generateMetadata({ params }: PageProps<"/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: lookup(slug)?.label ?? "Not found" };
}

export default async function Page({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const item = lookup(slug);
  if (!item) notFound();

  return (
    <RequirePermission permission={item.permission}>
      <ComingSoon label={item.label} moduleLabel={item.group.label} note={item.group.note} tables={item.tables} />
    </RequirePermission>
  );
}
