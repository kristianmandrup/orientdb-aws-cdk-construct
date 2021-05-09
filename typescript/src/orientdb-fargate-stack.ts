import { Construct, RemovalPolicy, Stack } from "@aws-cdk/core";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ec2 from "@aws-cdk/aws-ec2";
import { LogDriver } from "@aws-cdk/aws-ecs";
import { Peer, Port, SecurityGroup, SubnetType } from "@aws-cdk/aws-ec2";
import * as logs from "@aws-cdk/aws-logs";

/**
 * This stack contains an ECS cluster/service with OrientDb inside
 */
export class HazelcastAWS extends Stack {
  readonly clusterName: string;
  readonly cloudNamespace: string;
  readonly vpcName: string;
  readonly taskDefName: string;
  readonly containerName: string;
  readonly logGroupName: string;
  readonly containerRegistryImageName: string;

  readonly desiredCount: number;
  readonly cpu: number;
  readonly memoryLimit: number;

  readonly ecsService: ecs.FargateService;
  readonly cluster: ecs.Cluster;
  readonly taskDefinition: ecs.TaskDefinition;
  readonly securityGroup: SecurityGroup;
  readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: any = {}) {
    super(scope, id, props);
    const name = props.name || "OrientDB";
    const clusterName = props.clusterName || `${name}Cluster`;
    const cloudNamespace = props.cloudNamespace;
    const vpcName = props.vpcName || `${name}VPC`;
    const vpc = props.vpc || new ec2.Vpc(this, vpcName);
    const desiredCount = props.desiredCount || 3;
    const taskDefName = props.taskDefName || `${name}TaskDef`;
    const cpu = props.cpu || 512;
    const memoryLimit = props.memoryLimit || 1024;
    const containerName = props.containerName || `${name}Container`;
    const logGroupName = props.logGroupName || `${name}LogGroup`;
    const containerRegistryImageName =
      props.containerRegistryImageName || "orientdb:3.1.11-tp3";
    const streamPrefix = props.streamPrefix || "OrientDb";

    this.vpcName = vpcName;
    this.clusterName = clusterName;
    this.cloudNamespace = cloudNamespace;

    const defaultCloudMapNamespace = this.cloudNamespace && {
      name: this.cloudNamespace,
      vpc,
    };

    const clusterConfig: any = {
      vpc,
      clusterName: this.clusterName,
    };

    if (defaultCloudMapNamespace) {
      clusterConfig.defaultCloudMapNamespace = defaultCloudMapNamespace;
    }

    // Create an ECS cluster
    const cluster =
      props.cluster || new ecs.Cluster(this, clusterName, clusterConfig);

    this.cluster = cluster;

    const taskDefConfig: any = {
      cpu,
      memoryLimitMiB: memoryLimit,
    };

    const ecsTaskRole = props.ecsTaskRole;
    const ecsExecRole = props.ecsExecRole;

    if (ecsTaskRole) {
      taskDefConfig.ecsTaskRole = ecsTaskRole;
    }
    if (ecsExecRole) {
      taskDefConfig.ecsExecRole = ecsExecRole;
    }

    // had problem when reducing the memory to less than 2 Gig
    const taskDefinition =
      props.taskDefinition ||
      new ecs.FargateTaskDefinition(this, taskDefName, taskDefConfig);

    this.taskDefinition = taskDefinition;

    // i hate CDK auto created logGroupNames, so i define my own LogGroup
    // also i hate not having Renetation days set to minimal
    const logGroup =
      props.logGroup ||
      new logs.LogGroup(this, logGroupName, {
        retention: logs.RetentionDays.FIVE_DAYS,
        logGroupName,
        removalPolicy: RemovalPolicy.DESTROY,
      });

    this.logGroup = logGroup;

    // Default: OrientDb 3.1.11 with Apache Tinkerpop 3
    const registryImage =
      containerRegistryImageName &&
      ecs.ContainerImage.fromRegistry(containerRegistryImageName);

    const ecrImage =
      props.ecrImage && ecs.ContainerImage.fromEcrRepository(props.ecrImage);

    const assetImage =
      props.assetImagePath &&
      ecs.ContainerImage.fromAsset(props.assetImagePath);

    const image = props.image || assetImage || ecrImage || registryImage;

    taskDefinition.addContainer(containerName, {
      image,
      logging: LogDriver.awsLogs({
        logGroup,
        streamPrefix,
      }),
    });

    taskDefinition
      .addPortMappings({
        containerPort: 5701, // hazelcast
      })
      .addPortMappings({
        containerPort: 2424, // orientdb
      });

    const securityGroupName = props.securityGroupName || `${name}SecGroup`;

    // we define our security group here and allow incoming ICMP (i am old school) and 3301 for OrientDb
    const securityGroup = new SecurityGroup(this, securityGroupName, {
      vpc,
      securityGroupName,
      description: "OrientDb Security Group",
      allowAllOutbound: true, // Can be set to false
    });

    this.securityGroup = securityGroup;

    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(5701),
      "allow access to port 5701 - hazelcast"
    );

    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(2424),
      "allow access to port 2424 - orientdb"
    );

    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.icmpPing(),
      "Allow ICMP Ping"
    );

    const serviceName = props.serviceName || `${name}Service`;
    const cloudMapOptionsName = props.cloudMapOptionsName || "OrientDb";
    const availabilityZones = props.availabilityZones;

    // Instantiate an Amazon ECS Service
    const ecsService = new ecs.FargateService(this, serviceName, {
      cluster,
      desiredCount,
      taskDefinition,
      securityGroups: [securityGroup],
      serviceName,
      cloudMapOptions: {
        name: cloudMapOptionsName,
      },
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE,
        availabilityZones,
      },
    });

    this.ecsService = ecsService;
  }
}
