import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Box, Typography, Paper, Stack } from "@mui/material";

type ReportProps = {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend: "increase" | "stable";
  description: string;
};

const Report = ({
  title,
  value,
  unit,
  icon,
  trend,
  description,
}: ReportProps) => {
  return (
    <Paper elevation={3} sx={{ p: 2, width: 220 }}>
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        {title}
      </Typography>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Typography variant="h4" component="strong">
          {value} {unit}
        </Typography>
        <Box fontSize={30} color="primary.main" aria-label={`${title} icon`}>
          {icon}
        </Box>
      </Box>
      <Typography
        variant="body2"
        color={trend === "increase" ? "success.main" : "text.secondary"}
      >
        {trend === "increase" ? "↑" : "→"} {description} vs. mês anterior
      </Typography>
    </Paper>
  );
};

type EnvironmentalData = {
  materialReciclado: number;
  reducaoCO2: number;
  aguaEconomizada: number;
};

const EnvironmentalReports: React.FC = () => {
  const [data, setData] = useState<EnvironmentalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnvironmentalData() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/environmental-data");
        setData(response.data);
      } catch (err) {
        setError(`Erro ao carregar os dados${err}`);
      } finally {
        setLoading(false);
      }
    }

    fetchEnvironmentalData();
  }, []);

  if (loading) return <Typography>Carregando dados...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Relatórios Ambientais
      </Typography>
      <Stack direction="row" spacing={3}>
        <Report
          title="Material Reciclado"
          value={data?.materialReciclado ?? 0}
          unit="kg"
          icon={
            <span role="img" aria-label="Reciclagem">
              ♻️
            </span>
          }
          trend="increase"
          description="Aumento"
        />
        <Report
          title="Redução de CO2"
          value={data?.reducaoCO2 ?? 0}
          unit="kg"
          icon={
            <span role="img" aria-label="CO2">
              🌿
            </span>
          }
          trend="increase"
          description="Aumento"
        />
        <Report
          title="Água Economizada"
          value={data?.aguaEconomizada ?? 0}
          unit="L"
          icon={
            <span role="img" aria-label="Água">
              💧
            </span>
          }
          trend="stable"
          description="Estável"
        />
      </Stack>
    </Box>
  );
};

export default EnvironmentalReports;
