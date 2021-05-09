import * as cdk from "@aws-cdk/core";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecsPatterns from "@aws-cdk/aws-ecs-patterns";
import * as ec2 from "@aws-cdk/aws-ec2";
// import * as logs from "@aws-cdk/aws-logs";

export class OrientDbCdkStack extends cdk.Stack {
  readonly service: ecsPatterns.ApplicationLoadBalancedFargateService;
  readonly cluster: ecs.Cluster;

  constructor(scope: cdk.Construct, id: string, props: any = {}) {
    super(scope, id, props);
    const name = props.name || "OrientDB";
    const maxAzs = props.maxAzs || 2;
    const cpu = props.cpu || 512;
    const desiredCount = props.desiredCount || 1;
    const containerPort = props.containerPort || 2424;
    const memoryLimitMiB = props.memoryLimit || 512;
    const clusterName = props.clusterName || `${name}Cluster`;
    const vpcName = props.vpcName || `${name}VPC`;

    const vpc =
      props.vpc ||
      new ec2.Vpc(this, vpcName, {
        maxAzs, // default is all AZs in region
      });

    const cluster: any = new ecs.Cluster(this, clusterName, vpc);

    // Build Dockerfile from local folder and push to ECR
    const image: any = ecs.ContainerImage.fromAsset(props.assetPath);

    const serviceName = props.serviceName || `${name}FargateService`;

    const taskImageOptions: ecsPatterns.ApplicationLoadBalancedTaskImageOptions = {
      image,
      containerPort, // Docker exposes 2424 for orientdb
    };

    const assignPublicIp = props.assignPublicIp;

    // Use an ecs_patterns recipe to do all the rest!
    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      serviceName,
      {
        assignPublicIp,
        cluster, // Required
        taskImageOptions,
        cpu, // Default is 512
        desiredCount, // Default is 1
        memoryLimitMiB, // Default is 512
        publicLoadBalancer: true, //  Default is False
      }
    );

    this.cluster = cluster;
    this.service = service;
  }
}
