import express, { Request, Response } from "express";
import cors from "cors";
import { createClient, RedisClientType } from "redis";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from the public folder
app.use(express.static("public"));

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Voting Result Service", version: "1.0.0" });
});

// Redis client
const redisUrl = process.env.REDIS_CONNECTION ?? "redis://localhost:6379";
const redisClient: RedisClientType = createClient({ url: redisUrl });

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis at", redisUrl);
    // Try to enable keyspace notifications for list events so we can listen for pushes.
    try {
      await redisClient.configSet("notify-keyspace-events", "KEA");
      console.log("Enabled Redis keyspace notifications (KEA)");
    } catch (err) {
      console.warn("Could not set Redis notify-keyspace-events (may require config):", err);
    }
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
})();

// API: GET /api/votes/counts -> { cat: number, dog: number }
app.get("/api/votes/counts", async (_req: Request, res: Response) => {
  try {
    const catRv = await redisClient.get("votes:count:cat");
    const dogRv = await redisClient.get("votes:count:dog");

    const cat = catRv ? parseInt(catRv, 10) : 0;
    const dog = dogRv ? parseInt(dogRv, 10) : 0;

    res.json({ cat, dog });
  } catch (err) {
    console.error("Error fetching vote counts:", err);
    res.status(500).json({ error: "Failed to read vote counts from Redis" });
  }
});

// Server-Sent Events (SSE) setup to notify web UI when counts change
const sseClients: Array<Response> = [];

app.get("/events", (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Send an initial comment to establish the stream
  res.write(`: connected\n\n`);

  sseClients.push(res);

  // When client disconnects, remove it
  req.on("close", () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

async function broadcastCounts() {
  try {
    const catRv = await redisClient.get("votes:count:cat");
    const dogRv = await redisClient.get("votes:count:dog");

    const cat = catRv ? parseInt(catRv, 10) : 0;
    const dog = dogRv ? parseInt(dogRv, 10) : 0;

    const payload = JSON.stringify({ cat, dog });

    for (const client of [...sseClients]) {
      try {
        client.write(`event: counts\ndata: ${payload}\n\n`);
      } catch (err) {
        // ignore write errors; cleanup will happen on close
      }
    }
  } catch (err) {
    console.error("Error broadcasting counts:", err);
  }
}

// Create a dedicated subscriber client to receive keyspace notifications
const subscriber = createClient({ url: redisUrl });

(async () => {
  try {
    await subscriber.connect();
    // Listen for keyspace events on the votes:ids list
    // Keyspace notifications publish events to channels like __keyspace@0__:votes:ids
    const pattern = "__keyspace@0__:votes:ids";

    // pSubscribe will invoke the callback when the keyspace channel receives messages
    // message will be the Redis command name (e.g., rpush, lpush)
    // Using a pattern subscription to be explicit
    // @ts-ignore - pSubscribe defined on RedisClientType but types can vary
    await subscriber.pSubscribe(pattern, (message: string, channel: string) => {
      // On push to the list, refresh counts for SSE clients
      if (message === "rpush" || message === "lpush") {
        broadcastCounts().catch((e) => console.error(e));
      }
    });

    console.log("Subscribed to Redis keyspace notifications on", pattern);
  } catch (err) {
    console.warn("Redis subscriber could not start (keyspace notifications may be disabled):", err);
    // Fallback: periodically poll counts and broadcast
    setInterval(broadcastCounts, 3000);
  }
})();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

export { app, redisClient };
export default app;
