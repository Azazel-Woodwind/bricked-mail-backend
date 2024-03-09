import { Request, Response } from "express";
import TestService from "../../service/test.service";

export async function getTestByIdHandler(req: Request, res: Response) {
    try {
        const id = req.params.id;
        const test = await TestService.getById(id);

        if (!test) {
            return res.status(404).send("Test not found");
        }

        return res.json(test);
    } catch (error) {
        console.error("Error getting test by id", error);
        return res.status(500).send("Error getting test by id");
    }
}
