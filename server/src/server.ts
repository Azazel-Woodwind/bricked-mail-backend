import http from "http";
import app from "./http/app";
import createServer from "./ws/createServer";
import { Server } from "socket.io";

const server = http.createServer(app);
export const io: Server = createServer(server);

export default server;
