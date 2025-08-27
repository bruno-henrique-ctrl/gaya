import axios from "axios";

// ------------------- TIPOS -------------------

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
  tipo?: string;
  anonima?: boolean;
}

export interface EnviarDenunciaRequest {
  tipo: string;
  descricao: string;
  anonima: boolean;
}

export interface Endereco {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
}

export interface CollectionItem {
  id: number;
  tipo_material: string;
  quantidade: number;
  descricao: string;
  collection_id: number;
}

export interface Coleta {
  id: number;
  coletador_id: number;
  status: string;
  data: string;
  endereco: Endereco;
  itens: CollectionItem[];
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
  totalDenuncias: number;
}

// ------------------- CONFIGURAÇÃO AXIOS -------------------

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ------------------- AUTENTICAÇÃO -------------------

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await api.post("/auth/login", data);
  return res.data;
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const res = await api.post("/auth/signup", data);
  return res.data;
}

// ------------------- DENÚNCIAS -------------------

export async function buscarDenuncias(): Promise<Denuncia[]> {
  const res = await api.get("/denuncias");
  return res.data;
}

export async function enviarDenuncia(
  dados: EnviarDenunciaRequest,
): Promise<Denuncia> {
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

// ------------------- COLETAS -------------------

export async function criarColeta(coleta: {
  itens: { tipo_material: string; quantidade: number; descricao?: string }[];
  endereco?: Endereco;
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

export async function remarcarColeta(
  id: number,
  data: string,
): Promise<Coleta> {
  const res = await api.patch(`/collections/${id}/reschedule`, { data });
  return res.data;
}

// ------------------- CHAT -------------------

export async function buscarMensagensChat(): Promise<ChatMsg[]> {
  const res = await api.get("/chat");
  return res.data;
}

export async function enviarMensagemChat(text: string): Promise<ChatMsg> {
  const res = await api.post("/chat", { text });
  return res.data;
}

// ------------------- ESTATÍSTICAS -------------------

export async function buscarDadosAmbientais(): Promise<EnvironmentalData> {
  const res = await api.get("/environmental-data");
  return res.data;
}

export async function buscarStats(): Promise<Stats> {
  const res = await api.get("/stats");
  return res.data;
}

// ------------------- USUÁRIOS -------------------

export async function listarUsuarios(): Promise<Usuario[]> {
  const res = await api.get("/users");
  return res.data;
}

export default api;
