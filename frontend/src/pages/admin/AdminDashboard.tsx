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
} from "@mui/material";
import api from "../../api/api";

interface User {
    id: number;
    nome: string;
    email: string;
    tipo: string;
}

interface Collection {
    id: number;
    status: string;
    data: string;
    tipo_material: string;
    quantidade: number;
    endereco: string;
    descricao?: string;
}

const AdminDashboard = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [errorUser, setErrorUser] = useState<string | null>(null);

    const [coletadores, setColetadores] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [errorUsers, setErrorUsers] = useState<string | null>(null);

    const [pendingCollections, setPendingCollections] = useState<Collection[]>([]);
    const [loadingCollections, setLoadingCollections] = useState(true);
    const [errorCollections, setErrorCollections] = useState<string | null>(null);

    useEffect(() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Usuário não autenticado");

            const userStorage = localStorage.getItem("user");
            if (userStorage) {
                setUser(JSON.parse(userStorage));
            } else {
                throw new Error("Usuário não encontrado");
            }
        } catch (e: any) {
            setErrorUser(e.message);
        } finally {
            setLoadingUser(false);
        }
    }, []);

    useEffect(() => {
        async function fetchUsers() {
            setLoadingUsers(true);
            setErrorUsers(null);
            try {
                const res = await api.get("/users");
                const users: User[] = res.data;
                setColetadores(users.filter((u) => u.tipo === "coletador"));
            } catch (error: any) {
                setErrorUsers(error.message);
            } finally {
                setLoadingUsers(false);
            }
        }
        fetchUsers();
    }, []);

    useEffect(() => {
        async function fetchPendingCollections() {
            setLoadingCollections(true);
            setErrorCollections(null);
            try {
                const res = await api.get("/collections/assigned");
                const collections: Collection[] = res.data;

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

    if (loadingUser || loadingUsers || loadingCollections)
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

    if (errorUsers)
        return (
            <Container sx={{ mt: 5 }}>
                <Alert severity="error">{errorUsers}</Alert>
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

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Lista de Coletadores
                </Typography>
                {coletadores.length === 0 ? (
                    <Typography>Nenhum coletador encontrado.</Typography>
                ) : (
                    <List>
                        {coletadores.map((coletador) => (
                            <Paper
                                key={coletador.id}
                                sx={{
                                    mb: 2,
                                    p: 2,
                                    borderLeft: "6px solid #66bb6a",
                                }}
                            >
                                <ListItem disableGutters>
                                    <ListItemText
                                        primary={coletador.nome}
                                        secondary={
                                            <>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ display: "block" }}
                                                >
                                                    Email: {coletador.email}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ display: "block" }}
                                                >
                                                    Tipo: {coletador.tipo}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            </Paper>
                        ))}
                    </List>
                )}
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
                                        primary={`${col.tipo_material} — Quantidade: ${col.quantidade}`}
                                        secondary={
                                            <>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ display: "block" }}
                                                >
                                                    Endereço: {col.endereco}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ display: "block" }}
                                                >
                                                    Data: {new Date(col.data).toLocaleString()}
                                                </Typography>
                                                {col.descricao && (
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ display: "block" }}
                                                    >
                                                        Descrição: {col.descricao}
                                                    </Typography>
                                                )}
                                            </>
                                        }
                                    />
                                </ListItem>
                            </Paper>
                        ))}
                    </List>
                )}
            </Paper>
        </Container>
    );
}


export default AdminDashboard