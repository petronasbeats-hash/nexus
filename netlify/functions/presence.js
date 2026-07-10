import { getStore } from "@netlify/blobs";

const ROOM = "nexus-zapien-noriega";
const ONLINE_TTL_MS = 8000; // si no manda "heartbeat" en 8s, se considera desconectado

export default async (req) => {
  const store = getStore("nexus-chat");
  const key = `presence:${ROOM}`;

  if (req.method === "GET") {
    const data = (await store.get(key, { type: "json" })) || {};
    const now = Date.now();
    const estado = {};
    for (const nombre of ["Zapien", "Noriega"]) {
      const info = data[nombre];
      estado[nombre] = {
        online: !!info && now - info.ts < ONLINE_TTL_MS,
        lastSeen: info ? info.ts : null,
        readUpTo: info ? info.readUpTo || 0 : 0,
      };
    }
    return new Response(JSON.stringify(estado), {
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
    if (body?.de !== "Zapien" && body?.de !== "Noriega") {
      return new Response(JSON.stringify({ error: "Nodo inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = (await store.get(key, { type: "json" })) || {};
    const prev = data[body.de] || {};
    data[body.de] = {
      ts: Date.now(),
      readUpTo: body.readUpTo ? Math.max(body.readUpTo, prev.readUpTo || 0) : prev.readUpTo || 0,
    };
    await store.setJSON(key, data);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/presence" };
