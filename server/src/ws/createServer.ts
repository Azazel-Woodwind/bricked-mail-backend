import { Server } from "socket.io";
import http from "http";
import connectionHandler from "./connectionHandler";

export default function createServer(httpServer: http.Server): Server {
    const io = new Server(httpServer, {
        cors: { methods: ["GET", "POST"] },
    });

    io.on("connection", connectionHandler);

    return io;
}
