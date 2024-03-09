import { Document, Schema, model } from "mongoose";

export interface ITest extends Document {
    field1: string;
    field2: string;
}

const testSchema = new Schema<ITest>({
    field1: { type: String, required: true },
    field2: { type: String, required: true, unique: true },
});

const TestModel = model<ITest>("Test", testSchema);

export default TestModel;
