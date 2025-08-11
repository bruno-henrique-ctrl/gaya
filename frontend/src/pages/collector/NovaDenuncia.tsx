import { useState, useEffect } from "react";
import api from "../../api/api";
import {
    Button,
    Checkbox,
    Container,
    FormControl,
    FormControlLabel,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Typography,
    Paper,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";

export type DenunciaTipo = "Má Conduta" | "Outro";

export interface Denuncia {
    id: number;
    data: string;
    descricao: string;
    status: string;
    tipo?: DenunciaTipo;
    anonima?: boolean;
}

export const NovaDenuncia = () => {
    const [tipoDenuncia, setTipoDenuncia] = useState<DenunciaTipo>("Má Conduta");
    const [descricao, setDescricao] = useState("");
    const [anonima, setAnonima] = useState(false);
    const [denuncias, setDenuncias] = useState<Denuncia[]>([]);

    useEffect(() => {
        async function fetchDenuncias() {
            try {
                const response = await api.get<Denuncia[]>("/denuncias");
                setDenuncias(response.data);
            } catch (error) {
                console.error("Erro ao carregar denúncias", error);
            }
        }
        fetchDenuncias();
    }, []);

    const enviarDenuncia = async () => {
        if (!descricao.trim()) return;

        try {
            const response = await api.post<Denuncia>("/denuncias", {
                tipo: tipoDenuncia,
                descricao,
                anonima,
            });

            setDenuncias((prev) => [response.data, ...prev]);
            setDescricao("");
            setAnonima(false);
            setTipoDenuncia("Má Conduta");
        } catch (error) {
            console.error("Erro ao enviar denúncia", error);
        }
    }

    const handleTipoChange = (e: SelectChangeEvent) => {
        setTipoDenuncia(e.target.value as DenunciaTipo);
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom>
                EcoRecicla
            </Typography>

            <Paper sx={{ p: 3, mb: 4 }} elevation={3}>
                <Typography variant="h5" gutterBottom>
                    Fazer Denúncia
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="tipo-denuncia-label">Tipo de Denúncia</InputLabel>
                    <Select
                        labelId="tipo-denuncia-label"
                        value={tipoDenuncia}
                        onChange={handleTipoChange}
                    >
                        <MenuItem value="Má Conduta">Má Conduta</MenuItem>
                        <MenuItem value="Outro">Outro</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Descrição"
                    placeholder="Descreva o ocorrido em detalhes..."
                    multiline
                    rows={4}
                    fullWidth
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={anonima}
                            onChange={() => setAnonima(!anonima)}
                        />
                    }
                    label="Denúncia Anônima"
                    sx={{ mb: 2 }}
                />

                <Button
                    variant="contained"
                    onClick={enviarDenuncia}
                    disabled={!descricao.trim()}
                >
                    Enviar Denúncia
                </Button>
            </Paper>

            <Typography variant="h6" gutterBottom>
                Denúncias Recentes
            </Typography>

            <Paper elevation={1}>
                <List>
                    {denuncias.map((d) => (
                        <ListItem key={d.id} divider>
                            <ListItemText
                                primary={`${d.data} - ${d.descricao}`}
                                secondary={`${d.status}${d.anonima ? " (Anônima)" : ""}`}
                            />
                        </ListItem>
                    ))}
                    {denuncias.length === 0 && (
                        <ListItem>
                            <ListItemText primary="Nenhuma denúncia encontrada." />
                        </ListItem>
                    )}
                </List>
            </Paper>
        </Container>
    );
}
