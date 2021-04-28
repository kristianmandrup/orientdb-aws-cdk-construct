import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2"; // import ec2 library
import * as iam from "@aws-cdk/aws-iam"; // import iam library for permissions
import * as fs from "fs";

require("dotenv").config();

// See: https://dev.to/emmanuelnk/part-3-simple-ec2-instance-awesome-aws-cdk-37ia

const config = {
  env: {
    account: process.env.AWS_ACCOUNT_NUMBER,
    region: process.env.AWS_REGION,
  },
};

export class OrientDbEc2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    // its important to add our env config here otherwise CDK won't know our AWS account number
    super(scope, id, { ...props, env: config.env });

    // Get the default VPC. This is the network where your instance will be provisioned
    // All activated regions in AWS have a default vpc.
    // You can create your own of course as well. https://aws.amazon.com/vpc/
    const defaultVpc = ec2.Vpc.fromLookup(this, "VPC", { isDefault: true });

    // Lets create a role for the instance
    // You can attach permissions to a role and determine what your
    // instance can or can not do
    const role = new iam.Role(
      this,
      "orientdb-instance-role", // this is a unique id that will represent this resource in a Cloudformation template
      { assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com") }
    );

    // lets create a security group for our instance
    // A security group acts as a virtual firewall for your instance to control inbound and outbound traffic.
    const securityGroup = new ec2.SecurityGroup(this, "orientdb-instance-sg", {
      vpc: defaultVpc,
      allowAllOutbound: true, // will let your instance send outboud traffic
      securityGroupName: "orientdb-instance-sg",
    });

    // lets use the security group to allow inbound traffic on specific ports
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allows SSH access from Internet"
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allows HTTP access from Internet"
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allows HTTPS access from Internet"
    );

    // Finally lets provision our ec2 instance
    const instance = new ec2.Instance(this, "orientdb-instance", {
      vpc: defaultVpc,
      role: role,
      securityGroup: securityGroup,
      instanceName: "orientdb-instance",
      instanceType: ec2.InstanceType.of(
        // t2.micro has free tier usage in aws
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),

      keyName: "orientdb-instance-key", // we will create this in the console before we deploy
    });

    const userScript = fs.readFileSync("src/user_script.sh", "utf8");

    // add user script to instance
    // this script runs when the instance is started
    instance.addUserData(userScript);

    // cdk lets us output prperties of the resources we create after they are created
    // we want the ip address of this new instance so we can ssh into it later
    new cdk.CfnOutput(this, "orientdb-instance-output", {
      value: instance.instancePublicIp,
    });
  }
}
