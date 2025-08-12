import { useState } from "react";
import { Wallet } from "ethers";
import {
    Button,
    TextField,
    Typography,
    Alert,
    Stack,
    Paper,
    Divider,
} from "@mui/material";

const WalletApp = () => {
    const [password, setPassword] = useState("");
    const [encryptedJson, setEncryptedJson] = useState<string | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [message, setMessage] = useState("Hello from my wallet");
    const [signature, setSignature] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const createWallet = async () => {
        if (!password) {
            setError("Informe a senha para cifrar o keystore.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const wallet = Wallet.createRandom();
            setAddress(wallet.address);
            const json = await wallet.encrypt(password);
            setEncryptedJson(json);

            // Download keystore
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `keystore-${wallet.address}.json`;
            a.click();
            URL.revokeObjectURL(url);

            setInfo("Carteira criada e keystore baixado com sucesso.");
        } catch (e) {
            setError("Erro ao criar carteira.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const importByMnemonic = async (mnemonic: string) => {
        if (!password) {
            setError("Informe a senha para cifrar o keystore.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const wallet = Wallet.fromPhrase(mnemonic);
            setAddress(wallet.address);
            const json = await wallet.encrypt(password);
            setEncryptedJson(json);
            setInfo("Carteira importada com sucesso.");
        } catch (e) {
            setError("Erro ao importar carteira. Verifique a mnemonic.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const signMessage = async () => {
        if (!encryptedJson) {
            setError("Nenhum keystore disponível.");
            return;
        }
        if (!password) {
            setError("Informe a senha para decriptar o keystore.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const wallet = await Wallet.fromEncryptedJson(encryptedJson, password);
            const sig = await wallet.signMessage(message);
            setSignature(sig);
            setInfo("Mensagem assinada com sucesso.");

            await fetch("http://localhost:3000/verify-signature", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: wallet.address, message, signature: sig }),
            });
        } catch (e) {
            setError("Falha ao decriptar/assinar. Verifique a senha.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const backupKeystore = async () => {
        if (!encryptedJson || !address) {
            setError("Nada para enviar.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await fetch("http://localhost:3000/backup-keystore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, keystore_json: encryptedJson }),
            });
            setInfo("Keystore enviado com sucesso (cifrado). O servidor não tem sua senha.");
        } catch (e) {
            setError("Erro ao enviar keystore.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper
            elevation={3}
            sx={{ maxWidth: 600, margin: "40px auto", p: 4, borderRadius: 2 }}
        >
            <Typography variant="h4" textAlign="center" gutterBottom>
                Carteira
            </Typography>

            <Stack spacing={2} mb={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {info && <Alert severity="success">{info}</Alert>}

                <TextField
                    label="Senha para cifrar o keystore"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    disabled={loading}
                />

                <Divider />

                <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                        variant="contained"
                        onClick={createWallet}
                        disabled={loading}
                    >
                        Criar Nova Carteira
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            const mnemonic = prompt("Cole mnemonic aqui") || "";
                            if (mnemonic) importByMnemonic(mnemonic);
                        }}
                        disabled={loading}
                    >
                        Importar por Mnemonic
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={backupKeystore}
                        disabled={loading || !encryptedJson}
                    >
                        Fazer backup (enviar keystore cifrado)
                    </Button>
                </Stack>

                <Divider />

                <Typography variant="subtitle1" sx={{ wordBreak: "break-word" }}>
                    <strong>Endereço:</strong> {address ?? "-"}
                </Typography>

                <TextField
                    label="Mensagem para assinar"
                    multiline
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    fullWidth
                    disabled={loading}
                />

                <Button
                    variant="contained"
                    sx={{ mt: 1 }}
                    onClick={signMessage}
                    disabled={loading || !encryptedJson}
                >
                    Assinar Mensagem
                </Button>

                {signature && (
                    <>
                        <Typography
                            variant="subtitle2"
                            mt={2}
                            sx={{ wordBreak: "break-word", fontFamily: "monospace" }}
                        >
                            Signature:
                        </Typography>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 1,
                                backgroundColor: "#f5f5f5",
                                maxHeight: 120,
                                overflow: "auto",
                                fontFamily: "monospace",
                                wordBreak: "break-all",
                            }}
                        >
                            {signature}
                        </Paper>
                    </>
                )}
            </Stack>
        </Paper>
    );
};

export default WalletApp;
