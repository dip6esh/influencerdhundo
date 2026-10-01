import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env if available
const envPath = path.resolve(__dirname, "../.env");
let env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      env[k] = v;
    }
  }
}

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  env.VITE_SUPABASE_URL ||
  "https://ixfcoilswyagwifaronh.supabase.co";

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4ZmNvaWxzd3lhZ3dpZmFyb25oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDgzOTA5NSwiZXhwIjoyMTA2NDE1MDk1fQ.W8MofXjLgVJ15yXzDP_Cn7Y-lxBSl7RLPFgcuGhArbI";

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "status";

  console.log(`[Supabase Admin] Target: ${SUPABASE_URL}`);
  console.log(`[Supabase Admin] Command: ${command}`);

  if (command === "status") {
    const { data, error } = await supabaseAdmin.from("creators").select("id, name, city").limit(5);
    if (error) {
      console.log(`⚠️ Status check error: ${error.message} (Code: ${error.code})`);
      if (error.code === "PGRST205") {
        console.log(`ℹ️ Tables have not been initialized in Supabase SQL editor yet.`);
        console.log(`ℹ️ Please run the SQL schema in supabase/schema.sql in your Supabase SQL Editor.`);
      }
    } else {
      console.log(`✅ Supabase connection healthy! Found ${data.length} sample creators.`);
      console.log(data);
    }
  } else if (command === "list") {
    const { data, error } = await supabaseAdmin.from("creators").select("*");
    if (error) {
      console.error("Error fetching creators:", error);
    } else {
      console.log(`Creators count: ${data.length}`);
      console.table(data.map((c) => ({ id: c.id, name: c.name, city: c.city, followers: c.followers, status: c.status })));
    }
  } else {
    console.log(`Unknown command: ${command}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
