import rewiremock from "rewiremock";
import * as sinon from "sinon";

export const testInputs = new Map<string, any>();
export const testVariables = new Map<string, any>();

export function rewireAll(): void {
    rewiremock("azure-pipelines-task-lib")
        .with({
            getInput: sinon.stub().callsFake((i: string) => testInputs.get(i)),
            getInputRequired: sinon.stub().callsFake((i: string) => testInputs.get(i)),
            getBoolInput: sinon.stub().callsFake((i: string) => testInputs.get(i)),
            getVariable: sinon.stub().callsFake((v: string) => testVariables.get(v))
        });
}

export async function instantiate<T>(getConstructor: () => Promise<new () => T>): Promise<T> {
    rewiremock.enable();
    const TConstruct = await getConstructor();
    rewiremock.disable();
    return new TConstruct();
}

export { rewiremock };
