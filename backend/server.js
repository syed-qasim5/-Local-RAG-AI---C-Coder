import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const PORT = process.env.PORT ?? 3001;
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in .env (project root).");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const CHUNK_SIZE = 1000;
const DATA_DIR = path.join(__dirname, "data");

/** Split text into non-overlapping chunks of at most `size` characters. */
function chunkText(text, size = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks.length ? chunks : [""];
}

/**
 * Cosine similarity for two equal-length numeric vectors.
 * Returns 0 if either vector has zero magnitude.
 */
function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function embeddingValues(result) {
  const emb = result?.embedding;
  if (Array.isArray(emb)) return emb;
  if (emb?.values && Array.isArray(emb.values)) return emb.values;
  return [];
}

async function embedText(text) {
  const res = await embeddingModel.embedContent(text);
  return embeddingValues(res);
}

/** In-memory store: { text, filePath, embedding } */
let chunkStore = [];

async function ingestCodebase() {
  chunkStore = [];
  let files;
  try {
    files = await fs.readdir(DATA_DIR);
  } catch (e) {
    console.warn("Could not read data directory:", DATA_DIR, e.message);
    return;
  }

  const codeFiles = files.filter((f) => f.endsWith(".cpp") || f.endsWith(".h"));
  for (const name of codeFiles) {
    const filePath = path.join(DATA_DIR, name);
    let content;
    try {
      content = await fs.readFile(filePath, "utf8");
    } catch (e) {
      console.warn("Skip file", name, e.message);
      continue;
    }
    const pieces = chunkText(content);
    for (let i = 0; i < pieces.length; i++) {
      const text = pieces[i];
      if (!text.trim()) continue;
      try {
        const embedding = await embedText(text);
        if (!embedding.length) {
          console.warn("Empty embedding for chunk", name, i);
          continue;
        }
        chunkStore.push({
          text,
          filePath: name,
          chunkIndex: i,
          embedding,
        });
      } catch (e) {
        console.error("Embedding failed for", name, "chunk", i, e.message);
      }
    }
  }
  console.log(`Ingested ${chunkStore.length} chunks from ${codeFiles.length} file(s).`);
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, chunks: chunkStore.length });
});

app.post("/api/chat", async (req, res) => {
  const message =
    typeof req.body?.message === "string"
      ? req.body.message.trim()
      : typeof req.body?.query === "string"
        ? req.body.query.trim()
        : "";

  if (!message) {
    return res.status(400).json({ error: "Missing message or query in JSON body." });
  }

  if (chunkStore.length === 0) {
    return res.status(503).json({
      error:
        "No code chunks loaded. Add .cpp or .h files under backend/data and restart the server.",
    });
  }

  try {
    const queryEmbedding = await embedText(message);
    if (!queryEmbedding.length) {
      return res.status(500).json({ error: "Failed to embed query." });
    }

    const scored = chunkStore.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    const top3 = scored.slice(0, 3).map((s) => s.chunk);

    const contextBlocks = top3.map(
      (c, idx) =>
        `--- Source: ${c.filePath} (chunk ${c.chunkIndex + 1}) ---\n${c.text}`,
    );
    const context = contextBlocks.join("\n\n");

    const systemInstruction = `You are an expert C++ reviewer and mentor. The user is asking about their own codebase. Use the following retrieved code snippets as primary context. If the answer is not in the snippets, say so clearly and give general C++ guidance only where appropriate. Be precise and cite which file/chunk you are referring to when useful.`;

    const prompt = `${systemInstruction}

Retrieved code context:
${context}

User question:
${message}`;

    const result = await chatModel.generateContent(prompt);
    const responseText = result.response.text();

    return res.json({
      reply: responseText,
      sources: top3.map((c) => ({
        file: c.filePath,
        chunkIndex: c.chunkIndex,
      })),
    });
  } catch (e) {
    console.error("/api/chat error:", e);
    return res.status(500).json({
      error: e.message || "Chat request failed.",
    });
  }
});

await ingestCodebase();

app.listen(PORT, () => {
  console.log(`Vector Brain API listening on http://localhost:${PORT}`);
});
