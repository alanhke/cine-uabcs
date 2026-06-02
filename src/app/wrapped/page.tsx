export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWrappedData } from "@/app/actions/wrapped";
import { WrappedStory } from "@/components/wrapped/wrapped-story";

export default async function WrappedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CLIENTE") {
    redirect("/auth/login?callbackUrl=/wrapped");
  }

  const data = await getWrappedData();
  if (!data) {
    redirect("/auth/login?callbackUrl=/wrapped");
  }

  return (
    <main className="min-h-dvh bg-cream">
      <WrappedStory data={data} />
    </main>
  );
}
