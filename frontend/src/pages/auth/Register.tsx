import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import {
  TextField,
  Button,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";

type UserType = "coletador" | "admin";
const Register = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState<UserType>("coletador");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const isFormValid = nome && email && senha && telefone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    setLoading(true);

    try {
      await api.post("/auth/signup", { nome, email, telefone, tipo, senha });
      alert("Cadastro realizado com sucesso! Faça login.");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao realizar cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      maxWidth={400}
      margin="auto"
      padding={3}
      boxShadow={3}
      borderRadius={2}
      mt={5}
    >
      <Typography variant="h4" mb={3}>
        Cadastro
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Nome"
          fullWidth
          required
          margin="normal"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoFocus
        />

        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          label="Telefone"
          type="tel"
          fullWidth
          required
          margin="normal"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />

        <TextField
          select
          label="Tipo"
          fullWidth
          required
          margin="normal"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as UserType)}
        >
          <MenuItem value="coletador">Coletador</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="usuario">Usuário</MenuItem>
        </TextField>

        <TextField
          label="Senha"
          type="password"
          fullWidth
          required
          margin="normal"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!isFormValid || loading}
          fullWidth
          sx={{ mt: 3 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Cadastrar"
          )}
        </Button>
      </form>
    </Box>
  );
};

export default Register;
