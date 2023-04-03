import { type IGitApi } from "azure-devops-node-api/GitApi";
import type * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { minimatch } from "minimatch";
import { type IInputs } from "../inputs";
import { hasId } from "../type-guards";
import { type IValidationResult, type IValidator } from "./validator";

export class FileGlobValidator implements IValidator {
    constructor(
        private readonly client: IGitApi,
        private readonly inputs: IInputs
    ) { }

    public readonly check = async(repositoryId: string, prId: number): Promise<IValidationResult> => {
        if (this.inputs.fileGlob === undefined) {
            return { conditionMet: true };
        }

        const matchingChanges = await this.getMatchingChanges(repositoryId, prId, this.inputs.fileGlob);
        if (matchingChanges.length > 0) {
            console.log("Found the following matches for the glob expression:\n    " +
                matchingChanges.map(c => c.item?.path).join("\n    "));
            return {
                conditionMet: true,
                context: {
                    files: matchingChanges.map(change => change.item?.path ?? "")
                }
            };
        }

        console.log("No match found for the glob expression");
        return { conditionMet: false };
    };

    private readonly getMatchingChanges = async(repositoryId: string, prId: number, fileGlob: string): Promise<GitInterfaces.GitPullRequestChange[]> => {
        const lastIterationId = await this.getLastIterationId(repositoryId, prId);
        let changes: GitInterfaces.GitPullRequestIterationChanges | undefined;
        const matchingChanges: GitInterfaces.GitPullRequestChange[] = [];
        const matchesGlob = (changeEntry: GitInterfaces.GitPullRequestChange): boolean =>
            minimatch(changeEntry.item?.path ?? "", fileGlob);

        do {
            changes = await this.client.getPullRequestIterationChanges(
                repositoryId,
                prId,
                lastIterationId,
                undefined,
                changes?.nextTop,
                changes?.nextSkip);

            const matches = changes.changeEntries?.filter(matchesGlob) ?? [];
            matchingChanges.push(...matches);
        } while (changes.nextTop !== undefined && changes.nextTop > 0);

        return matchingChanges;
    };

    private readonly getLastIterationId = async(repositoryId: string, prId: number): Promise<number> => {
        const iterations = await this.client.getPullRequestIterations(repositoryId, prId);
        return iterations
            .filter(hasId)
            .sort((i1, i2) => i1.id - i2.id)
            .slice(-1)[0].id;
    };
}
