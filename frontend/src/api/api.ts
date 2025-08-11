// import axios from "axios";
// import AxiosMockAdapter from "axios-mock-adapter";

// export type DenunciaTipo = "Má Conduta" | "Outro";

// export interface Denuncia {
//     id: number;
//     data: string;
//     descricao: string;
//     status: string;
//     tipo?: DenunciaTipo;
//     anonima?: boolean;
// }

// export interface EnviarDenunciaRequest {
//     tipo: DenunciaTipo;
//     descricao: string;
//     anonima: boolean;
// }


// const api = axios.create({ baseURL: "/api" });

// api.interceptors.request.use(config => {
//     const token = localStorage.getItem("token");
//     if (token && config.headers) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });

// if (import.meta.env.MODE === "development") {
//     const mock = new AxiosMockAdapter(api, { delayResponse: 500 });

//     // Usuários para login
//     const users: Record<string, {
//         senha: string;
//         user: { id: number; nome: string; email: string; tipo: string };
//     }> = {
//         "admin@ex.com": {
//             senha: "admin",
//             user: { id: 1, nome: "Admin", email: "admin@ex.com", tipo: "admin" },
//         },
//         "coletador@ex.com": { 
//             senha: "coletador",
//             user: { id: 4, nome: "Coletador Exemplo 2", email: "coletador2@ex.com", tipo: "coletador" },
//         },
//     };

//     // Mock login
//     mock.onPost("/auth/login").reply((config) => {
//         const { email, senha } = JSON.parse(config.data);
//         const found = users[email.toLowerCase()];

//         if (found && found.senha === senha) {
//             return [200, { user: found.user, token: "fake-token-" + found.user.id }];
//         } else {
//             return [401, { message: "Credenciais inválidas" }];
//         }
//     });

//     // Mock de cadastro
//     mock.onPost("/auth/signup").reply((config) => {
//         const { nome, email, tipo, senha } = JSON.parse(config.data);

//         if (users[email.toLowerCase()]) {
//             return [400, { message: "Usuário já existe com este e-mail" }];
//         }

//         const id = Object.keys(users).length + 1;
//         const novoUsuario = { id, nome, email, tipo };

//         users[email.toLowerCase()] = { senha, user: novoUsuario };

//         return [201, { message: "Usuário cadastrado com sucesso", user: novoUsuario }];
//     });

//     // Lista usuários
//     mock.onGet("/users").reply(200, Object.values(users).map(u => u.user));

//     // Coletas mockadas
//     // Coletas mockadas (dados fixos da imagem)
//     const collections = [
//         {
//             id: 1,
//             coletadorId: 4,
//             tipo_material: "Recicláveis",
//             quantidade: 10,
//             status: "pendente",
//             data: "2023-06-14T14:00:00",
//             descricao: "",
//             endereco: "Rua das Flores, 123"
//         },
//         {
//             id: 2,
//             coletadorId: 4,
//             tipo_material: "Plástico",
//             quantidade: 5,
//             status: "agendada", // vai aparecer como "Remarcado" no front se mapearmos o texto
//             data: "2023-06-09T09:30:00",
//             descricao: "",
//             endereco: "Av. Principal, 456"
//         },
//         {
//             id: 3,
//             coletadorId: 4,
//             tipo_material: "Papel",
//             quantidade: 8,
//             status: "concluida", // vai aparecer como "Realizado" no front se mapearmos o texto
//             data: "2023-06-04T11:00:00",
//             descricao: "",
//             endereco: "Rua do Comércio, 789"
//         }
//     ];


//     // Criar coleta
//     mock.onPost("/collections").reply((config) => {
//         const token = config.headers?.Authorization || "";
//         const userId = Number(token.replace("Bearer fake-token-", ""));
//         const body = JSON.parse(config.data);

//         const novaColeta = {
//             id: collections.length + 1,
//             coletadorId: userId || 4,
//             tipo_material: body.tipo_material,
//             quantidade: body.quantidade,
//             status: "pendente",
//             data: new Date().toISOString(),
//             descricao: body.descricao || "",
//             endereco: body.endereco || "",
//         };

//         collections.push(novaColeta);
//         return [201, novaColeta];
//     });

