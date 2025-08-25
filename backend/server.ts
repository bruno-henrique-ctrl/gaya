import { Pool } from "pg";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Application, Request, Response, NextFunction } from "express";

declare module "express-serve-static-core" {
    interface Request {
        user?: MyJwtPayload;
    }
}

interface MyJwtPayload extends JwtPayload {
    id: number;
    email: string;
    tipo: string;
}

module.exports = (app: Application) => {
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
    });

    const JWT_SECRET = process.env.JWT_SECRET || "secret";

    const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return res.status(401).json({ message: "Token não fornecido" });

        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;
            req.user = decoded;
            next();
        } catch (err: unknown) {
            return res.status(401).json({ message: "Token inválido" });
        }
    };

    // Signup (cadastro)
    app.post("/api/auth/signup", async (req: Request, res: Response) => {
        const { nome, email, senha, tipo } = req.body;

        if (!nome || !email || !senha || !tipo) {
            return res.status(400).json({ message: "Dados incompletos" });
        }

        try {
            const userExist = await pool.query(
                "SELECT id FROM usuarios WHERE email = $1",
                [email.toLowerCase()]
            );
            if (userExist.rows.length > 0) {
                return res.status(400).json({ message: "Usuário já existe" });
            }

            const hashedPassword = await bcrypt.hash(senha, 10);

            const result = await pool.query(
                "INSERT INTO usuarios (nome, email, senha, tipo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, tipo",
                [nome, email.toLowerCase(), hashedPassword, tipo]
            );

            const user = result.rows[0];
            const token = jwt.sign(
                { id: user.id, email: user.email, tipo: user.tipo },
                JWT_SECRET,
                { expiresIn: "1d" }
            );

            res.status(201).json({ user, token });
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao cadastrar usuário" });
        }
    });

    // Login
    app.post("/api/auth/login", async (req: Request, res: Response) => {
        const { email, senha } = req.body;

        if (!email || !senha)
            return res.status(400).json({ message: "Email e senha obrigatórios" });

        try {
            const result = await pool.query(
                "SELECT * FROM usuarios WHERE email = $1",
                [email.toLowerCase()]
            );
            if (result.rows.length === 0)
                return res.status(401).json({ message: "Credenciais inválidas" });

            const user = result.rows[0];
            const senhaValida = await bcrypt.compare(senha, user.senha);
            if (!senhaValida)
                return res.status(401).json({ message: "Credenciais inválidas" });

            const token = jwt.sign(
                { id: user.id, email: user.email, tipo: user.tipo },
                JWT_SECRET,
                { expiresIn: "1d" }
            );

            res.json({
                user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo },
                token,
            });
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro no login" });
        }
    });

    // Listar usuários
    app.get("/api/users", authMiddleware, async (_req: Request, res: Response) => {
        try {
            const result = await pool.query("SELECT id, nome, email, tipo FROM usuarios");
            res.json(result.rows);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao buscar usuários" });
        }
    });

    // ---------------- DENUNCIAS ------------------

    // Listar denúncias
    app.get("/api/denuncias", authMiddleware, async (_req: Request, res: Response) => {
        try {
            const result = await pool.query("SELECT * FROM denuncias ORDER BY id DESC");
            res.json(result.rows);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao buscar denúncias" });
        }
    });

    // Criar denúncia
    app.post("/api/denuncias", authMiddleware, async (req: Request, res: Response) => {
        const { tipo, descricao, anonima } = req.body;
        const autorId = req.user?.id;
        if (!autorId) return res.status(401).json({ message: "Usuário não autorizado" });

        if (!descricao || !tipo)
            return res.status(400).json({ message: "Descrição e tipo são obrigatórios" });

        try {
            const result = await pool.query(
                `INSERT INTO denuncias (tipo, descricao, anonima, autor_id, data, status)
         VALUES ($1, $2, $3, $4, NOW(), 'Pendente') RETURNING *`,
                [tipo, descricao, anonima || false, autorId]
            );
            res.status(201).json(result.rows[0]);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao criar denúncia" });
        }
    });

    // Atualizar status denúncia para Resolvida
    app.patch("/api/denuncias/:id/resolver", authMiddleware, async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        try {
            const result = await pool.query(
                "UPDATE denuncias SET status = 'Resolvida' WHERE id = $1 RETURNING *",
                [id]
            );
            if (result.rows.length === 0)
                return res.status(404).json({ message: "Denúncia não encontrada" });
            res.json(result.rows[0]);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao atualizar denúncia" });
        }
    });

    // Atualizar status denúncia para Em Investigação
    app.patch("/api/denuncias/:id/investigar", authMiddleware, async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        try {
            const result = await pool.query(
                "UPDATE denuncias SET status = 'Em Investigação' WHERE id = $1 RETURNING *",
                [id]
            );
            if (result.rows.length === 0)
                return res.status(404).json({ message: "Denúncia não encontrada" });
            res.json(result.rows[0]);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao atualizar denúncia" });
        }
    });

    // ---------------- COLETAS ------------------

    // Criar coleta
    app.post("/api/collections", authMiddleware, async (req: Request, res: Response) => {
        const { itens, endereco } = req.body;
        const coletadorId = req.user?.id;

        if (!coletadorId) return res.status(401).json({ message: "Usuário não autorizado" });
        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ message: "É necessário informar pelo menos um item" });
        }

        // Validação básica dos itens
        for (const item of itens) {
            if (!item.tipo_material || !item.quantidade) {
                return res.status(400).json({ message: "Todos os itens devem ter tipo_material e quantidade" });
            }
            if (isNaN(Number(item.quantidade))) {
                return res.status(400).json({ message: "Quantidade deve ser um número válido" });
            }
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Criar a coleta
            const enderecoJson = JSON.stringify(endereco || {});
            const collectionResult = await client.query(
                `INSERT INTO collections (coletador_id, endereco, status, data) 
             VALUES ($1, $2, 'pendente', NOW()) RETURNING *`,
                [coletadorId, enderecoJson]
            );

            const collectionId = collectionResult.rows[0].id;

            // Inserir os itens
            const insertedItems: any[] = [];
            for (const item of itens) {
                const itemResult = await client.query(
                    `INSERT INTO collection_items (collection_id, tipo_material, quantidade, descricao)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                    [collectionId, item.tipo_material, Number(item.quantidade), item.descricao || ""]
                );
                insertedItems.push(itemResult.rows[0]);
            }

            await client.query("COMMIT");

            res.status(201).json({ collection: collectionResult.rows[0], itens: insertedItems });
        } catch (err) {
            await client.query("ROLLBACK");
            console.error(err);
            res.status(500).json({ message: "Erro ao criar coleta" });
        } finally {
            client.release();
        }
    });


    // Coletas pendentes/agendadas do coletador logado
    app.get("/api/collections/my", authMiddleware, async (req: Request, res: Response) => {
        const coletadorId = req.user?.id;
        if (!coletadorId) return res.status(401).json({ message: "Usuário não autorizado" });

        try {
            const result = await pool.query(
                `SELECT 
                c.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', ci.id,
                            'tipo_material', ci.tipo_material,
                            'quantidade', ci.quantidade,
                            'descricao', ci.descricao
                        )
                    ) FILTER (WHERE ci.id IS NOT NULL), '[]'
                ) AS itens
             FROM collections c
             LEFT JOIN collection_items ci ON ci.collection_id = c.id
             WHERE c.coletador_id = $1 AND c.status IN ('pendente', 'agendada')
             GROUP BY c.id
             ORDER BY c.data DESC`,
                [coletadorId]
            );

            res.json(result.rows);
        } catch (err: unknown) {
            console.error(err);
            res.status(500).json({ message: "Erro ao buscar coletas" });
        }
    });

    // Histórico do coletador (concluídas ou canceladas)
    app.get("/api/collections/history", authMiddleware, async (req: Request, res: Response) => {
        const coletadorId = req.user?.id;
        if (!coletadorId) return res.status(401).json({ message: "Usuário não autorizado" });

        try {
            const result = await pool.query(
                `SELECT * FROM collections WHERE coletador_id = $1 AND status IN ('concluida', 'cancelada') ORDER BY data DESC`,
                [coletadorId]
            );
            res.json(result.rows);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao buscar histórico" });
        }
    });

    // Todas coletas atribuídas (admin vê todas, coletador só as dele)
    app.get("/api/collections/assigned", authMiddleware, async (req: Request, res: Response) => {
        const user = req.user;
        if (!user) return res.status(401).json({ message: "Usuário não autorizado" });

        try {
            if (user.tipo === "admin") {
                const result = await pool.query("SELECT * FROM collections ORDER BY data DESC");
                return res.json(result.rows);
            } else {
                const result = await pool.query(
                    "SELECT * FROM collections WHERE coletador_id = $1 ORDER BY data DESC",
                    [user.id]
                );
                return res.json(result.rows);
            }
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao buscar coletas" });
        }
    });

    // Coletas pendentes/agendadas para admin/coletador
    app.get("/api/collections/pending", authMiddleware, async (req: Request, res: Response) => {
        const user = req.user;
        if (!user) return res.status(401).json({ message: "Usuário não autorizado" });

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
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao buscar coletas" });
        }
    });

    // Cancelar coleta
    app.patch("/api/collections/:id/cancel", authMiddleware, async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Usuário não autorizado" });

        try {
            // Verifica se coleta pertence ao usuário
            const coleta = await pool.query("SELECT * FROM collections WHERE id = $1 AND coletador_id = $2", [
                id,
                userId,
            ]);
            if (coleta.rows.length === 0)
                return res.status(404).json({ message: "Coleta não encontrada" });

            const result = await pool.query("UPDATE collections SET status = 'cancelada' WHERE id = $1 RETURNING *", [
                id,
            ]);
            res.json(result.rows[0]);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao cancelar coleta" });
        }
    });

    // Remarcar coleta
    app.patch("/api/collections/:id/reschedule", authMiddleware, async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Usuário não autorizado" });
        const { data } = req.body;

        if (!data) return res.status(400).json({ message: "Data é obrigatória" });

        try {
            // Verifica se coleta pertence ao usuário
            const coleta = await pool.query("SELECT * FROM collections WHERE id = $1 AND coletador_id = $2", [
                id,
                userId,
            ]);
            if (coleta.rows.length === 0)
                return res.status(404).json({ message: "Coleta não encontrada" });

            const result = await pool.query(
                "UPDATE collections SET data = $1, status = 'agendada' WHERE id = $2 RETURNING *",
                [data, id]
            );
            res.json(result.rows[0]);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao remarcar coleta" });
        }
    });

    // Concluir coleta
    app.patch("/api/collections/:id/complete", authMiddleware, async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Usuário não autorizado" });

        try {
            const coleta = await pool.query("SELECT * FROM collections WHERE id = $1", [id]);
            if (coleta.rows.length === 0) return res.status(404).json({ message: "Coleta não encontrada" });

            if (req.user?.tipo !== "admin" && coleta.rows[0].coletador_id !== userId)
                return res.status(403).json({ message: "Acesso negado" });

            const result = await pool.query(
                "UPDATE collections SET status = 'concluida' WHERE id = $1 RETURNING *",
                [id]
            );
            res.json(result.rows[0]);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao concluir coleta" });
        }
    });


    // ---------------- CHAT GLOBAL ----------------

    // Histórico do chat global
    app.get("/api/chat", authMiddleware, async (_req: Request, res: Response) => {
        try {
            const result = await pool.query("SELECT * FROM chat ORDER BY timestamp ASC");
            res.json(result.rows);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao buscar chat" });
        }
    });

    // Enviar mensagem chat global
    app.post("/api/chat", authMiddleware, async (req: Request, res: Response) => {
        const { text } = req.body;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Usuário não autorizado" });

        if (!text) return res.status(400).json({ message: "Mensagem é obrigatória" });

        try {
            // Buscar nome do usuário para salvar na mensagem
            const userResult = await pool.query("SELECT nome FROM usuarios WHERE id = $1", [userId]);
            if (userResult.rows.length === 0)
                return res.status(404).json({ message: "Usuário não encontrado" });

            const userName = userResult.rows[0].nome;

            const result = await pool.query(
                "INSERT INTO chat (user_name, text, timestamp) VALUES ($1, $2, NOW()) RETURNING *",
                [userName, text]
            );
            res.status(201).json(result.rows[0]);
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao enviar mensagem" });
        }
    });

    // ---------------- ESTATÍSTICAS ----------------
    app.get("/api/environmental-data", authMiddleware, async (_req: Request, res: Response) => {
        try {
            const result = await pool.query(`
            SELECT ci.quantidade
            FROM collections c
            JOIN collection_items ci ON ci.collection_id = c.id
            WHERE c.status = 'concluida'
        `);

            const materialReciclado = result.rows.reduce(
                (acc: number, c: any) => acc + Number(c.quantidade),
                0
            );

            const reducaoCO2 = materialReciclado * 0.3;
            const aguaEconomizada = materialReciclado * 1.5;

            res.json({
                materialReciclado,
                reducaoCO2: Math.round(reducaoCO2),
                aguaEconomizada: Math.round(aguaEconomizada),
            });
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao calcular dados ambientais" });
        }
    });

    app.get("/api/stats", authMiddleware, async (_req: Request, res: Response) => {
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
            );

            const totalDenunciasResult = await pool.query("SELECT COUNT(*) FROM denuncias");
            const totalDenuncias = Number(totalDenunciasResult.rows[0].count);

            res.json({
                totalUsuarios,
                coletoresAtivos: coletoresAtivos.length,
                totalDenuncias,
            });
        } catch (err: unknown) {
            if (err instanceof Error) console.error(err.message);
            else console.error(err);
            res.status(500).json({ message: "Erro ao buscar estatísticas" });
        }
    });

    // ---------------- Wallet ----------------

    app.post("/verify-signature", async (req: Request, res: Response) => {
        const { address, message, signature } = req.body;
        if (!address || !message || !signature) {
            return res.status(400).json({ message: "Dados incompletos" });
        }
        try {
            const { ethers } = await import("ethers");
            const recoveredAddress = ethers.verifyMessage(message, signature);
            if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
                res.json({ verified: true });
            } else {
                res.status(401).json({ verified: false, message: "Assinatura inválida" });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Erro ao verificar assinatura" });
        }
    });

    app.post("/backup-keystore", async (req: Request, res: Response) => {
        const { address, keystore_json } = req.body;
        if (!address || !keystore_json) {
            return res.status(400).json({ message: "Dados incompletos" });
        }
        try {
            await pool.query(
                `INSERT INTO keystores (address, keystore_json) VALUES ($1, $2)
             ON CONFLICT (address) DO UPDATE SET keystore_json = EXCLUDED.keystore_json`,
                [address, keystore_json]
            );
            res.json({ message: "Backup salvo com sucesso" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Erro ao salvar backup" });
        }
    });

};
