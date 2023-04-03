import { expect } from "chai";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import sinon, { stubInterface, type StubbedInstance } from "ts-sinon";
import { type FileGlobValidator } from "../../src/validators/file-glob-validator";
import { type GitPullRequestIterationChanges } from "azure-devops-node-api/interfaces/GitInterfaces";
import { createStubInputs } from "../stub-helper";
import { type IInputs } from "../../src/inputs";
import { instantiate, clear, rewireAll, resetStubs, setMinimatchStub } from "../rewire";

describe("FileGlobValidator", () => {
    before(rewireAll);
    after(clear);
    beforeEach(resetStubs);

    const createSut = async(apiClient: IGitApi, inputs: IInputs): Promise<FileGlobValidator> =>
        await instantiate(async(): Promise<FileGlobValidator> => {
            const constructor = (await import("../../src/validators/file-glob-validator")).FileGlobValidator;
            return new constructor(apiClient, inputs);
        });

    describe("#check()", () => {
        it("should succeed when inputs contain no fileGlob", async() => {
            const stubInputs = createStubInputs({ fileGlob: undefined });
            const stubApiClient = createStubGitApi();
            const sut = await createSut(stubApiClient, stubInputs);

            const result = await sut.check("foo", 7357);

            expect(result.conditionMet).is.true;
            expect(result.context).is.undefined;
        });

        it("should succeed when fileGlob matches one file", async() => {
            const fileGlob = "/foo/bar.txt";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((path: string, _: string) => path === fileGlob);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs);

            const result = await sut.check("foo", 7357);

            expect(result.conditionMet).is.true;
            expect(result.context?.files).to.have.members([fileGlob]);
        });

        it("should succeed when fileGlob matches one file on second page of changes", async() => {
            const fileGlob = "/baz/qux.txt";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            stubApiClient.getPullRequestIterationChanges
                .onSecondCall().resolves(pageTwoIterationChanges());
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((path: string, _: string) => path === fileGlob);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs);

            const result = await sut.check("foo", 7357);

            expect(result.conditionMet).is.true;
            expect(result.context?.files).to.have.members([fileGlob]);
            sinon.assert.calledTwice(stubApiClient.getPullRequestIterationChanges);
        });

        it("should succeed when fileGlob matches multiple files on multiple pages", async() => {
            const fileGlob = "/**/*";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            stubApiClient.getPullRequestIterationChanges
                .onSecondCall().resolves(pageTwoIterationChanges());
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((_: string, __: string) => true);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs);

            const result = await sut.check("foo", 7357);

            expect(result.conditionMet).is.true;
            expect(result.context?.files).to.have.members(["/foo/bar.txt", "/baz/qux.txt"]);
            sinon.assert.calledTwice(stubApiClient.getPullRequestIterationChanges);
        });

        it("should fail when fileGlob matches no files", async() => {
            const fileGlob = "/match/nothing";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            stubApiClient.getPullRequestIterationChanges
                .onSecondCall().resolves(pageTwoIterationChanges());
            const sut = await createSut(stubApiClient, stubInputs);

            const result = await sut.check("foo", 7357);

            expect(result.conditionMet).is.false;
            expect(result.context).is.undefined;
            sinon.assert.calledTwice(stubApiClient.getPullRequestIterationChanges);
        });
    });
});

function createStubGitApi(): StubbedInstance<IGitApi> {
    const stubGitApi = stubInterface<IGitApi>();
    stubGitApi.getPullRequestIterations
        .resolves([{ id: 1 }]);
    stubGitApi.getPullRequestIterationChanges
        .onFirstCall().resolves(pageOneIterationChanges())
        .onSecondCall().resolves({});
    return stubGitApi;
}

const pageOneIterationChanges = (): GitPullRequestIterationChanges => ({
    changeEntries: [
        {
            changeId: 1,
            item: {
                path: "/foo/bar.txt"
            }
        }
    ],
    nextSkip: 1,
    nextTop: 1
});

const pageTwoIterationChanges = (): GitPullRequestIterationChanges => ({
    changeEntries: [
        {
            changeId: 2,
            item: {
                path: "/baz/qux.txt"
            }
        }
    ]
});
