import express, { Express } from "express";
import cors from "cors";
import testRouter from "./routes/test.route";

const app: Express = express();

app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.use("/api/test", testRouter);

export default app;
