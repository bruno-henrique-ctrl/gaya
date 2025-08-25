import { createContext, useState, useEffect, useContext } from "react";
import type { ReactNode } from "react";
import api from "../api/api"; // ajuste o caminho conforme seu projeto

export interface User {
  id: number;
  nome: string;
  email: string;
  tipo: "admin" | "coletador";
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, senha: string) => Promise<User>;
  logout: () => void;
}

interface Props {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  const login = async (email: string, senha: string): Promise<User> => {
    try {
      const response = await api.post("/auth/login", { email, senha });
      const loggedUser: User = response.data.user;
      const token: string = response.data.token;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedUser));
      setUser(loggedUser);

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return loggedUser;
    } catch (error: any) {
      // Garanta que error.response está definido para evitar crashes
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Credenciais inválidas";
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);

    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
