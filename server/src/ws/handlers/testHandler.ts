import { Socket } from "socket.io";

interface Data {}

export default function onTestHandler(data: Data, socket: Socket) {
    console.log("onTestHandler", data);
    socket.emit("test", { data: "test" });
}
