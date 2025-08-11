import React, { useEffect, useState } from 'react';
import api from '../../api/api'; // ajuste o caminho do seu arquivo api.ts
import { Box, Typography, Paper, Stack } from '@mui/material';

const EstatisticasSistema: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsuarios: 0,
        coletoresAtivos: 0,
        verificacoesPendentes: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                // exemplo de endpoint que retorna as estatísticas
                const response = await api.get('/stats');
                setStats(response.data);
                setLoading(false);
            } catch (err) {
                setError('Erro ao carregar estatísticas');
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (loading) return <Typography>Carregando...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" color="text.primary">
                Estatísticas do Sistema
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                <Paper elevation={2} sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Total de Usuários
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {stats.totalUsuarios}
                        </Typography>
                    </Box>
                    {/* Emoji usuário */}
                    <Typography sx={{ fontSize: 40 }}>👥</Typography>
                </Paper>

                <Paper elevation={2} sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Coletores Ativos
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {stats.coletoresAtivos}
                        </Typography>
                    </Box>
                    {/* Emoji escudo */}
                    <Typography sx={{ fontSize: 40 }}>🛡️</Typography>
                </Paper>

                <Paper elevation={2} sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Verificações Pendentes
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {stats.verificacoesPendentes}
                        </Typography>
                    </Box>
                    {/* Emoji alerta */}
                    <Typography sx={{ fontSize: 40, color: '#ffb300' }}>⚠️</Typography>
                </Paper>
            </Stack>
        </Box>
    );
};

export default EstatisticasSistema;
