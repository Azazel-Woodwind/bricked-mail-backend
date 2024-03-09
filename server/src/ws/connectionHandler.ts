import { Socket } from "socket.io";
import onTestHandler from "./handlers/testHandler";

type DataHandler = (data: any, socket: Socket) => void;

const connectionHandler = async (socket: Socket) => {
    console.log("Socket connected");
    const route = (handler: DataHandler) => (data: any) =>
        handler(data, socket);

    socket.on("test", route(onTestHandler));
};

export default connectionHandler;
