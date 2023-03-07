import { setResult, TaskResult } from "azure-pipelines-task-lib/task";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import { createGitClient } from "./azure-helpers";
import { Inputs } from "./inputs";
import { Variables } from "./variables";
import { validateAll } from "./validators/validator";

class TaskRunner {
    private readonly repoId: string;
    private readonly prId: number;

    constructor(
        private readonly client: IGitApi,
        private readonly inputs: Inputs,
        vars: Variables
    ) {
        this.repoId = vars.repositoryId;
        this.prId = vars.pullRequestId;
    }

    public run = async(): Promise<void> => {
        try {
            let resultMessage = "No comment added";

            const result = await validateAll(this.client, this.inputs, this.repoId, this.prId);

            if (result.conditionMet) {
                await this.createThread();
                resultMessage = "One comment was added";
            }

            setResult(TaskResult.Succeeded, resultMessage);
        } catch (err: any) {
            console.error(err, err.stack);
            setResult(TaskResult.Failed, err.message);
        }
    };

    private readonly createThread = async(): Promise<void> => {
        const thread: GitInterfaces.GitPullRequestCommentThread = {
            comments: [{
                content: this.inputs.comment,
                commentType: GitInterfaces.CommentType.System
            }],
            status: GitInterfaces.CommentThreadStatus.Active
        };

        await this.client.createThread(thread, this.repoId, this.prId);
    };
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async function() {
    const inputs = new Inputs();
    const vars = new Variables();
    const client = await createGitClient(inputs, vars);
    const runner = new TaskRunner(client, inputs, vars);
    await runner.run();
})();
