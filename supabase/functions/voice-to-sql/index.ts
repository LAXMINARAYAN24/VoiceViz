import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { transcript, schema } = await req.json();
    if (!transcript || !schema) {
      return new Response(
        JSON.stringify({ error: "transcript and schema are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const schemaText = schema
      .map((t: any) => {
        const cols = t.columns
          .map((c: any) => `  ${c.column_name} (${c.data_type}${c.is_nullable === "YES" ? ", nullable" : ""})`)
          .join("\n");
        return `TABLE: ${t.table_name}\n${cols}`;
      })
      .join("\n\n");

    const systemPrompt = `You are a SQL expert. Given a database schema and a natural language question, generate a single SELECT query that answers the question.

Rules:
- ONLY generate SELECT statements. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, or any other mutating statement.
- Use the exact table and column names from the schema.
- If the question is ambiguous, make reasonable assumptions and explain them.
- If the question cannot be answered with the given schema, explain why.

DATABASE SCHEMA:
${schemaText}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_sql",
              description: "Return the generated SQL query and a plain-English explanation",
              parameters: {
                type: "object",
                properties: {
                  sql: {
                    type: "string",
                    description: "The SQL SELECT query that answers the user's question",
                  },
                  explanation: {
                    type: "string",
                    description: "A brief plain-English explanation of what this query does",
                  },
                },
                required: ["sql", "explanation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_sql" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      // Fallback: try to extract from content
      const content = data.choices?.[0]?.message?.content || "";
      return new Response(
        JSON.stringify({ sql: content, explanation: "AI returned unstructured response" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ sql: args.sql, explanation: args.explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("voice-to-sql error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