//     // Coletas do coletador logado (pendentes/agendadas)
//     mock.onGet("/collections/my").reply((config) => {
//         const token = config.headers?.Authorization || "";
//         const userId = Number(token.replace("Bearer fake-token-", ""));
//         if (!userId) return [401, { message: "Token inválido" }];

//         const filtered = collections.filter(
//             (c) => (c.status === "pendente" || c.status === "agendada") && c.coletadorId === userId
//         );
//         return [200, filtered];
//     });

//     // Histórico do coletador logado
//     mock.onGet("/collections/history").reply((config) => {
//         const token = config.headers?.Authorization || "";
//         const userId = Number(token.replace("Bearer fake-token-", ""));
//         if (!userId) return [401, { message: "Token inválido" }];

//         const filtered = collections.filter(
//             (c) => (c.status === "concluida" || c.status === "cancelada") && c.coletadorId === userId
//         );
//         return [200, filtered];
//     });

//     // Todas coletas atribuídas
//     mock.onGet("/collections/assigned").reply((config) => {
//         const token = config.headers?.Authorization || "";
//         const userId = Number(token.replace("Bearer fake-token-", ""));
//         const user = Object.values(users).find(u => u.user.id === userId)?.user;

//         if (!user) return [401, { message: "Usuário não encontrado" }];

//         if (user.tipo === "admin") {
//             return [200, collections];
//         } else {
//             return [200, collections.filter(c => c.coletadorId === userId)];
//         }
//     });

//     // Coletas pendentes/agendadas para admin/coletador
//     mock.onGet("/collections/pending").reply((config) => {
//         const token = config.headers?.Authorization || "";
//         const userId = Number(token.replace("Bearer fake-token-", ""));
//         const user = Object.values(users).find(u => u.user.id === userId)?.user;

//         if (!user) return [401, { message: "Usuário não encontrado" }];

//         if (user.tipo === "admin") {
//             return [200, collections.filter(c => c.status === "pendente" || c.status === "agendada")];
//         } else {
//             return [200, collections.filter(c => (c.status === "pendente" || c.status === "agendada") && c.coletadorId === userId)];
//         }
//     });

//     // No mock do api.ts
//     mock.onPatch(/\/collections\/\d+\/cancel/).reply(config => {
//         const token = config.headers?.Authorization || "";
//         const userId = Number(token.replace("Bearer fake-token-", ""));
//         if (!userId) return [401, { message: "Token inválido" }];

//         const idMatch = config.url?.match(/\/collections\/(\d+)\/cancel/);
//         if (!idMatch) return [400, { message: "ID inválido" }];
//         const id = Number(idMatch[1]);

//         const collection = collections.find(c => c.id === id && c.coletadorId === userId);
//         if (!collection) return [404, { message: "Coleta não encontrada" }];

//         collection.status = "cancelada";
//         return [200, collection];
//     });

//     mock.onPatch(/\/collections\/\d+\/reschedule/).reply(config => {
//         const token = config.headers?.Authorization || "";
//         const userId = Number(token.replace("Bearer fake-token-", ""));
//         if (!userId) return [401, { message: "Token inválido" }];

//         const idMatch = config.url?.match(/\/collections\/(\d+)\/reschedule/);
//         if (!idMatch) return [400, { message: "ID inválido" }];
//         const id = Number(idMatch[1]);

//         const body = JSON.parse(config.data);
//         if (!body.data) return [400, { message: "Data é obrigatória" }];

//         const collection = collections.find(c => c.id === id && c.coletadorId === userId);
//         if (!collection) return [404, { message: "Coleta não encontrada" }];

//         collection.data = body.data;
//         collection.status = "agendada"; // status de remarcado
//         return [200, collection];
//     });
//     mock.onGet("/environmental-data").reply(() => {
//         // Soma a quantidade de materiais reciclados em todas as coletas concluídas (ou outro filtro que fizer sentido)
//         const materialReciclado = collections
//             .filter(c => c.status === "concluida")
//             .reduce((acc, c) => acc + c.quantidade, 0);

//         // Para simplificar, vamos definir a redução de CO2 proporcional ao material reciclado
//         const reducaoCO2 = materialReciclado * 0.3; // exemplo: 0.3 kg CO2 por kg material

