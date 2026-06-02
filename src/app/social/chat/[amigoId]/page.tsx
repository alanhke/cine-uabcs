import { redirect } from "next/navigation";

export default function ChatAmigoRedirectPage({
  params,
}: {
  params: { amigoId: string };
}) {
  redirect(`/social/chat?amigo=${params.amigoId}`);
}
