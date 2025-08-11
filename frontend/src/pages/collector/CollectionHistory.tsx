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

interface Collection {
    id: number;
    status: "concluida" | "cancelada" | string;
    data: string; // data/hora da coleta
    tipo_material: string;
    quantidade: number;
    endereco: string;
    descricao?: string;
}

export default function CollectorHistory() {
    const [history, setHistory] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchHistory() {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/collections/history"); // endpoint fictício para histórico
            setHistory(res.data);
        } catch (err) {
            setError("Erro ao carregar histórico de coletas.");
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
                <Typography variant="h6">Você ainda não possui histórico de coletas.</Typography>
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
                {history.map((col) => (
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
                                primary={`Coleta #${col.id} — Status: ${col.status.charAt(0).toUpperCase() + col.status.slice(1)}`}
                                secondary={
                                    <>
                                        <Typography component="span" variant="body2">
                                            Data: {new Date(col.data).toLocaleString()}
                                            <br />
                                            Material: {col.tipo_material} — Quantidade: {col.quantidade}
                                            <br />
                                            Endereço: {col.endereco}
                                            {col.descricao && (
                                                <>
                                                    <br />
                                                    Descrição: {col.descricao}
                                                </>
                                            )}
                                        </Typography>
                                    </>
                                }
                            />
                        </ListItem>
                    </Paper>
                ))}
            </List>
        </Container>
    );
}
