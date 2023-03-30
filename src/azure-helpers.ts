import * as DevOps from "azure-devops-node-api";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import { type Variables } from "./variables";
import { type IInputs } from "./inputs";

export async function createGitClient(inputs: IInputs, vars: Variables): Promise<IGitApi> {
    let credHandler;
    if (inputs.pat !== undefined) {
        credHandler = DevOps.getPersonalAccessTokenHandler(inputs.pat);
    } else {
        credHandler = DevOps.getBearerHandler(vars.accessToken);
    }
    return await new DevOps.WebApi(vars.collectionUri, credHandler).getGitApi();
}
