"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type RoomActionState = { error?: string };

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createRoom(_previousState: RoomActionState, formData: FormData): Promise<RoomActionState> {
  const name = getFormString(formData, "name");
  const durationDays = Number(getFormString(formData, "durationDays"));
  if (name.length < 3 || name.length > 48) return { error: "Room names must be between 3 and 48 characters." };
  if (![5, 7, 14].includes(durationDays)) return { error: "Choose a 5, 7, or 14 day challenge." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has ended. Please sign in again." };

  const { data, error } = await supabase.rpc("create_room", { p_name: name, p_duration_days: durationDays });
  if (error || !data) return { error: error?.message ?? "We could not create your room." };

  revalidatePath("/rooms");
  redirect("/rooms/" + data.invite_code);
}

export async function joinRoom(_previousState: RoomActionState, formData: FormData): Promise<RoomActionState> {
  const inviteCode = getFormString(formData, "inviteCode").toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(inviteCode)) return { error: "Enter the 8-character invite code." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has ended. Please sign in again." };

  const { data, error } = await supabase.rpc("join_room", { p_invite_code: inviteCode });
  if (error || !data) return { error: error?.message ?? "We could not join that room." };

  revalidatePath("/rooms");
  redirect("/rooms/" + data.invite_code);
}

export async function startRoom(roomId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/rooms");

  const { data, error } = await supabase.rpc("start_room", { p_room_id: roomId });
  if (error || !data) redirect("/rooms?error=" + encodeURIComponent(error?.message ?? "We could not start this room."));

  revalidatePath("/rooms");
  redirect("/dashboard?room=" + data.id);
}
