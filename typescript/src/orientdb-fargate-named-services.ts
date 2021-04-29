import * as cdk from "@aws-cdk/core";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
// import * as ecr from "@aws-cdk/aws-ecr";
import * as iam from "@aws-cdk/aws-iam";
// import * as logs from "@aws-cdk/aws-logs";
// import * as apig from "@aws-cdk/aws-apigatewayv2";
import * as servicediscovery from "@aws-cdk/aws-servicediscovery";

export class FargateVpclinkStack extends cdk.Stack {
  //Export Vpclink and ALB Listener
  public readonly httpVpcLink: cdk.CfnResource;
  public readonly httpApiListener: elbv2.ApplicationListener;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "OrientVPC");

    const cluster = new ecs.Cluster(this, "Orient Cluster", {
      vpc: vpc,
    });

    const dnsNamespace = new servicediscovery.PrivateDnsNamespace(
      this,
      "DnsNamespace",
      {
        name: "http-api.local",
        vpc: vpc,
        description: "Private DnsNamespace for Microservices",
      }
    );

    const taskrole = new iam.Role(this, "ecsTaskExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    taskrole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonECSTaskExecutionRolePolicy"
      )
    );

    const createFargateTaskDefinition = (name, opts = {}) =>
      new ecs.FargateTaskDefinition(this, name, {
        memoryLimitMiB: 512,
        cpu: 256,
        taskRole: taskrole,
        ...opts,
      });

    const bookServiceTaskDefinition = createFargateTaskDefinition(
      "bookServiceTaskDef"
    );
    const authorServiceTaskDefinition = createFargateTaskDefinition(
      "authorServiceTaskDef"
    );

    const createSecurityGroup = (name, opts = {}) => {
      const secGrp = new ec2.SecurityGroup(this, name, {
        allowAllOutbound: true,
        securityGroupName: name,
        vpc: vpc,
        ...opts,
      });
      secGrp.connections.allowFromAnyIpv4(ec2.Port.tcp(80));
      return secGrp;
    };

    const bookServiceSecGrp = createSecurityGroup("bookServiceSecurityGroup");
    const authorServiceSecGrp = createSecurityGroup(
      "authorServiceSecurityGroup"
    );

    const createService = (name, securityGrp, opts = {}) =>
      new ecs.FargateService(this, name, {
        cluster: cluster,
        taskDefinition: bookServiceTaskDefinition,
        assignPublicIp: false,
        desiredCount: 2,
        securityGroup: bookServiceSecGrp,
        cloudMapOptions: {
          name,
        },
        ...opts,
      });

    const bookService = createService("bookService", bookServiceSecGrp);
    const authorService = createService("authorService", authorServiceSecGrp);

    const createLoadBalancer = (name) =>
      new elbv2.ApplicationLoadBalancer(this, name, {
        vpc: vpc,
        internetFacing: false,
      });

    const addApiListener = (httpapiInternalALB, name) =>
      httpapiInternalALB.addListener(name, {
        port: 80,
        // Default Target Group
        defaultAction: elbv2.ListenerAction.fixedResponse(200),
      });

    const httpapiInternalALB = createLoadBalancer("httpapiInternalALB");
    const httpapiListener = addApiListener(
      httpapiInternalALB,
      "httpapiListener"
    );

    const addServiceTargetGroup = (name, targets, path, priority, opts = {}) =>
      httpapiListener.addTargets(name, {
        port: 80,
        priority,
        healthCheck: {
          path: `${path}/health`,
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(3),
        },
        targets: targets,
        pathPattern: `${path}*`,
        ...opts,
      });

    const bookServiceTargetGroup = addServiceTargetGroup(
      "bookServiceTargetGroup",
      [bookService],
      "/api/books",
      1
    );

    const authorServiceTargetGroup = addServiceTargetGroup(
      "authorServiceTargetGroup",
      [authorService],
      "/api/authors",
      2
    );

    this.httpVpcLink = new cdk.CfnResource(this, "HttpVpcLink", {
      type: "AWS::ApiGatewayV2::VpcLink",
      properties: {
        Name: "http-api-vpclink",
        SubnetIds: vpc.privateSubnets.map((m) => m.subnetId),
      },
    });
  }
}
