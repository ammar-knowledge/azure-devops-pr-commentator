import { expect } from "chai";
import { type Inputs } from "../src/inputs";
import { Commentator } from "../src/commentator";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import sinon, { stubInterface, type StubbedInstance } from "ts-sinon";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces";
import { type IAutoCommentThread } from "../src/type-guards";

describe("Commentator", () => {
    describe("#createComment()", () => {
        it("should return the hash ID from the inputs", async() => {
            const sut = new Commentator(createStubInputs(), createStubGitApi());
            const result = await sut.createComment("foo", 7357);

            expect(result).to.equal("test hash");
        });

        it("should create new active thread when no threads exist", async() => {
            const stubGitApi = createStubGitApi();

            const sut = new Commentator(createStubInputs(), stubGitApi);
            const result = await sut.createComment("foo", 7357);

            sinon.assert.calledOnce(stubGitApi.createThread);
            sinon.assert.calledWith(stubGitApi.createThread,
                sinon.match({
                    properties: sinon.match({ hash: result }),
                    status: CommentThreadStatus.Active,
                    comments: [sinon.match({ content: "test comment" })]
                }),
                "foo",
                7357);
        });

        it("should create new active thread if the inputs hash is unique", async() => {
            const stubGitApi = createStubGitApi();
            stubGitApi.getThreads.returns(
                Promise.resolve<IAutoCommentThread[]>([{
                    id: 999,
                    properties: {
                        hash: {
                            $value: "a different hash" // different from stubbed inputs
                        }
                    },
                    comments: [{ content: "not important" }]
                }])
            );

            const sut = new Commentator(createStubInputs(), stubGitApi);
            const result = await sut.createComment("foo", 7357);

            sinon.assert.calledOnce(stubGitApi.createThread);
            sinon.assert.calledWith(stubGitApi.createThread,
                sinon.match({
                    properties: sinon.match({ hash: result }),
                    status: CommentThreadStatus.Active,
                    comments: [sinon.match({ content: "test comment" })]
                }),
                "foo",
                7357);
        });

        it("should be a no-op if a thread with the inputs hash already exist", async() => {
            const stubGitApi = createStubGitApi();
            stubGitApi.getThreads.returns(
                Promise.resolve<IAutoCommentThread[]>([{
                    id: 999,
                    properties: {
                        hash: {
                            $value: "test hash" // same as stubbed inputs
                        }
                    },
                    comments: [{ content: "not important" }]
                }])
            );

            const sut = new Commentator(createStubInputs(), stubGitApi);
            await sut.createComment("foo", 7357);

            sinon.assert.notCalled(stubGitApi.createThread);
        });

        describe("creates a thread that", () => {
            it("should contain a comment with the text from the inputs", async() => {
                const expectedContent = "expected comment contents";
                const stubInputs = createStubInputs({ comment: expectedContent });
                const stubGitApi = createStubGitApi();

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357);

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        comments: [sinon.match({ content: expectedContent })]
                    }),
                    "foo",
                    7357);
            });

            it("should contain a property with the inputs hash", async() => {
                const expectedHash = "expected hash";
                const stubInputs = createStubInputs({ hashedConditions: expectedHash });
                const stubGitApi = createStubGitApi();

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357);

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        properties: sinon.match({ hash: expectedHash })
                    }),
                    "foo",
                    7357);
            });
        });
    });
});

const createStubInputs = (override?: Partial<Inputs>): Inputs => Object.assign({
    comment: "test comment",
    fileGlob: "test glob",
    hashedConditions: "test hash",
    pat: undefined,
    commitExpr: undefined,
    targetBranch: undefined,
    sourceBranch: undefined,
    autoResolve: undefined
}, override);

function createStubGitApi(): StubbedInstance<IGitApi> {
    const stubGitApi = stubInterface<IGitApi>();
    stubGitApi.getThreads.returns(Promise.resolve([]));
    stubGitApi.createThread.returns(Promise.resolve({}));
    return stubGitApi;
}