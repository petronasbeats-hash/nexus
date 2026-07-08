import { getStore } from "@netlify/blobs";

const ROOM = "nexus-zapien-noriega";

export default async (req) => {
  const store = getStore("nexus-chat");
  const key = `sala:${ROOM}`;

  if (req.method === "GET") {
    const data = (await store.get(key, { type: "json" })) || [];
    return new Response(JSON.stringify(data), {
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

    if (!body?.texto || !body?.de) {
      return new Response(JSON.stringify({ error: "Faltan campos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const current = (await store.get(key, { type: "json" })) || [];
    const mensaje = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      de: body.de,
      texto: String(body.texto).slice(0, 4000),
      hora: Date.now(),
    };
    const next = [...current, mensaje];
    await store.setJSON(key, next);

    return new Response(JSON.stringify(next), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/messages" };
