import { getStore } from "@netlify/blobs";

// Clave fija de la sala: no es editable desde el frontend, así que este
// backend solo sirve una única conversación.
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

    if (!body?.de || (!body?.texto && !body?.sticker)) {
      return new Response(JSON.stringify({ error: "Faltan campos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const current = (await store.get(key, { type: "json" })) || [];
    const mensaje = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      de: body.de,
      hora: Date.now(),
    };
    if (body.texto) {
      mensaje.texto = String(body.texto).slice(0, 4000);
    } else {
      mensaje.sticker = {
        packId: String(body.sticker.packId).slice(0, 60),
        index: Number(body.sticker.index) || 0,
      };
    }
    const next = [...current, mensaje];
    await store.setJSON(key, next);

    return new Response(JSON.stringify(next), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/messages" };
