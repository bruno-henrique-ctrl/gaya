import { Server } from "socket.io";
import { messages, ChatMessage } from "./chat";

module.exports = (socket) => {
    const io = new Server(socket, {
        cors: {
            origin: "*",
        }
    });

    io.on("connection", (socket) => {
        console.log(`Usuário conectado: ${socket.id}`);

        socket.on("chat_message", (msg: ChatMessage) => {
            messages.push(msg); 
            io.emit("chat_message", msg); 
        });

        socket.on("disconnect", () => {
            console.log(`Usuário desconectado: ${socket.id}`);
        });
    });
}