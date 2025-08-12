import { useState } from "react";
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    RadioGroup,
    FormControlLabel,
    Radio,
    MenuItem
} from "@mui/material";
import api from "../../api/api";

// Função para mapear quantidade textual para número (kg)
function mapQuantidadeParaNumero(qtd: string): number {
    switch (qtd) {
        case "pequena":
            return 5;       // até 5kg
        case "media":
            return 10;      // entre 5kg e 15kg
        case "grande":
            return 20;      // acima de 15kg
        default:
            return 0;
    }
}

const NewCollection = () => {
    const [dataColeta, setDataColeta] = useState("");
    const [horaColeta, setHoraColeta] = useState("");
    const [tipoMaterial, setTipoMaterial] = useState("");
    const [quantidade, setQuantidade] = useState(""); // agora é string simples
    const [descricao, setDescricao] = useState("");

    const [rua, setRua] = useState("");
    const [numero, setNumero] = useState("");
    const [complemento, setComplemento] = useState("");
    const [bairro, setBairro] = useState("");
    const [cep, setCep] = useState("");
    const [cidade, setCidade] = useState("");
    const [estado, setEstado] = useState("");

    const [status] = useState("pendente");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!dataColeta || !horaColeta || !tipoMaterial || !quantidade || !rua || !numero || !bairro || !cep || !cidade || !estado) {
            setError("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        setLoading(true);

        try {
            const quantidadeNum = mapQuantidadeParaNumero(quantidade);

            await api.post("/collections", {
                data_coleta: dataColeta,
                hora_coleta: horaColeta,
                tipo_material: tipoMaterial,
                quantidade: quantidadeNum,
                descricao,
                endereco: {
                    rua,
                    numero,
                    complemento,
                    bairro,
                    cep,
                    cidade,
                    estado,
                },
                status,
            });

            setSuccess(true);

            // resetar campos
            setDataColeta("");
            setHoraColeta("");
            setTipoMaterial("");
            setQuantidade("");
            setDescricao("");
            setRua("");
            setNumero("");
            setComplemento("");
            setBairro("");
            setCep("");
            setCidade("");
            setEstado("");
        } catch (err) {
            console.error(err);
            setError("Erro ao criar nova coleta. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom>
                Nova Coleta
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>Coleta criada com sucesso!</Alert>}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                {/* Data e Horário */}
                <Typography variant="subtitle1">Data da Coleta</Typography>
                <TextField
                    type="date"
                    value={dataColeta}
                    onChange={(e) => setDataColeta(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                />

                <Typography variant="subtitle1">Horário da Coleta</Typography>
                <TextField
                    type="time"
                    value={horaColeta}
                    onChange={(e) => setHoraColeta(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                />

                {/* Tipo de Material */}
                <TextField
                    select
                    label="Tipo de Material"
                    value={tipoMaterial}
                    onChange={(e) => setTipoMaterial(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                >
                    <MenuItem value="plastico">Plástico</MenuItem>
                    <MenuItem value="papel">Papel</MenuItem>
                    <MenuItem value="metal">Metal</MenuItem>
                    <MenuItem value="vidro">Vidro</MenuItem>
                    <MenuItem value="eletronicos">Eletrônicos</MenuItem>
                    <MenuItem value="outros">Outros</MenuItem>
                </TextField>

                {/* Quantidade (radio) */}
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Estimativa de Quantidade
                </Typography>
                <RadioGroup
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                >
                    <FormControlLabel value="pequena" control={<Radio />} label="Pequena (até 5kg)" />
                    <FormControlLabel value="media" control={<Radio />} label="Média (5kg a 15kg)" />
                    <FormControlLabel value="grande" control={<Radio />} label="Grande (acima de 15kg)" />
                </RadioGroup>
                <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                    Essa estimativa nos ajuda a planejar a capacidade de coleta. A quantidade exata será medida no momento da coleta.
                </Typography>

                {/* Endereço */}
                <Typography variant="h6" sx={{ mt: 3 }}>Endereço de Coleta</Typography>
                <TextField label="Rua" value={rua} onChange={(e) => setRua(e.target.value)} fullWidth required margin="normal" />
                <TextField label="Número" value={numero} onChange={(e) => setNumero(e.target.value)} fullWidth required margin="normal" />
                <TextField label="Complemento" value={complemento} onChange={(e) => setComplemento(e.target.value)} fullWidth margin="normal" />
                <TextField label="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} fullWidth required margin="normal" />
                <TextField label="CEP" value={cep} onChange={(e) => setCep(e.target.value)} fullWidth required margin="normal" />
                <TextField label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} fullWidth required margin="normal" />
                <TextField label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} fullWidth required margin="normal" />

                {/* Botão */}
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    sx={{ mt: 3 }}
                >
                    {loading ? "Enviando..." : "Criar Coleta"}
                </Button>
            </Box>
        </Container>
    );
};

export default NewCollection;
