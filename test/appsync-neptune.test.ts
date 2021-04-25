import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import { AppsyncOrientDbStack } from "../lib/appsync-orientdb-stack";

test("Empty Stack", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new AppsyncOrientDbStack(app, "MyTestStack");
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  );
});
