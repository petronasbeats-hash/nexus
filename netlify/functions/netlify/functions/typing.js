import { getStore } from "@netlify/blobs";

const ROOM = "nexus-zapien-noriega";

export default async (req) => {
  const store = getStore("nexus-chat");
  const key = `typing:${ROOM}`;

  if (req.method === "GET") {
    const data = await store.get(key, { type: "json" });
    // Solo se considera "escribiendo" si fue hace menos de 4 segundos
    if (data && Date.now() - data.ts < 4000) {
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(null), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "JSON inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!body?.de) {
      return new Response(JSON.stringify({ error: "Falta 'de'" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    await store.setJSON(key, { de: body.de, ts: Date.now() });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/typing" };
