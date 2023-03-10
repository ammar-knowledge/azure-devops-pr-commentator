import { getBoolInput, getInput, getInputRequired } from "azure-pipelines-task-lib";
import md5 from "md5";

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

    /** Returns an MD5 hash of the combined conditional inputs */
    public get hashedConditions(): string {
        const combinedConditions =
            (this.fileGlob ?? "") +
            (this.commitExpr ?? "") +
            (this.targetBranch ?? "") +
            (this.sourceBranch ?? "");
        return md5(combinedConditions);
    }
}
