import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    CircularProgress,
    Alert,
} from "@mui/material";
import api from "../../api/api";

interface User {
    id: number;
    nome: string;
    email: string;
    tipo: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api
            .get("/users")
            .then((res) => {
                setUsers(res.data);
                setError(null);
            })
            .catch((err) => {
                setError("Erro ao carregar usuários.");
                console.error("Erro ao carregar usuários:", err);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading)
        return (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
                <CircularProgress />
            </div>
        );

    if (error)
        return (
            <Alert severity="error" sx={{ marginTop: 4 }}>
                {error}
            </Alert>
        );

    return (
        <div style={{ padding: 20 }}>
            <Typography variant="h4" gutterBottom>
                Gerenciamento de Usuários
            </Typography>

            {users.length === 0 ? (
                <Typography>Nenhum usuário encontrado.</Typography>
            ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                    <Table stickyHeader aria-label="Tabela de usuários">
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nome</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Tipo</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id} hover>
                                    <TableCell>{u.id}</TableCell>
                                    <TableCell>{u.nome}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>{u.tipo}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </div>
    );
}
