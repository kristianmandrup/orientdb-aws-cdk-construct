import * as cdk from "@aws-cdk/core";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecsPatterns from "@aws-cdk/aws-ecs-patterns";
import * as ec2 from "@aws-cdk/aws-ec2";
// import * as logs from "@aws-cdk/aws-logs";

export class OrientDbCdkStack extends cdk.Stack {
  name: string;

  protected _image: any;
  protected _vpc: ec2.Vpc;
  protected _cluster: ecs.Cluster;
  protected _service: ecsPatterns.ApplicationLoadBalancedFargateService;

  constructor(scope: cdk.Construct, id: string, props: any = {}) {
    super(scope, id, props);
    this.name = props.name || "OrientDB";

    this.setOrCreateVpc(props);
    this.createImage(props);
    this.createCluster(props);
    this.createService(props);
  }

  setOrCreateVpc(props) {
    const vpcName = props.vpcName || `${this.name}VPC`;
    const maxAzs = props.maxAzs || 2;
    this._vpc =
      props.vpc ||
      new ec2.Vpc(this, vpcName, {
        maxAzs, // default is all AZs in region
      });
  }

  createCluster(props) {
    const clusterName = props.clusterName || `${this.name}Cluster`;
    this._cluster = new ecs.Cluster(this, clusterName, {
      vpc: this.vpc,
    });
  }

  createImage(props) {
    // Build Dockerfile from local folder and push to ECR
    this._image = ecs.ContainerImage.fromAsset(props.assetPath);
  }

  createService(props) {
    const cpu = props.cpu || 512;
    const desiredCount = props.desiredCount || 1;
    const containerPort = props.containerPort || 2424;
    const memoryLimitMiB = props.memoryLimit || 512;

    const taskImageOptions: ecsPatterns.ApplicationLoadBalancedTaskImageOptions = {
      image: this.image as any,
      containerPort, // Docker exposes 2424 for orientdb
    };

    const assignPublicIp = props.assignPublicIp;
    const serviceName = props.serviceName || `${this.name}FargateService`;

    const serviceConfig: any = {
      assignPublicIp,
      cluster: this.cluster, // Required
      taskImageOptions,
      cpu, // Default is 512
      desiredCount, // Default is 1
      memoryLimitMiB, // Default is 512
      publicLoadBalancer: true, //  Default is False
    };

    // Use an ecs_patterns recipe to do all the rest!
    this._service = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      serviceName,
      serviceConfig
    );
  }

  get vpc(): ec2.Vpc {
    return this._vpc;
  }

  get image(): ecs.ContainerImage {
    return this._image;
  }

  get cluster(): ecs.Cluster {
    return this._cluster;
  }

  get service(): ecsPatterns.ApplicationLoadBalancedFargateService {
    return this._service;
  }
}
