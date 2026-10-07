#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Razorpay from "razorpay";
import crypto from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const KEY_ID = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

let razorpay = null;
if (KEY_ID && KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET,
  });
}

const server = new Server(
  {
    name: "razorpay-mcp-server",
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
        name: "razorpay_status",
        description: "Check status and connectivity of the Razorpay integration and API keys",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "razorpay_create_order",
        description: "Create a new Razorpay order for one-time checkout",
        inputSchema: {
          type: "object",
          properties: {
            amount_in_rupees: {
              type: "number",
              description: "The amount in INR (e.g. 799 or 1099)",
            },
            receipt: {
              type: "string",
              description: "Receipt identifier (e.g. receipt_order_123)",
            },
            notes: {
              type: "object",
              description: "Optional key-value metadata for the order",
            },
          },
          required: ["amount_in_rupees"],
        },
      },
      {
        name: "razorpay_fetch_order",
        description: "Fetch details of a Razorpay order by order ID",
        inputSchema: {
          type: "object",
          properties: {
            order_id: {
              type: "string",
              description: "The order ID (e.g. order_XXXXX)",
            },
          },
          required: ["order_id"],
        },
      },
      {
        name: "razorpay_list_orders",
        description: "List recent orders from Razorpay",
        inputSchema: {
          type: "object",
          properties: {
            count: {
              type: "number",
              description: "Number of orders to fetch (default: 10)",
            },
          },
        },
      },
      {
        name: "razorpay_fetch_payment",
        description: "Fetch details of a Razorpay payment by payment ID",
        inputSchema: {
          type: "object",
          properties: {
            payment_id: {
              type: "string",
              description: "The payment ID (e.g. pay_XXXXX)",
            },
          },
          required: ["payment_id"],
        },
      },
      {
        name: "razorpay_list_payments",
        description: "List recent payments received on Razorpay",
        inputSchema: {
          type: "object",
          properties: {
            count: {
              type: "number",
              description: "Number of payments to fetch (default: 10)",
            },
          },
        },
      },
      {
        name: "razorpay_create_payment_link",
        description: "Generate a shareable payment link via Razorpay",
        inputSchema: {
          type: "object",
          properties: {
            amount_in_rupees: {
              type: "number",
              description: "Amount in INR",
            },
            description: {
              type: "string",
              description: "Description of the payment",
            },
            customer_name: {
              type: "string",
              description: "Customer's name",
            },
            customer_email: {
              type: "string",
              description: "Customer's email",
            },
            customer_contact: {
              type: "string",
              description: "Customer's phone number",
            },
          },
          required: ["amount_in_rupees", "description"],
        },
      },
      {
        name: "razorpay_verify_signature",
        description: "Verify Razorpay payment HMAC SHA-256 signature for security",
        inputSchema: {
          type: "object",
          properties: {
            order_id: {
              type: "string",
              description: "The Razorpay order ID",
            },
            payment_id: {
              type: "string",
              description: "The Razorpay payment ID",
            },
            signature: {
              type: "string",
              description: "The Razorpay signature returned by checkout",
            },
          },
          required: ["order_id", "payment_id", "signature"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!KEY_ID || !KEY_SECRET || !razorpay) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: "Razorpay credentials not configured. Please set VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env",
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    switch (name) {
      case "razorpay_status": {
        const orders = await razorpay.orders.all({ count: 1 });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "connected",
                  mode: KEY_ID.startsWith("rzp_test_") ? "Test Mode" : "Live Mode",
                  key_id_prefix: KEY_ID.slice(0, 12) + "...",
                  connection_check: "success",
                  recent_orders_accessible: true,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "razorpay_create_order": {
        const amountInPaise = Math.round(Number(args.amount_in_rupees) * 100);
        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: args.receipt || `rcpt_${Date.now()}`,
          notes: args.notes || {},
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(order, null, 2),
            },
          ],
        };
      }

      case "razorpay_fetch_order": {
        const order = await razorpay.orders.fetch(args.order_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(order, null, 2),
            },
          ],
        };
      }

      case "razorpay_list_orders": {
        const count = args.count || 10;
        const orders = await razorpay.orders.all({ count });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(orders, null, 2),
            },
          ],
        };
      }

      case "razorpay_fetch_payment": {
        const payment = await razorpay.payments.fetch(args.payment_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payment, null, 2),
            },
          ],
        };
      }

      case "razorpay_list_payments": {
        const count = args.count || 10;
        const payments = await razorpay.payments.all({ count });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payments, null, 2),
            },
          ],
        };
      }

      case "razorpay_create_payment_link": {
        const amountInPaise = Math.round(Number(args.amount_in_rupees) * 100);
        const link = await razorpay.paymentLink.create({
          amount: amountInPaise,
          currency: "INR",
          description: args.description,
          customer: {
            name: args.customer_name || "Creator",
            email: args.customer_email || "creator@influencerdhundo.com",
            contact: args.customer_contact || "+919999999999",
          },
          notify: {
            sms: false,
            email: false,
          },
          reminder_enable: false,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(link, null, 2),
            },
          ],
        };
      }

      case "razorpay_verify_signature": {
        const body = args.order_id + "|" + args.payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", KEY_SECRET)
          .update(body.toString())
          .digest("hex");

        const isValid = expectedSignature === args.signature;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                is_valid: isValid,
                order_id: args.order_id,
                payment_id: args.payment_id,
              }),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: err.message || String(err),
            details: err.error || err,
          }),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal Razorpay MCP Server error:", err);
  process.exit(1);
});
