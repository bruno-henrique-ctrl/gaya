import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Card,
    CardContent,
    Chip,
    Stack,
    CircularProgress,
    Alert,
    Button,
} from "@mui/material";

import api from "../../api/api";

type Status = "emInvestigacao" | "pendente" | "resolvida";

interface Denuncia {
    id: number;
    tipo: "Misconduct" | "Service";
    descricao: string;
    data: string;
    status: Status;
}

export const Denuncias: React.FC = () => {
    const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api
            .get("/denuncias")
            .then((response) => {
                const data = response.data.map((item: any) => ({
                    id: item.id,
                    tipo: item.tipo === "Má Conduta" ? "Misconduct" : "Service",
                    descricao: item.descricao,
                    data: item.data,
                    status:
                        item.status.toLowerCase() === "pendente"
                            ? "pendente"
                            : item.status.toLowerCase() === "em investigação"
                                ? "emInvestigacao"
                                : "resolvida",
                }));

                setDenuncias(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || "Erro ao carregar denúncias");
                setLoading(false);
            });
    }, []);

    const resolver = (id: number) => {
        api.patch(`/denuncias/${id}/resolver`)
            .then(() => {
                setDenuncias((prev) =>
                    prev.map((d) => (d.id === id ? { ...d, status: "resolvida" } : d))
                );
            })
            .catch(() => alert("Erro ao resolver denúncia"));
    };

    const investigar = (id: number) => {
        api.patch(`/denuncias/${id}/investigar`)
            .then(() => {
                setDenuncias((prev) =>
                    prev.map((d) => (d.id === id ? { ...d, status: "emInvestigacao" } : d))
                );
            })
            .catch(() => alert("Erro ao investigar denúncia"));
    };

    if (loading)
        return (
            <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
                <CircularProgress />
            </Container>
        );

    if (error)
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Gerenciamento de Denúncias
            </Typography>

            <Stack spacing={2}>
                {denuncias.map((d) => (
                    <Card key={d.id} variant="outlined">
                        <CardContent>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                <Chip
                                    label={d.tipo}
                                    color={d.tipo === "Misconduct" ? "error" : "warning"}
                                    size="small"
                                />
                                <Chip
                                    label={
                                        d.status === "emInvestigacao"
                                            ? "Em Investigação"
                                            : d.status === "pendente"
                                                ? "Pendente"
                                                : "Resolvida"
                                    }
                                    size="small"
                                    sx={{
                                        bgcolor:
                                            d.status === "emInvestigacao"
                                                ? "#dbeafe"
                                                : d.status === "pendente"
                                                    ? "#fef3c7"
                                                    : "#dcfce7",
                                        color:
                                            d.status === "emInvestigacao"
                                                ? "#2563eb"
                                                : d.status === "pendente"
                                                    ? "#92400e"
                                                    : "#166534",
                                    }}
                                />
                            </Stack>

                            <Typography variant="body1" mb={1}>
                                {d.descricao}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" mb={2}>
                                {d.data}
                            </Typography>

                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => resolver(d.id)}
                                    disabled={d.status === "resolvida"}
                                >
                                    Resolver
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => investigar(d.id)}
                                    disabled={
                                        d.status === "emInvestigacao" || d.status === "resolvida"
                                    }
                                >
                                    Investigar
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
        </Container>
    );
};
