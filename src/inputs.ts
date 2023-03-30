import { getBoolInput, getInput, getInputRequired } from "azure-pipelines-task-lib";
import md5 from "md5";

export class Inputs implements IInputs {
    public get pat(): string | undefined {
        return getInput("PAT");
    }

    public get comment(): string {
        return getInputRequired("comment");
    }

    public get fileGlob(): string | undefined {
        return getInput("fileGlob");
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

    private readonly getCombinedConditionsString = (): string => {
        const fileGlob = `fileGlob:${this.fileGlob ?? ""}`;
        const commitExpr = `commitExpr:${this.commitExpr ?? ""}`;
        const targetBranch = `targetBranch:${this.targetBranch ?? ""}`;
        const sourceBranch = `sourceBranch:${this.sourceBranch ?? ""}`;
        return [
            fileGlob,
            commitExpr,
            targetBranch,
            sourceBranch
        ].join(";");
    };

    public get hashedConditions(): string {
        return md5(this.getCombinedConditionsString());
    }
}

export interface IInputs {
    readonly pat?: string
    readonly comment: string
    readonly fileGlob?: string
    readonly commitExpr?: string
    readonly targetBranch?: string
    readonly sourceBranch?: string
    readonly autoResolve?: boolean
    /**
     * Returns an MD5 hash of the combined conditional inputs
     */
    readonly hashedConditions: string
}
