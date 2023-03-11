import rewiremock from "rewiremock";
import * as sinon from "sinon";

export const testInputs = new Map<string, any>();

rewiremock("azure-pipelines-task-lib")
    .with({
        getInput: sinon.stub().callsFake((i: string) => testInputs.get(i)),
        getInputRequired: sinon.stub().callsFake((i: string) => testInputs.get(i)),
        getBoolInput: sinon.stub().callsFake((i: string) => testInputs.get(i)),
    });
rewiremock.enable();
