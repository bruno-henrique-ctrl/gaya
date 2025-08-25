import { useEffect, useState } from "react";
import {
  Typography,
  Container,
  Paper,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";
import api from "../../api/api";

interface User {
  id: number;
  nome: string;
  email: string;
  tipo: string;
}

interface Endereco {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
}

interface Item {
  tipo_material: string;
  quantidade: number;
}

interface Collection {
  id: number;
  status: string;
  data: string;
  endereco: Endereco;
  descricao?: string;
  itens: Item[];
}

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState<string | null>(null);

  const [pendingCollections, setPendingCollections] = useState<Collection[]>(
    [],
  );
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [errorCollections, setErrorCollections] = useState<string | null>(null);

  const formatEndereco = (endereco: Endereco) => {
    const complemento = endereco.complemento ? `, ${endereco.complemento}` : "";
    return [
      `${endereco.rua}, ${endereco.numero}${complemento}`,
      `${endereco.bairro}, ${endereco.cidade} - ${endereco.estado}`,
      `CEP: ${endereco.cep}`,
    ].join(", ");
  };

  // Buscar usuário logado
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      const userStorage = localStorage.getItem("user");
      if (userStorage) setUser(JSON.parse(userStorage));
      else throw new Error("Usuário não encontrado");
    } catch (e: any) {
      setErrorUser(e.message);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // Buscar coletas pendentes
  useEffect(() => {
    async function fetchPendingCollections() {
      setLoadingCollections(true);
      setErrorCollections(null);
      try {
        const res = await api.get("/collections/assigned");

        const collections: Collection[] = res.data.map((col: any) => ({
          ...col,
          endereco:
            typeof col.endereco === "string"
              ? JSON.parse(col.endereco)
              : col.endereco,
          itens: col.itens || [
            { tipo_material: col.tipo_material, quantidade: col.quantidade },
          ],
        }));

        const pendentes = collections.filter((c) => c.status === "pendente");
        setPendingCollections(pendentes);
      } catch (error: any) {
        setErrorCollections(error.message);
      } finally {
        setLoadingCollections(false);
      }
    }

    fetchPendingCollections();
  }, []);

  // Concluir coleta
  const handleConcluirColeta = async (col: Collection) => {
    try {
      await api.patch(`/collections/${col.id}/complete`);
      setPendingCollections((prev) => prev.filter((c) => c.id !== col.id));
    } catch (err: any) {
      console.error(err);
      alert("Erro ao concluir coleta");
    }
  };

  if (loadingUser || loadingCollections)
    return (
      <Container sx={{ mt: 5, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );

  if (errorUser)
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error">{errorUser}</Alert>
      </Container>
    );

  if (errorCollections)
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error">{errorCollections}</Alert>
      </Container>
    );

  return (
    <Container sx={{ mt: 5, maxWidth: "md" }}>
      <Typography variant="h4" gutterBottom>
        Painel do Administrador
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informações do Usuário
        </Typography>
        <Box sx={{ mt: 2, lineHeight: 1.8 }}>
          <Typography>
            <strong>Nome:</strong> {user?.nome}
          </Typography>
          <Typography>
            <strong>Email:</strong> {user?.email}
          </Typography>
          <Typography>
            <strong>Tipo:</strong> {user?.tipo}
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Coletas Pendentes
        </Typography>
        {pendingCollections.length === 0 ? (
          <Typography>Não há coletas pendentes no momento.</Typography>
        ) : (
          <List>
            {pendingCollections.map((col) => (
              <Paper
                key={col.id}
                sx={{
                  mb: 2,
                  p: 2,
                  borderLeft: "6px solid #ef5350",
                }}
              >
                <ListItem disableGutters>
                  <ListItemText
                    primary={`Coleta #${col.id}`}
                    secondary={
                      <>
                        {col.itens.map((item, index) => (
                          <Typography
                            key={index}
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            display="block"
                          >
                            Material: {item.tipo_material} — Quantidade:{" "}
                            {item.quantidade}
                          </Typography>
                        ))}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          display="block"
                        >
                          Endereço: {formatEndereco(col.endereco)}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          display="block"
                        >
                          Data: {new Date(col.data).toLocaleString()}
                        </Typography>
                        {col.descricao && (
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            display="block"
                          >
                            Descrição: {col.descricao}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ mt: 1 }}
                    onClick={() => handleConcluirColeta(col)}
                  >
                    Concluir Coleta
                  </Button>
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
