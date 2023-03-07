import { type IGitApi } from "azure-devops-node-api/GitApi";
import type * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { minimatch } from "minimatch";
import { type Inputs } from "../inputs";
import { hasId } from "../type-guards";
import { type IValidationResult, type IValidator } from "./validator";

export class FileGlobValidator implements IValidator {
    constructor(
        private readonly client: IGitApi,
        private readonly inputs: Inputs
    ) { }

    public readonly check = async(repositoryId: string, prId: number): Promise<IValidationResult> => {
        const matchingChange = await this.getFirstMatchingChange(repositoryId, prId);
        if (matchingChange !== undefined) {
            return {
                conditionMet: true,
                context: {
                    files: [matchingChange.item?.path ?? ""]
                }
            };
        }

        return { conditionMet: false };
    };

    private readonly getFirstMatchingChange = async(repositoryId: string, prId: number): Promise<GitInterfaces.GitPullRequestChange | undefined> => {
        const lastIterationId = await this.getLastIterationId(repositoryId, prId);
        let changes: GitInterfaces.GitPullRequestIterationChanges;
        let matchingChange: GitInterfaces.GitPullRequestChange | undefined;
        do {
            changes = await this.client.getPullRequestIterationChanges(repositoryId, prId, lastIterationId);
            matchingChange = changes.changeEntries?.find(
                entry => minimatch(entry.item?.path ?? "", this.inputs.fileGlob));
        } while (matchingChange === undefined && changes.nextTop !== undefined && changes.nextTop > 0);
        return matchingChange;
    };

    private readonly getLastIterationId = async(repositoryId: string, prId: number): Promise<number> => {
        const iterations = await this.client.getPullRequestIterations(repositoryId, prId);
        return iterations
            .filter(hasId)
            .sort((i1, i2) => i1.id - i2.id)
            .slice(-1)[0].id;
    };
}
