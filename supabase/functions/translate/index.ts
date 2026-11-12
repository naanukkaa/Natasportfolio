// supabase/functions/translate/index.ts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReqPayload {
  texts: string[];
  source: string;
  target: string;
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function splitText(text: string, maxBytes = 450): string[] {
  const parts = text.match(/\S+\s*|\s+/g) || [];
  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current + part;
    if (new TextEncoder().encode(candidate).length > maxBytes && current) {
      chunks.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(text: string, source: string, target: string): Promise<string> {
  const params = new URLSearchParams({
    q: text,
    langpair: `${source}|${target}`,
    mt: "1",
  });

  const response = await fetch(`https://api.mymemory.translated.net/get?${params}`);

  if (!response.ok) {
    throw new Error(`MyMemory HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error(data.responseDetails || "Translation unavailable");
  }

  return decodeHtml(data.responseData.translatedText);
}

async function translateText(text: string, source: string, target: string): Promise<string> {
  const chunks = splitText(text);
  const translated: string[] = [];

  for (const chunk of chunks) {
    translated.push(await translateChunk(chunk, source, target));
  }

  return translated.join("");
}

// Edge Function-ის მთავარი გამშვები
Deno.serve(async (req) => {
  // 1. CORS Preflight მოთხოვნის დამუშავება ბრაუზერისთვის
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // მხოლოდ POST მეთოდის დაშვება
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    const { texts, source, target }: ReqPayload = await req.json();

    if (
      !Array.isArray(texts) ||
      !source ||
      !target ||
      !["ka", "en"].includes(source) ||
      !["ka", "en"].includes(target)
    ) {
      throw new Error("Invalid request data");
    }

    if (source === target) {
       return new Response(JSON.stringify({ translations: texts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const translations: string[] = [];

    for (const text of texts) {
      if (typeof text !== "string") {
         throw new Error("Every text must be a string");
      }
      if (!text.trim()) {
        translations.push("");
        continue;
      }
      const result = await translateText(text, source, target);
      translations.push(result);
    }

    // წარმატებული პასუხის დაბრუნება
    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Translation error:", error);
    
    // შეცდომის დაბრუნება სწორი CORS ჰედერებით
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Translation failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});