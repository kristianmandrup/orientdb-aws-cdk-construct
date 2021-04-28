import { Construct, RemovalPolicy, Stack } from "@aws-cdk/core";
import * as ecs from "@aws-cdk/aws-ecs";
import { LogDriver } from "@aws-cdk/aws-ecs";
import { Peer, Port, SecurityGroup, SubnetType } from "@aws-cdk/aws-ec2";
import * as logs from "@aws-cdk/aws-logs";

/**
 * This stack contains an ECS cluster/service with OrientDb inside
 */
export class OrientDbStack extends Stack {
  stackName: any;

  constructor(scope: Construct, id: string, props: any = {}) {
    super(scope, id, props);
    this.stackName = props.stackName;

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, "OrientDbCluster", {
      vpc: props.vpc,
      clusterName: this.stackName || "OrientDbClusterStack",
      defaultCloudMapNamespace: {
        name: "example.com",
        vpc: props.vpc,
      },
    });

    // had problem when reducing the memory to less than 2 Gig
    const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDef", {
      cpu: 512,
      memoryLimitMiB: 2048,
    });

    // i hate CDK auto created logGroupNames, so i define my own LogGroup
    // also i hate not having Renetation days set to minimal
    const logGroup = new logs.LogGroup(this, "OrientDbLogGroup", {
      retention: logs.RetentionDays.FIVE_DAYS,
      logGroupName: `OrientDbLogGroup`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    taskDefinition
      .addContainer("OrientDbContainer", {
        // OrientDb 3.1.11 with Apache Tinkerpop 3
        image: ecs.ContainerImage.fromRegistry("orientdb:3.1.11-tp3"),
        logging: LogDriver.awsLogs({
          logGroup: logGroup,
          streamPrefix: "OrientDb",
        }),
      })
      .addPortMappings({
        containerPort: 2424,
      });

    // we define our security group here and allow incoming ICMP (i am old school) and 3301 for OrientDb
    const OrientDbSecGroup = new SecurityGroup(this, "OrientDbSecGroup", {
      vpc: props.vpc,
      securityGroupName: "OrientDbSecurityGroup",
      description: "OrientDb Security Group",
      allowAllOutbound: true, // Can be set to false
    });
    OrientDbSecGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(2424),
      "allow access to port 2424"
    );
    OrientDbSecGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.icmpPing(),
      "Allow ICMP Ping"
    );

    // Instantiate an Amazon ECS Service
    const ecsService = new ecs.FargateService(this, "Service", {
      cluster,
      taskDefinition,
      securityGroups: [OrientDbSecGroup],
      serviceName: "OrientDbService",
      cloudMapOptions: {
        name: "OrientDb",
      },
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE,
        //availabilityZones: ["eu-central-1b"]
      },
    });
  }
}
