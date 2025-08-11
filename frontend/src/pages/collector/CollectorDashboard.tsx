import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import {
    Typography,
    Container,
    Paper,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    Button,
    Box,
    Stack
} from "@mui/material";
import { AuthContext } from "../../auth/AuthContext";
import api from "../../api/api";

interface Collection {
    id: number;
    status: "pendente" | "agendada" | "concluida" | "cancelada";
    data: string;
    tipo_material: string;
    quantidade: number;
    endereco: string;
    descricao?: string;
}

const CollectorDashboard = () => {
    const auth = useContext(AuthContext);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [rescheduleId, setRescheduleId] = useState<number | null>(null);
    const [newDate, setNewDate] = useState<string>("");

    async function fetchCollections() {
        if (!auth?.user) {
            setError("Usuário não autenticado.");
            setLoading(false);
            return;
        }

        if (auth.user.tipo !== "coletador") {
            setError("Acesso negado. Apenas coletadores podem acessar este dashboard.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            const res = await api.get("/collections/my", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCollections(res.data);
        } catch {
            setError("Erro ao carregar coletas.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel(id: number) {
        if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) return;
        try {
            await api.patch(`/collections/${id}/cancel`);
            fetchCollections();
        } catch {
            alert("Erro ao cancelar o agendamento.");
        }
    }

    async function handleConfirmReschedule() {
        if (!rescheduleId || !newDate) return alert("Selecione uma nova data");

        try {
            await api.patch(`/collections/${rescheduleId}/reschedule`, {
                data: newDate,
            });
            setRescheduleId(null);
            setNewDate("");
            fetchCollections();
        } catch {
            alert("Erro ao remarcar o agendamento.");
        }
    }

    function handleCloseDialog() {
        setRescheduleId(null);
        setNewDate("");
    }

    function openRescheduleDialog(id: number, currentDate: string) {
        setRescheduleId(id);
        setNewDate(currentDate.slice(0, 16)); // Ajuste para datetime-local padrão
    }

    useEffect(() => {
        fetchCollections();
    }, [auth?.user]);

    if (loading)
        return (
            <Container sx={{ mt: 5, textAlign: "center" }}>
                <CircularProgress />
                <Typography mt={2}>Carregando suas coletas...</Typography>
            </Container>
        );

    if (error)
        return (
            <Container sx={{ mt: 5 }}>
                <Alert severity="error">{error}</Alert>
                <Box mt={2}>
                    <Button variant="outlined" onClick={fetchCollections}>
                        Tentar Novamente
                    </Button>
                </Box>
            </Container>
        );

    if (collections.length === 0)
        return (
            <Container sx={{ mt: 5, textAlign: "center" }}>
                <Typography variant="h6">Você não possui coletas no momento.</Typography>
                <Button sx={{ mt: 2 }} variant="contained" onClick={fetchCollections}>
                    Atualizar
                </Button>
            </Container>
        );

    const statusLabels: Record<Collection["status"], string> = {
        pendente: "Pendente",
        agendada: "Remarcado",
        concluida: "Realizado",
        cancelada: "Cancelado",
    };

    return (
        <Container sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom>
                Agendamentos Recentes
            </Typography>

            <List>
                {collections
                    .filter(col => col.status !== "concluida" && col.status !== "cancelada")
                    .map((col) => (
                        <Paper
                            key={col.id}
                            sx={{
                                mb: 2,
                                p: 2,
                                borderLeft: "6px solid",
                                borderColor:
                                    col.status === "pendente"
                                        ? "#ffca28"
                                        : col.status === "agendada"
                                            ? "#fbc02d"
                                            : "#ef5350",
                            }}
                        >
                            <ListItem disableGutters>
                                <ListItemText
                                    primary={`${new Date(col.data).toLocaleDateString()} | ${new Date(col.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${col.endereco}`}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2">
                                                Status: {statusLabels[col.status]}
                                            </Typography>
                                            <br />
                                            <Typography component="span" variant="body2">
                                                Material: {col.tipo_material} — Quantidade: {col.quantidade}
                                            </Typography>
                                            {col.descricao && (
                                                <>
                                                    <br />
                                                    <Typography component="span" variant="body2">
                                                        Descrição: {col.descricao}
                                                    </Typography>
                                                </>
                                            )}
                                        </>
                                    }
                                />
                            </ListItem>
                            <Stack direction="row" spacing={2} sx={{ mt: 1, ml: 1 }}>
                                <Button variant="text" color="primary" onClick={() => openRescheduleDialog(col.id, col.data)}>
                                    Remarcar
                                </Button>

                                <Button variant="text" color="error" onClick={() => handleCancel(col.id)}>
                                    Cancelar
                                </Button>
                            </Stack>
                        </Paper>
                    ))}
            </List>
            <Dialog open={rescheduleId !== null} onClose={handleCloseDialog}>
                <DialogTitle>Remarcar Coleta</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Nova Data e Hora"
                        type="datetime-local"
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        fullWidth
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button variant="contained" onClick={handleConfirmReschedule}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}

export default CollectorDashboard