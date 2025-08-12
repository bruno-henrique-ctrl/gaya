const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

interface ChatMessage {
    id: number;
    user: string;
    text: string;
    timestamp: string;
}

const messages: ChatMessage[] = [];

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

export default pool;

const JWT_SECRET = process.env.JWT_SECRET || "secret";

const authMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token não fornecido" });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: "Token inválido" });
    }
}

// Signup (cadastro)
app.post("/api/auth/signup", async (req, res) => {
    const { nome, email, senha, tipo } = req.body;

    if (!nome || !email || !senha || !tipo) {
        return res.status(400).json({ message: "Dados incompletos" });
    }

    try {
        const userExist = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email.toLowerCase()]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: "Usuário já existe" });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);

        const result = await pool.query(
            "INSERT INTO usuarios (nome, email, senha, tipo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, tipo",
            [nome, email.toLowerCase(), hashedPassword, tipo]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email, tipo: user.tipo }, JWT_SECRET, { expiresIn: "1d" });

        res.status(201).json({ user, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao cadastrar usuário" });
    }
});

// Login
app.post("/api/auth/login", async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) return res.status(400).json({ message: "Email e senha obrigatórios" });

    try {
        const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email.toLowerCase()]);
        if (result.rows.length === 0) return res.status(401).json({ message: "Credenciais inválidas" });

        const user = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) return res.status(401).json({ message: "Credenciais inválidas" });

        const token = jwt.sign({ id: user.id, email: user.email, tipo: user.tipo }, JWT_SECRET, { expiresIn: "1d" });

        res.json({ user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo }, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro no login" });
    }
});

// Listar usuários
app.get("/api/users", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, nome, email, tipo FROM usuarios");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar usuários" });
    }
});

// ---------------- DENUNCIAS ------------------

// Listar denúncias
app.get("/api/denuncias", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM denuncias ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar denúncias" });
    }
});

