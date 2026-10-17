"use client";

import { useMemo, useState } from "react";
import { useApiData } from "@/app/lib/use-api-data";
import { fetchCustomers, fetchMemberTiers } from "./customer.api";

/** Customer list + member tiers + client-side search / tier filter. */
export function useCustomerData() {
  const { data, loading, error, reload } = useApiData(fetchCustomers, "customers");
  const tiers = useApiData(fetchMemberTiers, "member-tiers");
  const [search, setSearch] = useState("");
  const [tierId, setTierId] = useState<number | undefined>();

  const customers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (c) =>
        (tierId === undefined || c.tierId === tierId) &&
        (!q ||
          [`${c.firstName} ${c.lastName}`, c.email, c.phone, c.idCardNo].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [data, search, tierId]);

  return {
    customers,
    total: data?.length ?? 0,
    tiers: tiers.data ?? [],
    tiersLoading: tiers.loading,
    loading,
    error: error ?? tiers.error,
    reload,
    search,
    setSearch,
    tierId,
    setTierId,
  };
}
