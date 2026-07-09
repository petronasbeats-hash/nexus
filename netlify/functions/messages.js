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

    const current = (await store.get(key, { type: "json" })) || [];

    if (body?.accion === "reaccionar") {
      const { messageId, emoji, de } = body;
      if (!messageId || !emoji || !de) {
        return new Response(JSON.stringify({ error: "Faltan campos" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const next = current.map((m) => {
        if (m.id !== messageId) return m;
        const reacciones = m.reacciones || {};
        const lista = reacciones[emoji] || [];
        const yaReacciono = lista.includes(de);
        const nuevaLista = yaReacciono
          ? lista.filter((n) => n !== de)
          : [...lista, de];
        const nuevasReacciones = { ...reacciones, [emoji]: nuevaLista };
        if (nuevaLista.length === 0) delete nuevasReacciones[emoji];
        return { ...m, reacciones: nuevasReacciones };
      });
      await store.setJSON(key, next);
      return new Response(JSON.stringify(next), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      !body?.de ||
      (!body?.texto && !body?.sticker && !body?.imagen && !body?.audio)
    ) {
      return new Response(JSON.stringify({ error: "Faltan campos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mensaje = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      de: body.de,
      hora: Date.now(),
    };

    if (body.texto) {
      mensaje.texto = String(body.texto).slice(0, 4000);
    } else if (body.sticker) {
      mensaje.sticker = {
        packId: String(body.sticker.packId).slice(0, 60),
        index: Number(body.sticker.index) || 0,
      };
    } else if (body.imagen) {
      if (
        typeof body.imagen !== "string" ||
        !body.imagen.startsWith("data:image") ||
        body.imagen.length > 900000
      ) {
        return new Response(
          JSON.stringify({ error: "Imagen inválida o muy pesada" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      mensaje.imagen = body.imagen;
    } else if (body.audio) {
      if (
        typeof body.audio !== "string" ||
        !body.audio.startsWith("data:audio") ||
        body.audio.length > 1500000
      ) {
        return new Response(
          JSON.stringify({ error: "Audio inválido o muy pesado" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      mensaje.audio = body.audio;
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
