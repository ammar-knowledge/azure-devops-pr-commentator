import { type IGitApi } from "azure-devops-node-api/GitApi";
import { type Inputs } from "../inputs";
import { FileGlobValidator } from "./file-glob-validator";

export interface IValidator {
    /**
     * Validates a specific condition usually identified by one of the task inputs.
     * @param repositoryId The ID of the repository which the {@link prId} belongs to.
     * @param prId The ID of the pull request to validate.
     * @returns An {@link IValidationResult} indicating if the condition in this validator was met.
     */
    check: (repositoryId: string, prId: number) => Promise<IValidationResult>
}

export interface IValidationResult {
    /** True, if the validated condition was met, otherwise false. */
    conditionMet: boolean
    /** Additional context for the condition that was validated, such as files that matched the condition. */
    context?: IResultContext
}

export interface IResultContext {
    /** A list of file paths that matched the condition of the {@link IValidationResult}. */
    files?: string[]
    /** A list of commits that matched the condition of the {@link IValidationResult}. */
    commits?: string[]
}

/**
 * Validates all conditions specified in the task inputs.
 * @param client Azure DevOps client to access the git API.
 * @param inputs Inputs for the current task.
 * @param repositoryId The ID of the repository which the {@link prId} belongs to.
 * @param prId The ID of the pull request to validate.
 * @returns An {@link IValidationResult} indicating if all conditions for creating a comment were met.
 */
export async function validateAll(client: IGitApi, inputs: Inputs, repositoryId: string, prId: number): Promise<IValidationResult> {
    return await new FileGlobValidator(client, inputs).check(repositoryId, prId);
}
