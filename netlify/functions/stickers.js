import { getStore } from "@netlify/blobs";

const KEY = "sticker-packs";

export default async (req) => {
  const store = getStore("nexus-chat");

  if (req.method === "GET") {
    const packs = (await store.get(KEY, { type: "json" })) || [];
    return new Response(JSON.stringify(packs), {
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

    const nombre = String(body?.nombre || "Mi paquete").slice(0, 40);
    const stickers = Array.isArray(body?.stickers) ? body.stickers.slice(0, 30) : [];

    // Cada sticker debe ser una imagen en base64 (dataURL) y no muy pesada,
    // para que la biblioteca no crezca sin control.
    const limpios = stickers.filter(
      (s) => typeof s === "string" && s.startsWith("data:image") && s.length < 400000
    );

    if (!limpios.length) {
      return new Response(
        JSON.stringify({ error: "No se recibieron stickers válidos." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const packs = (await store.get(KEY, { type: "json" })) || [];
    const nuevo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nombre,
      stickers: limpios,
    };
    const next = [...packs, nuevo];
    await store.setJSON(KEY, next);

    return new Response(JSON.stringify(next), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/stickers" };
