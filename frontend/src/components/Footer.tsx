import { Box, Typography, Container } from "@mui/material";

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                py: 2,
                mt: "auto",
                backgroundColor: (theme) =>
                    theme.palette.mode === "light"
                        ? theme.palette.grey[200]
                        : theme.palette.grey[800],
            }}
        >
            <Container maxWidth="lg">
                <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                >
                    &copy; {new Date().getFullYear()}{" "}
                    <strong>ReciclaHub</strong> — Todos os direitos reservados.
                </Typography>
            </Container>
        </Box>
    );
}
