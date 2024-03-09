import { Router } from "express";
import { getTestByIdHandler } from "../controllers/test.controller";

const testRouter = Router();

testRouter.route("/:id").get(getTestByIdHandler);

export default testRouter;
