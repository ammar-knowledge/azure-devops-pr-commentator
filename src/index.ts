import { getInput, getInputRequired, getVariable, setResult, TaskResult } from "azure-pipelines-task-lib/task";
import * as DevOps from "azure-devops-node-api";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { minimatch } from "minimatch";

class TaskRunner {
    public run = async(): Promise<void> => {
        try {
            const client = await createGitClient();

            const repoId = getRequiredVariable("BUILD_REPOSITORY_ID");
            const prId = parseInt(getRequiredVariable("SYSTEM_PULLREQUEST_PULLREQUESTID"));
            const comment = getInputRequired("comment");
            const filePattern = getInputRequired("filePattern");

            const iterations = await client.getPullRequestIterations(repoId, prId);
            const lastIterationId = iterations
                .sort((i1, i2) => (i1.id ?? 0) - (i2.id ?? 0))
                .slice(-1)[0].id ?? 0;
            let changes: GitInterfaces.GitPullRequestIterationChanges;
            let matchingChange: GitInterfaces.GitPullRequestChange | undefined;
            do {
                changes = await client.getPullRequestIterationChanges(repoId, prId, lastIterationId);
                matchingChange = changes.changeEntries?.find(
                    entry => minimatch(entry.item?.path ?? "", filePattern));
            } while (matchingChange === undefined && changes.nextTop !== undefined && changes.nextTop > 0);

            if (matchingChange !== undefined) {
                const thread: GitInterfaces.GitPullRequestCommentThread = {
                    comments: [{
                        content: comment,
                        commentType: GitInterfaces.CommentType.System
                    }],
                    status: GitInterfaces.CommentThreadStatus.Active
                };
                await client.createThread(thread, repoId, prId);

                setResult(TaskResult.Succeeded, "One comment was added");
                return;
            }
            setResult(TaskResult.Succeeded, "No comment added");
            return;
        } catch (err: any) {
            console.error(err, err.stack);
            setResult(TaskResult.Failed, err.message);
        }
    };
}

async function createGitClient(): Promise<IGitApi> {
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

function getRequiredVariable(variable: string, errorMsg?: string): string {
    const value = getVariable(variable);
    if (value === undefined) {
        const msg = errorMsg ?? `Environment variable '${variable}' is required but no value was found`;
        throw new Error(msg);
    }
    return value;
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
new TaskRunner().run();
