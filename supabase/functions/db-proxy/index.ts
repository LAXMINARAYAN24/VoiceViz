import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConnParams {
  action: "test" | "schema" | "query";
  db_type: "postgresql" | "mysql";
  host: string;
  port: number;
  db_name: string;
  username: string;
  password: string;
  sql?: string;
}

// Ensure BigInt is always serializable
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};


function validateInput(params: ConnParams): string | null {
  if (!["test", "schema", "query"].includes(params.action)) return "Invalid action";
  if (!["postgresql", "mysql"].includes(params.db_type)) return "Invalid db_type";
  if (!params.host || params.host.length > 255) return "Invalid host";
  if (!params.port || params.port < 1 || params.port > 65535) return "Invalid port";
  if (!params.db_name || params.db_name.length > 255) return "Invalid db_name";
  if (!params.username || params.username.length > 255) return "Invalid username";
  if (!params.password) return "Password required";
  return null;
}

async function connectPostgres(params: ConnParams) {
  // Dynamic import for Deno postgres
  const { Client } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
  const client = new Client({
    hostname: params.host,
    port: params.port,
    database: params.db_name,
    user: params.username,
    password: params.password,
    tls: { enabled: false },
    connection: { attempts: 1 },
  });
  await client.connect();
  return client;
}

async function testPostgres(params: ConnParams) {
  const client = await connectPostgres(params);
  try {
    await client.queryArray("SELECT 1");
    return { success: true };
  } finally {
    await client.end();
  }
}

async function schemaPostgres(params: ConnParams) {
  const client = await connectPostgres(params);
  try {
    const tables = await client.queryObject<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
       ORDER BY table_name`
    );
    const schema = [];
    for (const tbl of tables.rows) {
      const cols = await client.queryObject<{
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = $1 
         ORDER BY ordinal_position`,
        [tbl.table_name]
      );
      schema.push({ table_name: tbl.table_name, columns: cols.rows });
    }
    return { success: true, schema };
  } finally {
    await client.end();
  }
}

async function queryPostgres(params: ConnParams) {
  if (!params.sql) throw new Error("SQL query required");
  // Basic safety: only allow SELECT
  const trimmed = params.sql.trim().toUpperCase();
  if (!trimmed.startsWith("SELECT")) {
    throw new Error("Only SELECT queries are allowed");
  }
  const client = await connectPostgres(params);
  try {
    const result = await client.queryObject(params.sql);
    return { success: true, rows: result.rows, rowCount: result.rows.length };
  } finally {
    await client.end();
  }
}

// MySQL support via deno mysql driver
async function connectMysql(params: ConnParams) {
  const { Client } = await import("https://deno.land/x/mysql@v2.12.1/mod.ts");
  const client = await new Client().connect({
    hostname: params.host,
    port: params.port,
    db: params.db_name,
    username: params.username,
    password: params.password,
  });
  return client;
}

async function testMysql(params: ConnParams) {
  const client = await connectMysql(params);
  try {
    await client.query("SELECT 1");
    return { success: true };
  } finally {
    await client.close();
  }
}

async function schemaMysql(params: ConnParams) {
  const client = await connectMysql(params);
  try {
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = ? AND table_type = 'BASE TABLE' 
       ORDER BY table_name`,
      [params.db_name]
    );
    const schema = [];
    for (const tbl of tables) {
      const cols = await client.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_schema = ? AND table_name = ? 
         ORDER BY ordinal_position`,
        [params.db_name, tbl.table_name]
      );
      schema.push({ table_name: tbl.table_name, columns: cols });
    }
    return { success: true, schema };
  } finally {
    await client.close();
  }
}

async function queryMysql(params: ConnParams) {
  if (!params.sql) throw new Error("SQL query required");
  const trimmed = params.sql.trim().toUpperCase();
  if (!trimmed.startsWith("SELECT")) {
    throw new Error("Only SELECT queries are allowed");
  }
  const client = await connectMysql(params);
  try {
    const rows = await client.query(params.sql);
    return { success: true, rows, rowCount: rows.length };
  } finally {
    await client.close();
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase configuration");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const params: ConnParams = await req.json();
    const validationError = validateInput(params);
    if (validationError) {
      return new Response(JSON.stringify({ success: false, error: validationError }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;
    if (params.db_type === "postgresql") {
      if (params.action === "test") result = await testPostgres(params);
      else if (params.action === "schema") result = await schemaPostgres(params);
      else if (params.action === "query") result = await queryPostgres(params);
    } else {
      if (params.action === "test") result = await testMysql(params);
      else if (params.action === "schema") result = await schemaMysql(params);
      else if (params.action === "query") result = await queryMysql(params);
    }

    const body = JSON.stringify(result, (_key, value) =>
      typeof value === "bigint" ? Number(value) : value
    );
    return new Response(body, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("db-proxy error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
