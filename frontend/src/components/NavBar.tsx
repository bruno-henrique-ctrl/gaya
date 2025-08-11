import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    }

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    sx={{ color: "inherit", textDecoration: "none", flexGrow: 1 }}
                >
                    GAYA - Reciclagem
                </Typography>

                {!user && (
                    <>
                        <Button color="inherit" component={Link} to="/login">
                            Login
                        </Button>
                        <Button color="inherit" component={Link} to="/register">
                            Registrar
                        </Button>
                    </>
                )}

                {user && (
                    <Box>
                        {user.tipo === "admin" && (
                            <>
                                <Button color="inherit" component={Link} to="/admin/dashboard">
                                    Dashboard
                                </Button>
                                <Button color="inherit" component={Link} to="/admin/users">
                                    Usuários
                                </Button>
                                <Button color="inherit" component={Link} to="/admin/ambiental">
                                    Ambiental
                                </Button>
                                <Button color="inherit" component={Link} to="/admin/estatisticas">
                                    Estatisticas
                                </Button>
                                <Button color="inherit" component={Link} to="/admin/denuncias">
                                    Denucias
                                </Button>
                            </>
                        )}

                        {user.tipo === "coletador" && (
                            <>
                                <Button color="inherit" component={Link} to="/coletador/dashboard">
                                    Dashboard
                                </Button>
                                <Button color="inherit" component={Link} to="/coletador/history">
                                    Histórico
                                </Button>
                                <Button color="inherit" component={Link} to="/coletador/new">
                                    Nova Coleta
                                </Button>
                                <Button color="inherit" component={Link} to="/coletador/novadenuncia">
                                    Nova Denuncia
                                </Button>
                            </>
                        )}

                        {/* REMOVIDO o bloco do user.tipo === "catador" */}

                        <Button color="inherit" component={Link} to="/chat">
                            Chat
                        </Button>

                        <Button color="inherit" onClick={handleLogout}>
                            Sair
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
}

export default Navbar