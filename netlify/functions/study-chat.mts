import OpenAI from "openai";
import { createRequire } from "node:module";
import type { Config } from "@netlify/functions";

const require = createRequire(import.meta.url);
const policy = require("./_shared/studyChatPolicy.cjs");

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function gatewayKeyPresent(): boolean {
  try {
    return Boolean(Netlify.env.get("OPENAI_API_KEY"));
  } catch (_) {
    return false;
  }
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: { "Cache-Control": "no-store" } });
  }
  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  let payload: { messages?: unknown } = {};
  try {
    payload = await req.json();
  } catch (_) {
    return json({ error: "JSON inválido" }, 400);
  }

  const built = policy.buildGatewayMessages(payload.messages);
  if (!built.messages.length || !built.userText) {
    return json({ error: "Escribe una pregunta de estudio." }, 400);
  }

  const localBody = {
    reply: policy.localReply(built.userText),
    source: "local" as const,
    prophecyAsk: built.prophecy,
    note: "IA Gateway inactiva o no respondió. Respuesta local de estudio (no es un hallazgo de la app).",
  };

  // Do not set OPENAI_API_KEY in the Netlify UI: that shadows the gateway.
  // gpt-4o-mini is on the curated AI Gateway list.
  if (!gatewayKeyPresent()) {
    return json(localBody);
  }

  try {
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 700,
      messages: [
        { role: "system", content: built.system },
        ...built.messages,
      ],
    });
    const reply =
      (completion.choices[0] &&
        completion.choices[0].message &&
        completion.choices[0].message.content) ||
      "";
    if (!reply.trim()) {
      return json(localBody);
    }
    return json({
      reply: reply.trim(),
      source: "gateway",
      prophecyAsk: built.prophecy,
    });
  } catch (err) {
    const msg =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : "error";
    return json({
      ...localBody,
      note:
        "El gateway no respondió (" +
        msg.slice(0, 120) +
        "). Uso la respuesta local de estudio.",
    });
  }
};

export const config: Config = {
  path: "/api/estudio-chat",
  method: ["POST", "OPTIONS"],
};
