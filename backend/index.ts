import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

require("./server")(app);

const server = http.createServer(app);
require("./socket")(server);

server.listen(process.env.PORT || 3000, () => {
    console.log("Servidor rodando na porta 3000");
});
