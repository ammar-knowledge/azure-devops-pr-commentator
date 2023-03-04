import { getInput, getVariable } from "azure-pipelines-task-lib/task";
import * as DevOps from "azure-devops-node-api";
import { type IGitApi } from "azure-devops-node-api/GitApi";

export async function createGitClient(): Promise<IGitApi> {
    let credHandler;
    const pat = getInput("PAT");
    if (pat !== undefined) {
        credHandler = DevOps.getPersonalAccessTokenHandler(pat);
    } else {
        const sysToken = getRequiredVariable("SYSTEM_ACCESSTOKEN",
            "No valid authentication type found");
        credHandler = DevOps.getBearerHandler(sysToken);
    }
    const collectionUri = getRequiredVariable("SYSTEM_COLLECTIONURI");
    return await new DevOps.WebApi(collectionUri, credHandler).getGitApi();
}

export function getRequiredVariable(variable: string, errorMsg?: string): string {
    const value = getVariable(variable);
    if (value === undefined) {
        const msg = errorMsg ?? `Environment variable '${variable}' is required but no value was found`;
        throw new Error(msg);
    }
    return value;
}
