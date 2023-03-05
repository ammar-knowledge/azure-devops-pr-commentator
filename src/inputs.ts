import { getBoolInput, getInput, getInputRequired } from "azure-pipelines-task-lib";

export class Inputs {
    public get pat(): string | undefined {
        return getInput("PAT");
    }

    public get comment(): string {
        return getInputRequired("comment");
    }

    public get fileGlob(): string {
        return getInputRequired("fileGlob");
    }

    public get commitExpr(): string | undefined {
        return getInput("commitExpr");
    }

    public get targetBranch(): string | undefined {
        return getInput("targetBranch");
    }

    public get sourceBranch(): string | undefined {
        return getInput("sourceBranch");
    }

    public get autoResolve(): boolean | undefined {
        return getBoolInput("autoResolve");
    }
}
