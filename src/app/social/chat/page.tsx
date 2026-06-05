import { Suspense } from "react";
import { ChatClient } from "./chat-client";
import { ClientRoleGate } from "@/components/auth/client-role-gate";

export default function ChatPage() {
  return (
    <ClientRoleGate requiredRole="CLIENTE">
      <Suspense
        fallback={
          <p className="p-8 text-center text-navy/60">Cargando mensajes...</p>
        }
      >
        <ChatClient />
      </Suspense>
    </ClientRoleGate>
  );
}
