import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDisplayName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type DashboardPageProps = {
  searchParams: Promise<{ room?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const query = await searchParams;
  const roomId = typeof query.room === "string" ? query.room : "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/rooms");
  if (!roomId) redirect("/rooms");

  const { data: membership } = await supabase.from("players").select("id").eq("room_id", roomId).eq("user_id", user.id).maybeSingle();
  if (!membership) redirect("/rooms");

  const { data: room } = await supabase.from("rooms").select("name, status, invite_code").eq("id", roomId).maybeSingle();
  if (!room) redirect("/rooms");
  if (room.status !== "active") redirect("/rooms/" + room.invite_code);

  return <DashboardShell roomName={room.name} user={{ name: getDisplayName(user.user_metadata, user.email), email: user.email ?? "" }} />;
}