//         // E a água economizada proporcional ao material reciclado
//         const aguaEconomizada = materialReciclado * 1.5; // exemplo: 1.5 litros por kg material

//         return [200, {
//             materialReciclado,
//             reducaoCO2: Math.round(reducaoCO2),
//             aguaEconomizada: Math.round(aguaEconomizada),
//         }];
//     });
//     mock.onGet("/stats").reply(() => {
//         const totalUsuarios = Object.values(users).length;

//         const coletores = Object.values(users)
//             .filter(u => u.user.tipo === "coletador")
//             .map(u => u.user);

//         const coletoresAtivos = coletores.filter(coletor =>
//             collections.some(c => (c.status === "pendente" || c.status === "agendada") && c.coletadorId === coletor.id)
//         ).length;

//         const verificacoesPendentes = collections.filter(c => c.status === "pendente").length;

//         return [200, { totalUsuarios, coletoresAtivos, verificacoesPendentes }];
//     });

//     // No mock do axios (adicione após os outros mocks)
//     const denunciasMock: Denuncia[] = [
//         {
//             id: 1,
//             data: "14/03/2024",
//             descricao: "Coleta não realizada no horário combinado",
//             status: "Em Investigação",
//         },
//     ];

//     mock.onGet("/denuncias").reply(200, denunciasMock);

//     mock.onPost("/denuncias").reply((config) => {
//         const token = config.headers?.Authorization || "";
//         const userId = Number(token.replace("Bearer fake-token-", ""));
//         const user = Object.values(users).find(u => u.user.id === userId)?.user;

//         if (!user) return [401, { message: "Usuário não encontrado" }];

//         const data = JSON.parse(config.data) as {
//             tipo: DenunciaTipo;
//             descricao: string;
//             anonima: boolean;
//         };

//         const novaDenuncia: Denuncia & { autorId: number } = {
//             id: denunciasMock.length + 1,
//             data: new Date().toLocaleDateString("pt-BR"),
//             descricao: data.descricao,
//             status: "Pendente",
//             tipo: data.tipo,
//             anonima: data.anonima,
//             autorId: userId
//         };

//         denunciasMock.unshift(novaDenuncia);
//         return [201, novaDenuncia];
//     });


//     // Atualizar status da denúncia para "Resolvida"
//     mock.onPatch(/\/denuncias\/\d+\/resolver/).reply((config) => {
//         const idMatch = config.url?.match(/\/denuncias\/(\d+)\/resolver/);
//         if (!idMatch) return [400, { message: "ID inválido" }];

//         const id = Number(idMatch[1]);
//         const denuncia = denunciasMock.find(d => d.id === id);
//         if (!denuncia) return [404, { message: "Denúncia não encontrada" }];

//         denuncia.status = "Resolvida";
//         return [200, denuncia];
//     });

//     // Atualizar status da denúncia para "Em Investigação"
//     mock.onPatch(/\/denuncias\/\d+\/investigar/).reply((config) => {
//         const idMatch = config.url?.match(/\/denuncias\/(\d+)\/investigar/);
//         if (!idMatch) return [400, { message: "ID inválido" }];

//         const id = Number(idMatch[1]);
//         const denuncia = denunciasMock.find(d => d.id === id);
//         if (!denuncia) return [404, { message: "Denúncia não encontrada" }];

//         denuncia.status = "Em Investigação";
//         return [200, denuncia];
//     });

//     // Mensagens do chat global
//     let mensagensChat: {
//         id: number;
//         user: string;
//         text: string;
//         timestamp: string;
//     }[] = [];

//     // GET histórico do chat
//     mock.onGet("/chat").reply(200, mensagensChat);

//     // POST nova mensagem no chat
//     mock.onPost("/chat").reply(config => {
//         const data = JSON.parse(config.data);

//         if (!data.user || !data.text) {
//             return [400, { message: "Usuário e mensagem são obrigatórios" }];
//         }

//         const novaMsg = {
//             id: Date.now(),
//             user: data.user,
//             text: data.text,
//             timestamp: new Date().toISOString(),
//         };

