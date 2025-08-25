import React from "react";
import { createGlobalStyle } from "styled-components";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { useAuth } from "./hooks/useAuth";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import EnvironmentalReports from "./pages/admin/Ambiental.tsx";

import CollectorDashboard from "./pages/collector/CollectorDashboard";
import CollectorHistory from "./pages/collector/CollectionHistory";
import NewCollection from "./pages/collector/NewCollection";

import Chat from "./pages/shared/Chat";
import NotFound from "./pages/shared/NotFound";
import EstatisticasSistema from "./pages/admin/Estatisticas.tsx";
import { Denuncias } from "./pages/admin/Denuncias.tsx";
import { NovaDenuncia } from "./pages/collector/NovaDenuncia.tsx";
import WalletApp from "./wallet/WalletApp.tsx";

const PrivateRoute = ({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: ("admin" | "coletador")[];
}) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.tipo)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
};

const NotAuthorized = () => {
  return (
    <div style={{ padding: 20 }}>
      <h2>Não autorizado</h2>
      <p>Você não tem permissão para acessar esta página.</p>
    </div>
  );
};

const HomeRedirect = () => {
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
};

const App = () => {
  return (
    <AuthProvider>
      <ResetCSS />
      <Router>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

          {/* Public */}
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

          <Route
            path="/coletador/new" // nova rota para criar coleta
            element={
              <PrivateRoute roles={["coletador"]}>
                <NewCollection />
              </PrivateRoute>
            }
          />

          <Route
            path="/coletador/novadenuncia" // nova rota para criar coleta
            element={
              <PrivateRoute roles={["coletador"]}>
                <NovaDenuncia />
              </PrivateRoute>
            }
          />

          {/* Chat */}
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />

          {/* wallet */}
          <Route
            path="/wallet"
            element={
              <PrivateRoute>
                <WalletApp />
              </PrivateRoute>
            }
          />

          <Route path="/not-authorized" element={<NotAuthorized />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
};

export default App;

const ResetCSS = createGlobalStyle`
  /* http://meyerweb.com/eric/tools/css/reset/ 
     v2.0 | 20110126
     License: none (public domain)
  */

  html, body, div, span, applet, object, iframe,
  h1, h2, h3, h4, h5, h6, p, blockquote, pre,
  a, abbr, acronym, address, big, cite, code,
  del, dfn, em, img, ins, kbd, q, s, samp,
  small, strike, strong, sub, sup, tt, var,
  b, u, i, center,
  dl, dt, dd, ol, ul, li,
  fieldset, form, label, legend,
  table, caption, tbody, tfoot, thead, tr, th, td,
  article, aside, canvas, details, embed, 
  figure, figcaption, footer, header, hgroup, 
  menu, nav, output, ruby, section, summary,
  time, mark, audio, video {
    margin: 0; 
    padding: 0; 
    border: 0; 
    font-size: 100%; 
    font: inherit; 
    vertical-align: baseline;
  }
  
  /* HTML5 display-role reset for older browsers */
  article, aside, details, figcaption, figure, 
  footer, header, hgroup, menu, nav, section {
    display: block;
  }
  
  body {
    line-height: 1;
    background: #fff;
    color: #000;
  }
  
  ol, ul {
    list-style: none;
  }
  
  blockquote, q {
    quotes: none;
  }
  
  blockquote::before, blockquote::after,
  q::before, q::after {
    content: '';
    content: none;
  }
  
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }
`;
