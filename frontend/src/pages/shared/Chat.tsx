import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import api from "../../api/api.ts"; // seu arquivo api.ts

const socket: Socket = io("http://localhost:3001");

interface ChatMessage {
    id: number;
    user: string;
    text: string;
    timestamp: string;
}

function Chat() {
    const [username, setUsername] = useState("Rafaela");
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState<ChatMessage[]>([]);

    useEffect(() => {
        api.get<ChatMessage[]>("/chat").then(res => {
            setChat(res.data);
        });
    }, []);

    useEffect(() => {
        socket.on("chat_message", (msg: ChatMessage) => {
            setChat((prev) => [...prev, msg]);
        });

        return () => {
            socket.off("chat_message");
        };
    }, []);

    const sendMessage = async () => {
        if (message.trim() === "") return;

        // Salvar na API
        const res = await api.post<ChatMessage>("/chat", {
            user: username,
            text: message,
        });

        const savedMsg = res.data;

        // Emitir via socket
        socket.emit("chat_message", savedMsg);

        setMessage("");
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Chat em Tempo Real</h1>

            <div style={{ marginBottom: 10 }}>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu nome"
                />
            </div>

            <div
                style={{
                    border: "1px solid #ccc",
                    height: "200px",
                    overflowY: "auto",
                    marginBottom: 10,
                }}
            >
                {chat.map((msg) => (
                    <div key={msg.id}>
                        <strong>{msg.user}:</strong> {msg.text}{" "}
                        <small>({new Date(msg.timestamp).toLocaleTimeString()})</small>
                    </div>
                ))}
            </div>

            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Digite sua mensagem..."
            />
            <button onClick={sendMessage}>Enviar</button>
        </div>
    );
}

export default Chat;
