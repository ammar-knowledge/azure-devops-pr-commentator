import { type IInputs } from "../src/inputs";

export const createStubInputs = (override?: Partial<IInputs>): IInputs => Object.assign({
    comment: "test comment",
    fileGlob: "test glob",
    hashedConditions: "test hash"
}, override);
