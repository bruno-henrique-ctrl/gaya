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
  MenuItem,
  IconButton,
  Paper,
} from "@mui/material";
import api from "../../api/api";

function mapQuantidadeParaNumero(qtd: string): number {
  switch (qtd) {
    case "pequena":
      return 5;
    case "media":
      return 10;
    case "grande":
      return 20;
    default:
      return 0;
  }
}

const NewCollection = () => {
  const [dataColeta, setDataColeta] = useState("");
  const [horaColeta, setHoraColeta] = useState("");

  // Lista de itens
  const [itens, setItens] = useState<
    { tipoMaterial: string; quantidade: string; descricao: string }[]
  >([]);

  // Campos temporários para adicionar um novo item
  const [tipoMaterial, setTipoMaterial] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [descricao, setDescricao] = useState("");

  // Endereço
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

  // Adicionar item à lista
  const handleAddItem = () => {
    if (!tipoMaterial || !quantidade) return;
    setItens([...itens, { tipoMaterial, quantidade, descricao }]);
    setTipoMaterial("");
    setQuantidade("");
    setDescricao("");
  };

  // Remover item da lista
  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (
      !dataColeta ||
      !horaColeta ||
      itens.length === 0 ||
      !rua ||
      !numero ||
      !bairro ||
      !cep ||
      !cidade ||
      !estado
    ) {
      setError(
        "Por favor, preencha todos os campos obrigatórios e adicione pelo menos um item.",
      );
      return;
    }

    setLoading(true);

    try {
      // Converte data e hora para ISO
      const dataHoraColeta = new Date(
        `${dataColeta}T${horaColeta}`,
      ).toISOString();

      // Converte quantidades para número
      const itensFormatados = itens.map((i) => ({
        tipo_material: i.tipoMaterial,
        quantidade: mapQuantidadeParaNumero(i.quantidade),
        descricao: i.descricao,
      }));

      const enderecoObj = {
        rua,
        numero,
        complemento,
        bairro,
        cep,
        cidade,
        estado,
      };

      await api.post("/collections", {
        data_coleta: dataHoraColeta,
        itens: itensFormatados,
        endereco: enderecoObj,
        status,
      });

      setSuccess(true);

      // Resetar tudo
      setDataColeta("");
      setHoraColeta("");
      setItens([]);
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

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">Coleta criada com sucesso!</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="subtitle1">Data</Typography>
        <TextField
          type="date"
          value={dataColeta}
          onChange={(e) => setDataColeta(e.target.value)}
          fullWidth
          required
        />
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Hora
        </Typography>
        <TextField
          type="time"
          value={horaColeta}
          onChange={(e) => setHoraColeta(e.target.value)}
          fullWidth
          required
        />

        <Typography variant="h6" sx={{ mt: 3 }}>
          Itens para Coleta
        </Typography>
        <TextField
          select
          label="Tipo de Material"
          value={tipoMaterial}
          onChange={(e) => setTipoMaterial(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="plastico">Plástico</MenuItem>
          <MenuItem value="papel">Papel</MenuItem>
          <MenuItem value="metal">Metal</MenuItem>
          <MenuItem value="vidro">Vidro</MenuItem>
          <MenuItem value="eletronicos">Eletrônicos</MenuItem>
          <MenuItem value="outros">Outros</MenuItem>
        </TextField>

        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Quantidade
        </Typography>
        <RadioGroup
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        >
          <FormControlLabel
            value="pequena"
            control={<Radio />}
            label="Pequena (até 5kg)"
          />
          <FormControlLabel
            value="media"
            control={<Radio />}
            label="Média (5kg a 15kg)"
          />
          <FormControlLabel
            value="grande"
            control={<Radio />}
            label="Grande (acima de 15kg)"
          />
        </RadioGroup>

        <TextField
          label="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          fullWidth
          margin="normal"
        />

        <Button
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={handleAddItem}
          disabled={!tipoMaterial || !quantidade}
        >
          Adicionar Item
        </Button>

        {itens.map((item, index) => (
          <Paper key={index} sx={{ p: 2, mt: 2 }}>
            <Typography>
              {item.tipoMaterial} - {item.quantidade} -{" "}
              {item.descricao || "Sem descrição"}
            </Typography>
            <IconButton onClick={() => handleRemoveItem(index)} color="error">
              Deletar
            </IconButton>
          </Paper>
        ))}

        <Typography variant="h6" sx={{ mt: 3 }}>
          Endereço
        </Typography>
        <TextField
          label="Rua"
          value={rua}
          onChange={(e) => setRua(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Número"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Complemento"
          value={complemento}
          onChange={(e) => setComplemento(e.target.value)}
          fullWidth
        />
        <TextField
          label="Bairro"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="CEP"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          fullWidth
          required
        />

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
