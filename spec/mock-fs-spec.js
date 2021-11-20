var optimize = require("../optimize");
var MockFs = require("montage/core/promise-io/fs-mock");

describe("Mock FS", function () {
    var mockFs;
    beforeEach(function () {
        mockFs = MockFs({
            "package.json": JSON.stringify({name: "mock"}, null, 4)
        });
    });

    it("should work", function (done) {
        optimize("/", {
            fs: mockFs,
            out: {} // disable console output
        })
        .then(function () {
            return mockFs.list("/builds");
        })
        .then(function (list) {
            const id = /[^@]*$/.exec(list[1])[0];
            return mockFs.read("/builds/" + list[1] + "/" + id + "/package.json.load.js");
        })
        .then(function (content) {
            expect(content.indexOf("montageDefine(")).toBe(0);
        })
        .then(done, done);
    });

    it("returns the build path", function (done) {
        optimize("/", {
            fs: mockFs,
            out: {} // disable console output
        })
        .then(function (path) {
            expect(path).toMatch(/^\/builds\/mock@[0-9a-f]{7}$/);
        })
        .then(done, done);
    });
});
