export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWrappedData } from "@/app/actions/wrapped";
import { WrappedStory } from "@/components/wrapped/wrapped-story";
import { getLoginRedirect, getProtectedRouteRedirect } from "@/lib/access-control";

export default async function WrappedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(getLoginRedirect("/wrapped"));
  }
  if (session.user.role !== "CLIENTE") {
    redirect(getProtectedRouteRedirect("/wrapped", "ADMINISTRADOR") ?? "/");
  }

  const data = await getWrappedData();
  if (!data) {
    redirect("/");
  }

  return (
    <main className="min-h-dvh bg-cream">
      <WrappedStory data={data} />
    </main>
  );
}
