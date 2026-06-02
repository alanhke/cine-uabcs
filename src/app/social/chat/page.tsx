import { Suspense } from "react";
import { ChatClient } from "./chat-client";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-center text-navy/60">Cargando mensajes...</p>
      }
    >
      <ChatClient />
    </Suspense>
  );
}
