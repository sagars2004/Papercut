"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { durationToMinutes, normalizeInviteCode, type DurationUnit } from "@/lib/rooms";

export type RoomActionState = { error?: string };

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createRoom(_previousState: RoomActionState, formData: FormData): Promise<RoomActionState> {
  const name = getFormString(formData, "name");
  const durationValue = Number(getFormString(formData, "durationValue"));
  const durationUnit = getFormString(formData, "durationUnit") as DurationUnit;
  const durationMinutes = durationToMinutes(durationValue, durationUnit);
  if (name.length < 3 || name.length > 48) return { error: "Room names must be between 3 and 48 characters." };
  if (!Number.isFinite(durationValue) || !["minutes", "hours", "days"].includes(durationUnit) || durationMinutes < 1 || durationMinutes > 43200) return { error: "Choose a duration between 1 minute and 30 days." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has ended. Please sign in again." };

  const { data, error } = await supabase.rpc("create_room", { p_name: name, p_duration_minutes: durationMinutes });
  if (error || !data) return { error: error?.message ?? "We could not create your room." };

  revalidatePath("/rooms");
  redirect("/rooms/" + data.invite_code);
}

export async function joinRoom(_previousState: RoomActionState, formData: FormData): Promise<RoomActionState> {
  const inviteCode = normalizeInviteCode(getFormString(formData, "inviteCode"));
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

export async function closeRoom(roomId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/rooms");

  const { error } = await supabase.rpc("close_room", { p_room_id: roomId });
  if (error) redirect("/rooms?error=" + encodeURIComponent(error.message));

  revalidatePath("/rooms");
  redirect("/rooms?notice=room_closed");
}
