import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSafeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type AuthPageProps = {
  searchParams: Promise<{ back?: string | string[]; email?: string | string[]; error?: string | string[]; next?: string | string[] }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const query = await searchParams;
  const nextPath = getSafeNextPath(typeof query.next === "string" ? query.next : undefined, "/rooms");
  const backPath = getSafeNextPath(typeof query.back === "string" ? query.back : undefined, "/");
  const initialEmail = typeof query.email === "string" ? query.email : "";
  const initialError = query.error === "expired_link"
    ? "That sign-in link has expired. Request a new one below."
    : query.error === "missing_code"
      ? "That sign-in link is incomplete. Request a new one below."
      : "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const requestedEmail = initialEmail.trim().toLowerCase();
  const activeEmail = user?.email?.trim().toLowerCase() ?? "";

  if (user && (!requestedEmail || requestedEmail === activeEmail)) redirect(nextPath);

  return <AuthForm activeEmail={user?.email ?? ""} backPath={backPath} initialEmail={initialEmail} initialError={initialError} nextPath={nextPath} />;
}
