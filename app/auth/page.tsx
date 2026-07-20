import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSafeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type AuthPageProps = {
  searchParams: Promise<{ email?: string | string[]; error?: string | string[]; next?: string | string[] }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const query = await searchParams;
  const nextPath = getSafeNextPath(typeof query.next === "string" ? query.next : undefined, "/onboarding");
  const initialEmail = typeof query.email === "string" ? query.email : "";
  const initialError = query.error === "expired_link"
    ? "That sign-in link has expired. Request a new one below."
    : query.error === "missing_code"
      ? "That sign-in link is incomplete. Request a new one below."
      : "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect(nextPath);

  return <AuthForm initialEmail={initialEmail} initialError={initialError} nextPath={nextPath} />;
}
