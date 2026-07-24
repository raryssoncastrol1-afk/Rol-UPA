import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables. Configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // API Route for Spreadsheet AI Reader / Assistant
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, transactions, additionalContext } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "O campo 'messages' é obrigatório e deve ser um array." });
      }

      const client = getGeminiClient();

      // Format spreadsheet data compactly for context
      let dataContext = "";
      if (transactions && Array.isArray(transactions)) {
        const fileInfo = additionalContext?.selectedFile ? `Arquivo Selecionado: ${additionalContext.selectedFile}` : "Todos os arquivos / Geral";
        const totalInc = additionalContext?.totalIncome !== undefined ? `R$ ${additionalContext.totalIncome.toFixed(2)}` : "N/A";
        const totalExp = additionalContext?.totalExpense !== undefined ? `R$ ${additionalContext.totalExpense.toFixed(2)}` : "N/A";
        const bal = additionalContext?.balance !== undefined ? `R$ ${additionalContext.balance.toFixed(2)}` : "N/A";
        const periodStr = additionalContext?.periodName ? `Período: ${additionalContext.periodName}` : "Geral";

        // Map transactions to a super clean string representation
        const txsSummary = transactions.slice(0, 500).map((tx, idx) => {
          const dateStr = tx.date ? new Date(tx.date).toLocaleDateString('pt-BR') : 'Sem data';
          const typeStr = tx.type === 'income' ? 'RECEITA (+)' : 'DESPESA (-)';
          return `${idx + 1}. Data: ${dateStr} | Desc: ${tx.description} | Cat: ${tx.category || 'Geral'} | Tipo: ${typeStr} | Valor: R$ ${tx.amount.toFixed(2)} | Origem: ${tx.sheetName || 'Manual'}`;
        }).join('\n');

        dataContext = `
=== CONTEXTO FINANCEIRO DA PLANILHA ===
${fileInfo}
${periodStr}
Receitas Totais no período: ${totalInc}
Despesas Totais no período: ${totalExp}
Saldo Atual do Caixa: ${bal}
Total de lançamentos no contexto: ${transactions.length} ${transactions.length > 500 ? '(mostrando os primeiros 500)' : ''}

LISTA DE LANÇAMENTOS FINANCEIROS:
${txsSummary || 'Nenhum lançamento no filtro ou período atual.'}
======================================
`;
      }

      // System instruction for the accounting co-pilot
      const systemInstruction = `Você é o Co-Piloto Contábil da UPH (União de Presbiterianos Homens).
Seu objetivo é ler, interpretar e analisar de forma precisa planilhas de finanças, relatórios, dízimos, ofertas, despesas e fluxos de caixa.
Responda sempre em português brasileiro de forma profissional, atenciosa, didática e clara.

Utilize formatação rica em Markdown:
- Use negritos (**destaque**) para números, saldos, porcentagens, e termos importantes.
- Use listas numeradas ou com marcadores para organizar dados de forma escaneável.
- Apresente tabelas comparativas simples de despesas ou receitas se for útil.
- Crie um resumo executivo rápido se o usuário pedir visão geral.

Ajude o usuário a identificar anomalias, calcular totais de categorias, encontrar os maiores gastos, identificar tendências de arrecadação, sugerir otimizações de orçamento e tirar qualquer dúvida matemática sobre a planilha fornecida.
Diga que as consultas e análises rodam localmente com a inteligência leve e de alta velocidade do Gemini 3.5 Flash, garantindo 100% de privacidade para as finanças da igreja.
`;

      // Map roles correctly: @google/genai requires 'model' instead of 'assistant'
      const contents = messages.map((msg: any) => {
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        };
      });

      // Insert spreadsheet context to help Gemini answer accurately
      if (dataContext) {
        // We prepend the data context as the very first information
        contents.unshift({
          role: "user",
          parts: [{ text: `Abaixo estão os dados financeiros oficiais tirados de nossas planilhas para guiar suas respostas:\n${dataContext}` }]
        });
        
        // Help tie it together
        contents.push({
          role: "user",
          parts: [{ text: `Analise as planilhas fornecidas acima para responder à pergunta: "${messages[messages.length - 1].content}".` }]
        });
      }

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.1, // low temperature for extreme factual accuracy, math calculations, and consistency
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Erro no chat IA:", error);
      res.status(500).json({ error: error.message || "Erro interno do servidor ao processar chat com IA." });
    }
  });

  // Serve static assets and manage fallback in development or production
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
