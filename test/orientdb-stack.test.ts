import { expect as expectCDK, haveResourceLike } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as OrientDb from "../lib/orientdb-ec2-stack";

test("Check OrientDbClusterStack and SSH KeyName", () => {
  const app = new cdk.App();
  const stack = new OrientDb.OrientDbEc2Stack(app, "MyOrientDbTestEc2Stack");

  expectCDK(stack).to(
    haveResourceLike("AWS::EC2::Instance", {
      InstanceType: "t2.micro",
      KeyName: "orientdb-instance-1-key",
    })
  );
});
