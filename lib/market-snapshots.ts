import { createAdminClient } from "@/lib/supabase/admin";

type SnapshotInput = {
  change24h: number | null;
  price: number | null;
  symbol: string;
};

export async function persistMarketSnapshots(assets: SnapshotInput[]) {
  const admin = createAdminClient();
  if (!admin) return;

  const validAssets = assets.filter((asset) => asset.price !== null && Number.isFinite(asset.price));
  if (validAssets.length === 0) return;

  const cutoff = new Date(Date.now() - 55_000).toISOString();
  const { data: recentSnapshots } = await admin
    .from("price_snapshots")
    .select("asset_symbol")
    .in("asset_symbol", validAssets.map((asset) => asset.symbol))
    .gte("captured_at", cutoff);
  const recentlyCaptured = new Set((recentSnapshots ?? []).map((snapshot) => snapshot.asset_symbol));
  const rows = validAssets
    .filter((asset) => !recentlyCaptured.has(asset.symbol))
    .map((asset) => ({ asset_symbol: asset.symbol, change_24h: asset.change24h, price_usd: asset.price }));

  if (rows.length > 0) await admin.from("price_snapshots").insert(rows);
}
