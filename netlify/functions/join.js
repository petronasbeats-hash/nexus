import { getStore } from "@netlify/blobs";

const ROOM = "nexus-zapien-noriega";
const MAX_PARTICIPANTES = 2;

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Método no permitido", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const nombreQueBuscas = body?.nombreQueBuscas;
  if (nombreQueBuscas !== "Zapien" && nombreQueBuscas !== "Noriega") {
    return new Response(JSON.stringify({ error: "Nodo inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const miNombre = nombreQueBuscas === "Zapien" ? "Noriega" : "Zapien";

  const store = getStore("nexus-chat");
  const key = `participantes:${ROOM}`;
  const participantes = (await store.get(key, { type: "json" })) || [];
  const yaEsta = participantes.includes(miNombre);

  if (!yaEsta && participantes.length >= MAX_PARTICIPANTES) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Este Nexus ya conecta a dos personas y no tiene lugar para alguien más.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!yaEsta) {
    await store.setJSON(key, [...participantes, miNombre]);
  }

  return new Response(JSON.stringify({ ok: true, miNombre }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/join" };
