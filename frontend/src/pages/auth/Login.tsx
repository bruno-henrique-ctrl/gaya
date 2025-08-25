import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { TextField, Button, Typography, Box, Alert } from "@mui/material";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = useAuth();

  if (!auth) throw new Error("useAuth must be used within AuthProvider");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const loggedUser = await auth.login(email, senha);

      if (loggedUser.tipo === "admin") navigate("/admin/dashboard");
      else if (loggedUser.tipo === "coletador")
        navigate("/coletador/dashboard"); // <-- aqui
      else setError("Tipo de usuário desconhecido");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    }
  };

  return (
    <div>
      <Box
        maxWidth={400}
        margin="auto"
        padding={3}
        boxShadow={3}
        borderRadius={2}
        mt={5}
      >
        <Typography variant="h5" mb={3}>
          Login
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoFocus
          />

          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            fullWidth
            required
            margin="normal"
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
          >
            Entrar
          </Button>
        </form>
      </Box>
    </div>
  );
};

export default Login;