// Criar denúncia
app.post("/api/denuncias", authMiddleware, async (req: any, res) => {
    const { tipo, descricao, anonima } = req.body;
    const autorId = req.user.id;

    if (!descricao || !tipo) return res.status(400).json({ message: "Descrição e tipo são obrigatórios" });

    try {
        const result = await pool.query(
            `INSERT INTO denuncias (tipo, descricao, anonima, autor_id, data, status)
       VALUES ($1, $2, $3, $4, NOW(), 'Pendente') RETURNING *`,
            [tipo, descricao, anonima || false, autorId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao criar denúncia" });
    }
});

// Atualizar status denúncia para Resolvida
app.patch("/api/denuncias/:id/resolver", authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    try {
        const result = await pool.query("UPDATE denuncias SET status = 'Resolvida' WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Denúncia não encontrada" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao atualizar denúncia" });
    }
});

// Atualizar status denúncia para Em Investigação
app.patch("/api/denuncias/:id/investigar", authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    try {
        const result = await pool.query("UPDATE denuncias SET status = 'Em Investigação' WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Denúncia não encontrada" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao atualizar denúncia" });
    }
});

// ---------------- COLETAS ------------------

// Criar coleta
app.post("/api/collections", authMiddleware, async (req: any, res) => {
    const { tipo_material, quantidade, descricao, endereco } = req.body;
    const coletadorId = req.user.id;

    if (!tipo_material || !quantidade) return res.status(400).json({ message: "Tipo e quantidade são obrigatórios" });

    try {
        const result = await pool.query(
            `INSERT INTO collections (coletador_id, tipo_material, quantidade, status, data, descricao, endereco)
       VALUES ($1, $2, $3, 'pendente', NOW(), $4, $5) RETURNING *`,
            [coletadorId, tipo_material, quantidade, descricao || "", endereco || ""]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao criar coleta" });
    }
});

// Coletas pendentes/agendadas do coletador logado
app.get("/api/collections/my", authMiddleware, async (req: any, res) => {
    const coletadorId = req.user.id;
    try {
        const result = await pool.query(
            `SELECT * FROM collections
       WHERE coletador_id = $1 AND status IN ('pendente', 'agendada')
       ORDER BY data DESC`,
            [coletadorId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar coletas" });
    }
});

// Histórico do coletador (concluídas ou canceladas)
app.get("/api/collections/history", authMiddleware, async (req: any, res) => {
    const coletadorId = req.user.id;
    try {
        const result = await pool.query(
            `SELECT * FROM collections
       WHERE coletador_id = $1 AND status IN ('concluida', 'cancelada')
       ORDER BY data DESC`,
            [coletadorId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar histórico" });
    }
});

// Todas coletas atribuídas (admin vê todas, coletador só as dele)
app.get("/api/collections/assigned", authMiddleware, async (req: any, res) => {
    const user = req.user;
    try {
        if (user.tipo === "admin") {
            const result = await pool.query("SELECT * FROM collections ORDER BY data DESC");
            return res.json(result.rows);
        } else {
            const result = await pool.query("SELECT * FROM collections WHERE coletador_id = $1 ORDER BY data DESC", [user.id]);
            return res.json(result.rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar coletas" });
    }
});

// Coletas pendentes/agendadas para admin/coletador
app.get("/api/collections/pending", authMiddleware, async (req: any, res) => {
    const user = req.user;
    try {
        if (user.tipo === "admin") {
            const result = await pool.query(
                "SELECT * FROM collections WHERE status IN ('pendente', 'agendada') ORDER BY data DESC"
            );
            return res.json(result.rows);
        } else {
            const result = await pool.query(
                "SELECT * FROM collections WHERE coletador_id = $1 AND status IN ('pendente', 'agendada') ORDER BY data DESC",
                [user.id]
            );
            return res.json(result.rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar coletas" });
    }
});

// Cancelar coleta
app.patch("/api/collections/:id/cancel", authMiddleware, async (req: any, res) => {
    const id = Number(req.params.id);
    const userId = req.user.id;

    try {
        // Verifica se coleta pertence ao usuário
        const coleta = await pool.query("SELECT * FROM collections WHERE id = $1 AND coletador_id = $2", [id, userId]);
        if (coleta.rows.length === 0) return res.status(404).json({ message: "Coleta não encontrada" });

        const result = await pool.query("UPDATE collections SET status = 'cancelada' WHERE id = $1 RETURNING *", [id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao cancelar coleta" });
    }
});

// Remarcar coleta
app.patch("/api/collections/:id/reschedule", authMiddleware, async (req: any, res) => {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const { data } = req.body;

    if (!data) return res.status(400).json({ message: "Data é obrigatória" });

    try {
        // Verifica se coleta pertence ao usuário
        const coleta = await pool.query("SELECT * FROM collections WHERE id = $1 AND coletador_id = $2", [id, userId]);
        if (coleta.rows.length === 0) return res.status(404).json({ message: "Coleta não encontrada" });

        const result = await pool.query(
            "UPDATE collections SET data = $1, status = 'agendada' WHERE id = $2 RETURNING *",
            [data, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao remarcar coleta" });
    }
});

// ---------------- CHAT GLOBAL ----------------

// Histórico do chat global
app.get("/api/chat", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM chat ORDER BY timestamp ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar chat" });
    }
});

// Enviar mensagem chat global
app.post("/api/chat", authMiddleware, async (req: any, res) => {
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) return res.status(400).json({ message: "Mensagem é obrigatória" });

    try {
        // Buscar nome do usuário para salvar na mensagem
        const userResult = await pool.query("SELECT nome FROM usuarios WHERE id = $1", [userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: "Usuário não encontrado" });

        const userName = userResult.rows[0].nome;

        const result = await pool.query(
            "INSERT INTO chat (user_name, text, timestamp) VALUES ($1, $2, NOW()) RETURNING *",
            [userName, text]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
});

// ---------------- ESTATÍSTICAS ----------------

app.get("/api/environmental-data", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query("SELECT quantidade, status FROM collections WHERE status = 'concluida'");
        const materialReciclado = result.rows.reduce((acc: number, c: any) => acc + Number(c.quantidade), 0);

        const reducaoCO2 = materialReciclado * 0.3;
        const aguaEconomizada = materialReciclado * 1.5;

        res.json({
            materialReciclado,
            reducaoCO2: Math.round(reducaoCO2),
            aguaEconomizada: Math.round(aguaEconomizada),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao calcular dados ambientais" });
    }
});

app.get("/api/stats", authMiddleware, async (req, res) => {
    try {
        const usersResult = await pool.query("SELECT id, tipo FROM usuarios");
        const collectionsResult = await pool.query("SELECT coletador_id, status FROM collections");

        const totalUsuarios = usersResult.rows.length;
        const coletores = usersResult.rows.filter((u: any) => u.tipo === "coletador");

        const coletoresAtivos = coletores.filter((coletor: any) =>
            collectionsResult.rows.some(
                (c: any) =>
                    (c.status === "pendente" || c.status === "agendada") && c.coletador_id === coletor.id
            )
        ).length;

        const verificacoesPendentes = collectionsResult.rows.filter((c: any) => c.status === "pendente").length;

        res.json({ totalUsuarios, coletoresAtivos, verificacoesPendentes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
});

// socket.io

app.get("/chat", (_req, res) => {
    res.json(messages);
});

app.post("/chat", (req, res) => {
    const { user, text } = req.body;
    if (!user || !text) {
        return res.status(400).json({ message: "Usuário e texto são obrigatórios" });
    }
    const newMsg: ChatMessage = {
        id: Date.now(),
        user,
        text,
        timestamp: new Date().toISOString()
    };
    messages.push(newMsg);
    res.status(201).json(newMsg);
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

io.on("connection", (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);

    socket.on("chat_message", (msg: ChatMessage) => {
        messages.push(msg); // salva no histórico
        io.emit("chat_message", msg); // envia para todos
    });

    socket.on("disconnect", () => {
        console.log(`Usuário desconectado: ${socket.id}`);
    });
});

server.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
