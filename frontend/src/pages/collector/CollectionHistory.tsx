import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Container,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  Box,
} from "@mui/material";
import api from "../../api/api";

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
  status: "concluida" | "cancelada" | string;
  data: string;
  endereco: Endereco;
  descricao?: string;
  itens: Item[];
}

const CollectorHistory = () => {
  const [history, setHistory] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatEndereco = (endereco: Endereco) => {
    const complemento = endereco.complemento ? `, ${endereco.complemento}` : "";

    return [
      `${endereco.rua}, ${endereco.numero}${complemento}`,
      `${endereco.bairro}, ${endereco.cidade} - ${endereco.estado}`,
      `CEP: ${endereco.cep}`,
    ].join(", ");
  };

  async function fetchHistory() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/collections/history");

      const data: Collection[] = res.data.map((col: any) => ({
        ...col,
        endereco:
          typeof col.endereco === "string"
            ? JSON.parse(col.endereco)
            : col.endereco,
        itens: col.itens || [
          { tipo_material: col.tipo_material, quantidade: col.quantidade },
        ],
      }));

      setHistory(data);
    } catch (err) {
      setError(`Erro ao carregar histórico de coletas: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading)
    return (
      <Container sx={{ mt: 5, textAlign: "center" }}>
        <CircularProgress />
        <Typography mt={2}>Carregando histórico...</Typography>
      </Container>
    );

  if (error)
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
        <Box mt={2}>
          <Button variant="outlined" onClick={fetchHistory}>
            Tentar Novamente
          </Button>
        </Box>
      </Container>
    );

  if (history.length === 0)
    return (
      <Container sx={{ mt: 5, textAlign: "center" }}>
        <Typography variant="h6">
          Você ainda não possui histórico de coletas.
        </Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={fetchHistory}>
          Atualizar
        </Button>
      </Container>
    );

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Histórico de Coletas
      </Typography>

      <List>
        {history.map((col) => {
          // Status formatado
          const statusFormatado =
            col.status.charAt(0).toUpperCase() + col.status.slice(1);

          // Texto principal
          const primaryText = `Coleta #${col.id} — Status: ${statusFormatado}`;

          // Texto secundário
          const secondaryLines = [
            `Data: ${new Date(col.data).toLocaleString()}`,
            ...col.itens.map(
              (item) =>
                `Material: ${item.tipo_material} — Quantidade: ${item.quantidade}`,
            ),
            `Endereço: ${formatEndereco(col.endereco)}`,
          ];

          if (col.descricao) {
            secondaryLines.push(`Descrição: ${col.descricao}`);
          }

          return (
            <Paper
              key={col.id}
              sx={{
                mb: 2,
                p: 2,
                borderLeft: "6px solid",
                borderColor:
                  col.status === "concluida"
                    ? "#66bb6a"
                    : col.status === "cancelada"
                      ? "#ef5350"
                      : "#ccc",
              }}
            >
              <ListItem disableGutters>
                <ListItemText
                  primary={primaryText}
                  secondary={
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {secondaryLines.map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </Typography>
                  }
                />
              </ListItem>
            </Paper>
          );
        })}
      </List>
    </Container>
  );
};

export default CollectorHistory;
