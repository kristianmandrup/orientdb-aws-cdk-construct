import * as cdk from "@aws-cdk/core";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";
import * as logs from "@aws-cdk/aws-logs";
import * as iam from "@aws-cdk/aws-iam";

const { RemovalPolicy } = cdk;
const { LogDriver } = ecs;
const { Peer, Port, SecurityGroup, SubnetType } = ec2;

/**
 * This stack contains an ECS cluster/service with OrientDb inside
 */
export class HazelcastAWS extends cdk.Stack {
  name: string;

  vpc: ec2.Vpc;
  image: ecs.ContainerImage;
  ecsService: ecs.FargateService;
  cluster: ecs.Cluster;
  taskDefinition: any; // ecs.FargateTaskDefinition;
  securityGroup: ec2.SecurityGroup;
  logGroup: logs.LogGroup;
  elb: elbv2.ApplicationLoadBalancer;
  httpVpcLink: cdk.CfnResource;

  constructor(scope: cdk.Construct, id: string, props: any = {}) {
    super(scope, id, props);
    this.setName(props);
    this.setOrCreateVpc(props);
    this.createCluster(props);

    this.createLogGroup(props);
    this.createTaskDefinition(props);
    this.createSecurityGroup(props);
    this.createService(props);
  }

  setName(props) {
    this.name = props.name || "OrientDB";
  }

  setOrCreateVpc(props) {
    const vpcName = props.vpcName || `${this.name}VPC`;
    const vpc = props.vpc || new ec2.Vpc(this, vpcName);
    this.vpc = vpc;
  }

  createCluster(props) {
    const vpc = this.vpc;
    const clusterName = props.clusterName || `${this.name}Cluster`;
    const clusterConfig: any = {
      vpc,
      clusterName,
    };
    const cloudNamespace = props.cloudNamespace;

    const defaultCloudMapNamespace = cloudNamespace && {
      name: cloudNamespace,
      vpc,
    };

    if (defaultCloudMapNamespace) {
      clusterConfig.defaultCloudMapNamespace = defaultCloudMapNamespace;
    }

    // Create an ECS cluster
    const cluster =
      props.cluster || new ecs.Cluster(this, clusterName, clusterConfig);

    this.cluster = cluster;
  }

  get defaultImageName() {
    return "orientdb:3.1.11-tp3";
  }

  createImage(props) {
    const containerRegistryImageName =
      props.containerRegistryImageName || this.defaultImageName;

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
    this.image = image;
  }

  createTaskDefinition(props) {
    const taskDefName = props.taskDefName || `${this.name}TaskDef`;
    const cpu = props.cpu || 512;
    const memoryLimit = props.memoryLimit || 1024;

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
    const streamPrefix = props.streamPrefix || "OrientDb";

    // had problem when reducing the memory to less than 2 Gig
    const taskDefinition =
      props.taskDefinition ||
      new ecs.FargateTaskDefinition(this, taskDefName, taskDefConfig);

    const containerName = props.containerName || `${this.name}Container`;

    taskDefinition.addContainer(containerName, {
      image: this.image,
      logging: LogDriver.awsLogs({
        logGroup: this.logGroup,
        streamPrefix,
      }),
    });

    this.taskDefinition = taskDefinition;
  }

  createSecurityGroup(props) {
    const securityGroupName = props.securityGroupName || `${this.name}SecGroup`;

    // we define our security group here and allow incoming ICMP (i am old school) and 3301 for OrientDb
    const securityGroup = new SecurityGroup(this, securityGroupName, {
      vpc: this.vpc,
      securityGroupName,
      description: "OrientDb Security Group",
      allowAllOutbound: true, // Can be set to false
    });

    this.securityGroup = securityGroup;
    this.addIngressRules(props);
  }

  addIngressRules(props) {
    const { securityGroup } = this;
    let { hazelcast, orientdb } = props.ingress || {};
    if (hazelcast !== false) {
      hazelcast ||= 5701;
      securityGroup.addIngressRule(
        Peer.anyIpv4(),
        Port.tcp(hazelcast || 5701),
        `allow access to port ${hazelcast} - hazelcast`
      );
    }
    if (orientdb !== false) {
      orientdb ||= 5701;
      securityGroup.addIngressRule(
        Peer.anyIpv4(),
        Port.tcp(2424),
        `allow access to port ${orientdb} - orientdb`
      );
    }

    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.icmpPing(),
      "Allow ICMP Ping"
    );
  }

  createLogGroup(props) {
    // i hate CDK auto created logGroupNames, so i define my own LogGroup
    // also i hate not having Renetation days set to minimal
    const logGroupName = props.logGroupName || `${this.name}LogGroup`;
    const logGroup =
      props.logGroup ||
      new logs.LogGroup(this, logGroupName, {
        retention: props.retention || logs.RetentionDays.FIVE_DAYS,
        logGroupName,
        removalPolicy: props.removalPolicy || RemovalPolicy.DESTROY,
      });

    this.logGroup = logGroup;
  }

  createService(props) {
    const serviceName = props.serviceName || `${this.name}Service`;
    const cloudMapOptionsName = props.cloudMapOptionsName || "OrientDb";
    const availabilityZones = props.availabilityZones;
    const desiredCount = props.desiredCount || 3;

    // Instantiate an Amazon ECS Service
    const ecsService = new ecs.FargateService(this, serviceName, {
      cluster: this.cluster,
      desiredCount,
      taskDefinition: this.taskDefinition,
      securityGroups: [this.securityGroup],
      serviceName,
      cloudMapOptions: {
        name: cloudMapOptionsName,
      },
      vpcSubnets: {
        subnetType: props.subnetType || SubnetType.PRIVATE,
        availabilityZones,
      },
    });

    this.ecsService = ecsService;
  }

  createLoadBalancer(name) {
    this.elb = new elbv2.ApplicationLoadBalancer(this, name, {
      vpc: this.vpc,
      internetFacing: false,
    });
  }

  addApiListener(loadBalancer, name) {
    loadBalancer.addListener(name, {
      port: 80,
      // Default Target Group
      defaultAction: elbv2.ListenerAction.fixedResponse(200),
    });
  }

  addServiceTargetGroup(
    apiListener,
    name,
    targets,
    path,
    priority,
    opts: any = {}
  ) {
    const healthCheck = opts.healthCheck || {
      path: `${path}/health`,
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(3),
    };

    apiListener.addTargets(name, {
      port: 80,
      priority,
      healthCheck,
      targets: targets,
      pathPattern: `${path}*`,
      ...opts,
    });
  }

  // see also roles.ts
  buildTaskRole(execution: boolean): iam.Role {
    const taskRole = new iam.Role(this, "ecsTaskExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    if (!execution) return taskRole;

    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonECSTaskExecutionRolePolicy"
      )
    );
    return taskRole;
  }

  createHttpVpcLink(name?: string) {
    this.httpVpcLink = new cdk.CfnResource(this, name || "HttpVpcLink", {
      type: "AWS::ApiGatewayV2::VpcLink",
      properties: {
        Name: "http-api-vpclink",
        SubnetIds: this.vpc.privateSubnets.map((m) => m.subnetId),
      },
    });
  }
}
