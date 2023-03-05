import { getInputRequired, setResult, TaskResult } from "azure-pipelines-task-lib/task";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import { minimatch } from "minimatch";
import { createGitClient, getRequiredVariable } from "./azure-helpers";
import { hasId } from "./type-guards";

class TaskRunner {
    private readonly repoId: string;
    private readonly prId: number;
    private readonly comment: string;
    private readonly filePattern: string;

    constructor(private readonly client: IGitApi) {
        this.repoId = getRequiredVariable("BUILD_REPOSITORY_ID");
        this.prId = parseInt(getRequiredVariable("SYSTEM_PULLREQUEST_PULLREQUESTID"));
        this.comment = getInputRequired("comment");
        this.filePattern = getInputRequired("fileGlob");
    }

    public run = async(): Promise<void> => {
        try {
            let resultMessage = "No comment added";

            const matchingChange = await this.getFirstMatchingChange();
            if (matchingChange !== undefined) {
                await this.createThread();
                resultMessage = "One comment was added";
            }

            setResult(TaskResult.Succeeded, resultMessage);
        } catch (err: any) {
            console.error(err, err.stack);
            setResult(TaskResult.Failed, err.message);
        }
    };

    private readonly getLastIterationId = async(): Promise<number> => {
        const iterations = await this.client.getPullRequestIterations(this.repoId, this.prId);
        return iterations
            .filter(hasId)
            .sort((i1, i2) => i1.id - i2.id)
            .slice(-1)[0].id;
    };

    private readonly getFirstMatchingChange = async(): Promise<GitInterfaces.GitPullRequestChange | undefined> => {
        const lastIterationId = await this.getLastIterationId();
        let changes: GitInterfaces.GitPullRequestIterationChanges;
        let matchingChange: GitInterfaces.GitPullRequestChange | undefined;
        do {
            changes = await this.client.getPullRequestIterationChanges(this.repoId, this.prId, lastIterationId);
            matchingChange = changes.changeEntries?.find(
                entry => minimatch(entry.item?.path ?? "", this.filePattern));
        } while (matchingChange === undefined && changes.nextTop !== undefined && changes.nextTop > 0);
        return matchingChange;
    };

    private readonly createThread = async(): Promise<void> => {
        const thread: GitInterfaces.GitPullRequestCommentThread = {
            comments: [{
                content: this.comment,
                commentType: GitInterfaces.CommentType.System
            }],
            status: GitInterfaces.CommentThreadStatus.Active
        };

        await this.client.createThread(thread, this.repoId, this.prId);
    };
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async function() {
    const runner = new TaskRunner(await createGitClient());
    await runner.run();
})();
