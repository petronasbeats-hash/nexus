import { getStore } from "@netlify/blobs";

const ROOM = "nexus-zapien-noriega";

function docInactivo() {
  return {
    estado: "inactiva", // inactiva | llamando | aceptada | rechazada
    llamador: null,
    oferta: null,
    respuesta: null,
    candidatos: { Zapien: [], Noriega: [] },
    callId: null,
    ts: Date.now(),
  };
}

export default async (req) => {
  const store = getStore("nexus-chat");
  const key = `llamada:${ROOM}`;

  if (req.method === "GET") {
    const data = (await store.get(key, { type: "json" })) || docInactivo();
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

    const { accion, de } = body;
    if (de !== "Zapien" && de !== "Noriega") {
      return new Response(JSON.stringify({ error: "Nodo inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const current = (await store.get(key, { type: "json" })) || docInactivo();

    if (accion === "iniciar") {
      if (current.estado === "llamando" || current.estado === "aceptada") {
        return new Response(JSON.stringify({ error: "Ya hay una llamada en curso" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
      const next = {
        estado: "llamando",
        llamador: de,
        oferta: body.oferta,
        respuesta: null,
        candidatos: { Zapien: [], Noriega: [] },
        callId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
      };
      await store.setJSON(key, next);
      return new Response(JSON.stringify({ ok: true, callId: next.callId }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (accion === "aceptar") {
      if (current.estado !== "llamando" || current.callId !== body.callId) {
        return new Response(JSON.stringify({ error: "La llamada ya no está disponible" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
      current.estado = "aceptada";
      current.respuesta = body.respuesta;
      current.ts = Date.now();
      await store.setJSON(key, current);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (accion === "rechazar") {
      if (current.callId === body.callId) {
        current.estado = "rechazada";
        current.ts = Date.now();
        await store.setJSON(key, current);
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (accion === "candidato") {
      if (current.callId === body.callId && (current.estado === "llamando" || current.estado === "aceptada")) {
        current.candidatos[de] = current.candidatos[de] || [];
        current.candidatos[de].push(body.candidato);
        await store.setJSON(key, current);
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (accion === "terminar") {
      await store.setJSON(key, docInactivo());
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Acción inválida" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/call" };
                          