//         mensagensChat.push(novaMsg);
//         return [201, novaMsg];
//     });

// }

// export default api;

import axios from "axios";

export type DenunciaTipo = "Má Conduta" | "Outro";

export interface Usuario {
    id: number;
    nome: string;
    email: string;
    tipo: string;
}

export interface Denuncia {
    id: number;
    data: string;
    descricao: string;
    status: string;
    tipo?: DenunciaTipo;
    anonima?: boolean;
}

export interface EnviarDenunciaRequest {
    tipo: DenunciaTipo;
    descricao: string;
    anonima: boolean;
}

export interface Coleta {
    id: number;
    coletador_id: number;
    tipo_material: string;
    quantidade: number;
    status: string;
    data: string;
    descricao: string;
    endereco: string;
}

export interface ChatMsg {
    id: number;
    user_name: string;
    text: string;
    timestamp: string;
}

export interface LoginRequest {
    email: string;
    senha: string;
}

export interface SignupRequest {
    nome: string;
    email: string;
    senha: string;
    tipo: string;
}

export interface AuthResponse {
    user: Usuario;
    token: string;
}

export interface EnvironmentalData {
    materialReciclado: number;
    reducaoCO2: number;
    aguaEconomizada: number;
}

export interface Stats {
    totalUsuarios: number;
    coletoresAtivos: number;
    verificacoesPendentes: number;
}

const api = axios.create({
    baseURL: "http://localhost:3000/api",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- AUTENTICAÇÃO ---

export async function login(data: LoginRequest): Promise<AuthResponse> {
    const res = await api.post("/auth/login", data);
    return res.data;
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
    const res = await api.post("/auth/signup", data);
    return res.data;
}

// --- DENÚNCIAS ---

export async function buscarDenuncias(): Promise<Denuncia[]> {
    const res = await api.get("/denuncias");
    return res.data;
}

export async function enviarDenuncia(dados: EnviarDenunciaRequest): Promise<Denuncia> {
    const res = await api.post("/denuncias", dados);
    return res.data;
}

export async function resolverDenuncia(id: number): Promise<Denuncia> {
    const res = await api.patch(`/denuncias/${id}/resolver`);
    return res.data;
}

export async function investigarDenuncia(id: number): Promise<Denuncia> {
    const res = await api.patch(`/denuncias/${id}/investigar`);
    return res.data;
}

// --- COLETAS ---

export async function criarColeta(coleta: {
    tipo_material: string;
    quantidade: number;
    descricao?: string;
    endereco?: string;
}): Promise<Coleta> {
    const res = await api.post("/collections", coleta);
    return res.data;
}

export async function minhasColetasPendentes(): Promise<Coleta[]> {
    const res = await api.get("/collections/my");
    return res.data;
}

export async function historicoColetas(): Promise<Coleta[]> {
    const res = await api.get("/collections/history");
    return res.data;
}

export async function coletasAtribuidas(): Promise<Coleta[]> {
    const res = await api.get("/collections/assigned");
    return res.data;
}

export async function coletasPendentes(): Promise<Coleta[]> {
    const res = await api.get("/collections/pending");
    return res.data;
}

export async function cancelarColeta(id: number): Promise<Coleta> {
    const res = await api.patch(`/collections/${id}/cancel`);
    return res.data;
}

export async function remarcarColeta(id: number, data: string): Promise<Coleta> {
    const res = await api.patch(`/collections/${id}/reschedule`, { data });
    return res.data;
}

// --- CHAT ---

export async function buscarMensagensChat(): Promise<ChatMsg[]> {
    const res = await api.get("/chat");
    return res.data;
}

export async function enviarMensagemChat(text: string): Promise<ChatMsg> {
    const res = await api.post("/chat", { text });
    return res.data;
}

// --- ESTATÍSTICAS ---

export async function buscarDadosAmbientais(): Promise<EnvironmentalData> {
    const res = await api.get("/environmental-data");
    return res.data;
}

export async function buscarStats(): Promise<Stats> {
    const res = await api.get("/stats");
    return res.data;
}

// --- USUÁRIOS ---

export async function listarUsuarios(): Promise<Usuario[]> {
    const res = await api.get("/users");
    return res.data;
}

export default api;
