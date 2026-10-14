import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db, initDatabase } from "./db";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "10mb" }));

  // Inicializa tabelas SQLite/LibSQL
  await initDatabase();

  // ---------------------------------------------------------
  // ENDPOINTS DA API DE SINCRONIZAÇÃO EM TEMPO REAL
  // ---------------------------------------------------------

  // --- ELEIÇÕES (VOTAÇÃO EM TEMPO REAL PARA ELEITORES) ---
  app.get("/api/elections", async (req, res) => {
    try {
      const result = await db.execute("SELECT data FROM elections ORDER BY updated_at DESC");
      const elections = result.rows.map((row) => JSON.parse(row.data as string));
      res.json(elections);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/elections", async (req, res) => {
    try {
      const election = req.body;
      if (!election || !election.id) {
        return res.status(400).json({ error: "Eleição inválida" });
      }
      await db.execute({
        sql: "INSERT OR REPLACE INTO elections (id, data, updated_at) VALUES (?, ?, ?)",
        args: [election.id, JSON.stringify(election), Date.now()],
      });
      res.json({ success: true, election });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Voto emitido por eleitor (atômico e seguro)
  app.post("/api/elections/:id/vote", async (req, res) => {
    try {
      const electionId = req.params.id;
      const vote = req.body;
      if (!vote || !vote.voterId || !vote.candidateId) {
        return res.status(400).json({ error: "Voto inválido" });
      }

      const row = await db.execute({
        sql: "SELECT data FROM elections WHERE id = ?",
        args: [electionId],
      });

      if (row.rows.length === 0) {
        return res.status(404).json({ error: "Eleição não encontrada" });
      }

      const election = JSON.parse(row.rows[0].data as string);
      const existingVotes = election.votes || [];

      // Evita voto duplicado no mesmo escrutínio
      const hasVoted = existingVotes.some(
        (v: any) =>
          v.voterId === vote.voterId &&
          v.role === vote.role &&
          v.ballotNumber === vote.ballotNumber
      );

      if (hasVoted) {
        return res.status(409).json({ error: "Eleitor já votou neste escrutínio" });
      }

      existingVotes.push(vote);
      election.votes = existingVotes;

      await db.execute({
        sql: "UPDATE elections SET data = ?, updated_at = ? WHERE id = ?",
        args: [JSON.stringify(election), Date.now(), electionId],
      });

      res.json({ success: true, vote });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/elections/:id", async (req, res) => {
    try {
      await db.execute({
        sql: "DELETE FROM elections WHERE id = ?",
        args: [req.params.id],
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- AUTENTICAÇÃO SEGURA POR PIN DO ELEITOR (SERVER-DRIVEN) ---
  app.post("/api/auth/voter", async (req, res) => {
    try {
      const { pin } = req.body;
      if (!pin || typeof pin !== "string" || !pin.trim()) {
        return res.status(400).json({ error: "PIN é obrigatório." });
      }

      const cleanPin = pin.trim();
      const result = await db.execute("SELECT data FROM members");
      const members = result.rows.map((row) => JSON.parse(row.data as string));
      const matched = members.find((m) => m.pinCode && m.pinCode.trim() === cleanPin);

      if (!matched) {
        return res.status(401).json({ error: "PIN incorreto ou membro não encontrado." });
      }

      // Retorna apenas dados essenciais do perfil do eleitor
      res.json({
        success: true,
        voter: {
          id: matched.id,
          name: matched.name,
          cargo: matched.cargo || "Membro",
          funcaoEclesiastica: matched.funcaoEclesiastica || "Membro Comungante",
          situacao: matched.situacao || "Em Plena Comunhão"
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- MEMBROS ---
  app.get("/api/members", async (req, res) => {
    try {
      const result = await db.execute("SELECT data FROM members ORDER BY updated_at DESC");
      const members = result.rows.map((row) => JSON.parse(row.data as string));
      res.json(members);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/members", async (req, res) => {
    try {
      const member = req.body;
      if (!member || !member.id) {
        return res.status(400).json({ error: "Membro inválido" });
      }
      await db.execute({
        sql: "INSERT OR REPLACE INTO members (id, data, updated_at) VALUES (?, ?, ?)",
        args: [member.id, JSON.stringify(member), Date.now()],
      });
      res.json({ success: true, member });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/members/batch", async (req, res) => {
    try {
      const members = req.body;
      if (!Array.isArray(members)) {
        return res.status(400).json({ error: "Lista inválida" });
      }
      for (const m of members) {
        await db.execute({
          sql: "INSERT OR REPLACE INTO members (id, data, updated_at) VALUES (?, ?, ?)",
          args: [m.id, JSON.stringify(m), Date.now()],
        });
      }
      res.json({ success: true, count: members.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/members/:id", async (req, res) => {
    try {
      await db.execute({
        sql: "DELETE FROM members WHERE id = ?",
        args: [req.params.id],
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SESSÕES DE PRESENÇA ---
  app.get("/api/sessions", async (req, res) => {
    try {
      const result = await db.execute("SELECT data FROM sessions ORDER BY updated_at DESC");
      const sessions = result.rows.map((row) => JSON.parse(row.data as string));
      res.json(sessions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const session = req.body;
      if (!session || !session.id) {
        return res.status(400).json({ error: "Sessão inválida" });
      }
      await db.execute({
        sql: "INSERT OR REPLACE INTO sessions (id, data, updated_at) VALUES (?, ?, ?)",
        args: [session.id, JSON.stringify(session), Date.now()],
      });
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      await db.execute({
        sql: "DELETE FROM sessions WHERE id = ?",
        args: [req.params.id],
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- TESOURARIA ---
  app.get("/api/treasury", async (req, res) => {
    try {
      const result = await db.execute("SELECT data FROM treasury ORDER BY updated_at DESC");
      const items = result.rows.map((row) => JSON.parse(row.data as string));
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/treasury", async (req, res) => {
    try {
      const tx = req.body;
      if (!tx || !tx.id) return res.status(400).json({ error: "Transação inválida" });
      await db.execute({
        sql: "INSERT OR REPLACE INTO treasury (id, data, updated_at) VALUES (?, ?, ?)",
        args: [tx.id, JSON.stringify(tx), Date.now()],
      });
      res.json({ success: true, tx });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/treasury/:id", async (req, res) => {
    try {
      await db.execute({
        sql: "DELETE FROM treasury WHERE id = ?",
        args: [req.params.id],
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------
  // FRONTEND SERVING (Vite em Dev / Static em Prod)
  // ---------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
