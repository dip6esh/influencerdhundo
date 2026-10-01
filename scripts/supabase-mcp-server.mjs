#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://ixfcoilswyagwifaronh.supabase.co";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4ZmNvaWxzd3lhZ3dpZmFyb25oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDgzOTA5NSwiZXhwIjoyMTA2NDE1MDk1fQ.W8MofXjLgVJ15yXzDP_Cn7Y-lxBSl7RLPFgcuGhArbI";
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || "";
const DATABASE_URL = process.env.DATABASE_URL || "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const server = new Server(
  {
    name: "supabase-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "supabase_status",
        description: "Check the status and connectivity of the connected Supabase project",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "supabase_execute_sql",
        description: "Execute SQL statements (e.g. CREATE TABLE, ALTER TABLE, SELECT, INSERT) against Supabase database",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "The SQL statement to execute",
            },
          },
          required: ["sql"],
        },
      },
      {
        name: "supabase_table_select",
        description: "Query records from any table in Supabase",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Table name (e.g. creators, reports)" },
            select: { type: "string", description: "Columns to select (default: '*')" },
            limit: { type: "number", description: "Limit number of rows (default: 50)" },
            filterColumn: { type: "string", description: "Optional column name to filter by" },
            filterValue: { type: "string", description: "Optional column value to filter by" },
          },
          required: ["table"],
        },
      },
      {
        name: "supabase_table_insert",
        description: "Insert one or more records into a Supabase table",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Table name" },
            records: {
              type: "array",
              items: { type: "object" },
              description: "Array of records to insert",
            },
          },
          required: ["table", "records"],
        },
      },
      {
        name: "supabase_table_update",
        description: "Update records in a Supabase table matching a specific column filter",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Table name" },
            values: { type: "object", description: "Key-value pairs to update" },
            matchColumn: { type: "string", description: "Column name to match (e.g. id)" },
            matchValue: { type: "string", description: "Column value to match" },
          },
          required: ["table", "values", "matchColumn", "matchValue"],
        },
      },
      {
        name: "supabase_table_delete",
        description: "Delete records from a Supabase table matching a specific column filter",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Table name" },
            matchColumn: { type: "string", description: "Column name to match (e.g. id)" },
            matchValue: { type: "string", description: "Column value to match" },
          },
          required: ["table", "matchColumn", "matchValue"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "supabase_status") {
      const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");
      let tableInfo = "Unknown";
      try {
        const { data, error } = await supabase.from("creators").select("id").limit(1);
        if (error) {
          tableInfo = `Error: ${error.message}`;
        } else {
          tableInfo = "Connected (creators table found)";
        }
      } catch (e) {
        tableInfo = e.message;
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                projectUrl: SUPABASE_URL,
                projectRef,
                tableStatus: tableInfo,
                hasDatabaseUrl: Boolean(DATABASE_URL),
                hasAccessToken: Boolean(SUPABASE_ACCESS_TOKEN),
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    if (name === "supabase_execute_sql") {
      const sql = args?.sql;
      if (!sql) {
        return { isError: true, content: [{ type: "text", text: "Missing sql parameter" }] };
      }

      // If DATABASE_URL is set, connect directly using pg
      if (DATABASE_URL) {
        const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
        try {
          const res = await pool.query(sql);
          await pool.end();
          return {
            content: [{ type: "text", text: JSON.stringify({ rowCount: res.rowCount, rows: res.rows }, null, 2) }],
          };
        } catch (e) {
          await pool.end();
          return { isError: true, content: [{ type: "text", text: `Postgres Error: ${e.message}` }] };
        }
      }

      // If SUPABASE_ACCESS_TOKEN is set, use Supabase Management API
      if (SUPABASE_ACCESS_TOKEN) {
        const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");
        const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({ query: sql }),
        });
        const json = await res.json();
        return {
          content: [{ type: "text", text: JSON.stringify(json, null, 2) }],
        };
      }

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Executing raw DDL / SQL requires either DATABASE_URL (PostgreSQL connection string with DB password) or SUPABASE_ACCESS_TOKEN (from Supabase Dashboard > Account > Access Tokens) in .env. Table data operations (select, insert, update, delete) are fully enabled with your Service Role Key.",
          },
        ],
      };
    }

    if (name === "supabase_table_select") {
      const table = args.table;
      const select = args.select || "*";
      const limit = args.limit || 50;
      let query = supabase.from(table).select(select).limit(limit);

      if (args.filterColumn && args.filterValue !== undefined) {
        query = query.eq(args.filterColumn, args.filterValue);
      }

      const { data, error } = await query;
      if (error) {
        return { isError: true, content: [{ type: "text", text: `Supabase Error: ${error.message}` }] };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "supabase_table_insert") {
      const { table, records } = args;
      const { data, error } = await supabase.from(table).insert(records).select();
      if (error) {
        return { isError: true, content: [{ type: "text", text: `Supabase Error: ${error.message}` }] };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ inserted: data }, null, 2) }],
      };
    }

    if (name === "supabase_table_update") {
      const { table, values, matchColumn, matchValue } = args;
      const { data, error } = await supabase
        .from(table)
        .update(values)
        .eq(matchColumn, matchValue)
        .select();
      if (error) {
        return { isError: true, content: [{ type: "text", text: `Supabase Error: ${error.message}` }] };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ updated: data }, null, 2) }],
      };
    }

    if (name === "supabase_table_delete") {
      const { table, matchColumn, matchValue } = args;
      const { data, error } = await supabase
        .from(table)
        .delete()
        .eq(matchColumn, matchValue)
        .select();
      if (error) {
        return { isError: true, content: [{ type: "text", text: `Supabase Error: ${error.message}` }] };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ deleted: data }, null, 2) }],
      };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
    };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text", text: `Internal error: ${err.message}` }],
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((err) => {
  console.error("Fatal error in Supabase MCP server:", err);
  process.exit(1);
});
