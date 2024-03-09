import { Types } from "mongoose";
import TestModel, { ITest } from "../models/test.model";

export default class TestService {
    public static async getById(
        id: string | Types.ObjectId
    ): Promise<ITest | null> {
        const test = await TestModel.findById(id);

        if (!test) return null;

        return test;
    }
}
