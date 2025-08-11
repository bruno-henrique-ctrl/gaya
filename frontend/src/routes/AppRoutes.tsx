import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import AdminDashboard from "../pages/admin/AdminDashboard";
import UserManagement from "../pages/admin/UserManagement";
import EnvironmentalReports from '../pages/admin/Ambiental.tsx'
import EstatisticasSistema from "../pages/admin/Estatisticas.tsx";

import CollectorDashboard from "../pages/collector/CollectorDashboard";
import CollectorHistory from "../pages/collector/CollectionHistory";
import NewCollection from "../pages/collector/NewCollection";  // <-- import da nova página

import Chat from "../pages/shared/Chat";
import NotFound from "../pages/shared/NotFound";
import { Denuncias } from "../pages/admin/Denuncias.tsx";
import { NovaDenuncia } from "../pages/collector/NovaDenuncia.tsx";

function PrivateRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: ("admin" | "coletador")[];  // removido "catador"
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.tipo)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
}

function NotAuthorized() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Não autorizado</h2>
      <p>Você não tem permissão para acessar esta página.</p>
    </div>
  );
}

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.tipo) {
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "coletador":
      return <Navigate to="/coletador/dashboard" replace />;
    default:
      return <Navigate to="/not-authorized" replace />;
  }
}

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        {/* Páginas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute roles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute roles={["admin"]}>
              <UserManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/ambiental"
          element={
            <PrivateRoute roles={["admin"]}>
              <EnvironmentalReports />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/estatisticas"
          element={
            <PrivateRoute roles={["admin"]}>
              <EstatisticasSistema />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/denuncias"
          element={
            <PrivateRoute roles={["admin"]}>
              <Denuncias />
            </PrivateRoute>
          }
        />

        {/* Coletador */}
        <Route
          path="/coletador/dashboard"
          element={
            <PrivateRoute roles={["coletador"]}>
              <CollectorDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/coletador/history"
          element={
            <PrivateRoute roles={["coletador"]}>
              <CollectorHistory />
            </PrivateRoute>
          }
        />
        {/* Nova rota para criar coleta */}
        <Route
          path="/coletador/new"
          element={
            <PrivateRoute roles={["coletador"]}>
              <NewCollection />
            </PrivateRoute>
          }
        />
        <Route
          path="/coletador/novadenuncia"
          element={
            <PrivateRoute roles={["coletador"]}>
              <NovaDenuncia />
            </PrivateRoute>
          }
        />

        {/* Chat - disponível para todos usuários autenticados */}
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />

        <Route path="/not-authorized" element={<NotAuthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
