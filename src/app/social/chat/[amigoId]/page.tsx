import { redirect } from "next/navigation";

export default async function ChatAmigoRedirectPage(
  props: {
    params: Promise<{ amigoId: string }>;
  }
) {
  const params = await props.params;
  redirect(`/social/chat?amigo=${params.amigoId}`);
}
