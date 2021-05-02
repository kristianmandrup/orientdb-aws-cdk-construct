import { createTcpIp } from "./hazelcast";

describe("hazelcast", () => {
  describe("createGroup", () => {
    describe("no args", () => {
      let obj;
      beforeEach(() => {
        obj = createTcpIp();
      });
      it("is enabled by default", () => {
        expect(obj._attrs.enabled).toBeTruthy();
      });

      it("no members content when no members passed", () => {
        expect(obj._content).toBeUndefined();
      });
    });

    describe("enabled arg", () => {
      it("is enabled when passed enabled:true", () => {
        const obj = createTcpIp();
        expect(obj._attrs.enabled).toBeTruthy();
      });

      it("is not enabled when passed enabled:false", () => {
        const obj = createTcpIp({ enabled: false });
        expect(obj._attrs.enabled).toBeFalsy();
      });

      it("is not enabled when passed enabled:false", () => {
        const obj = createTcpIp({ enabled: false });
        expect(obj._attrs.enabled).toBeFalsy();
      });
    });

    describe("members arg", () => {
      it("members content when members list passed", () => {
        const obj = createTcpIp({ members: ["x"] });
        expect(obj._content).toContain("x");
      });
    });
  });
});
