import { Hero } from "@/components/landing/hero";
import { getDisplayName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ActiveRoom = { id: string; name: string; status: "active" };

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <Hero />;

  const { data } = await supabase
    .from("players")
    .select("rooms(id, name, status)")
    .eq("user_id", user.id)
    .eq("rooms.status", "active")
    .limit(1);
  const activeRoom = ((data ?? []).flatMap((membership) => membership.rooms ? [membership.rooms as unknown as ActiveRoom] : []))[0];

  return <Hero activeRoom={activeRoom} user={{ email: user.email ?? "", name: getDisplayName(user.user_metadata, user.email) }} />;
}
