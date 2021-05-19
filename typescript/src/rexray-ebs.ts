import { Policy, PolicyStatement } from "@aws-cdk/aws-iam";
import {
  Ec2TaskDefinition,
  Scope,
  ContainerDefinition,
} from "@aws-cdk/aws-ecs";

// Based on https://medium.com/aspecto/attach-ebs-docker-volume-to-aws-ecs-using-cdk-931c29e0e1
export class RexrayEbs {
  stack: any;
  target: any; // autoScalingGroup, ecs (fargate) or ec2 instance etc.

  // It should be possible to get the AutoScalingGroup for an EC2 cluster as well
  // Cluster ec2Cluster = // ...
  // ec2Cluster.getAutoscalingGroup().addUserData("echo \"$PARAM\"");
  // for ECS
  // https://stackoverflow.com/questions/35202993/how-can-i-connect-my-autoscaling-group-to-my-ecs-cluster

  constructor(stack, target) {
    this.stack = stack;
    // See: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-ecs.ICluster.html
    this.target = target.autoscalingGroup || target;
  }

  // Make sure to set the right EBS_REGION
  // See: https://bobbyhadz.com/blog/aws-cdk-ec2-userdata-example
  installRexRay(region: string) {
    this.addUserData(
      `docker plugin install rexray/ebs REXRAY_PREEMPT=true EBS_REGION=${region} --grant-all-permissions \nstop ecs \nstart ecs`
    );
  }

  addUserData(userData: string) {
    this.target.addUserData(userData);
  }

  get ebsActionsAllowed() {
    return [
      "ec2:AttachVolume",
      "ec2:CreateVolume",
      "ec2:CreateSnapshot",
      "ec2:CreateTags",
      "ec2:DeleteVolume",
      "ec2:DeleteSnapshot",
      "ec2:DescribeAvailabilityZones",
      "ec2:DescribeInstances",
      "ec2:DescribeVolumes",
      "ec2:DescribeVolumeAttribute",
      "ec2:DescribeVolumeStatus",
      "ec2:DescribeSnapshots",
      "ec2:CopySnapshot",
      "ec2:DescribeSnapshotAttribute",
      "ec2:DetachVolume",
      "ec2:ModifySnapshotAttribute",
      "ec2:ModifyVolumeAttribute",
      "ec2:DescribeTags",
    ];
  }

  addPolicy() {
    const actions = this.ebsActionsAllowed;
    // Give our EC2 instance the needed permissions to manage EBS
    const ec2PolicyEbs = new Policy(this.stack, "ec2-policy-create-ebs", {
      policyName: "REXRay-EBS",
      statements: [
        PolicyStatement.fromJson({
          Effect: "Allow",
          Action: actions,
          Resource: "*",
        }),
      ],
    });

    // Attach policy
    this.target.role.attachInlinePolicy(ec2PolicyEbs);
  }

  // - "./config:/orientdb/config"
  // - "./databases:/orientdb/databases"
  // - "./backup:/orientdb/backup"
  // - "./db:/db"
  get volumeMap() {
    return {
      config: "/orientdb/config",
      databases: "/orientdb/databases",
      backup: "/orientdb/backup",
      db: "/db",
    };
  }

  apiFor(
    container: ContainerDefinition,
    taskDefinition: Ec2TaskDefinition,
    config
  ) {
    const defaultConfig = {
      autoprovision: true,
      scope: Scope.SHARED,
      driver: "rexray/ebs",
      driverOpts: {
        volumetype: "gp2",
        size: "10",
      },
    };

    const addDockerVolume = (name: string, containerPath) => {
      config = {
        ...defaultConfig,
        ...config,
      };

      // Add EBS volume, this will also create the volume
      // Look here to understand all the options:
      // https://docs.aws.amazon.com/AmazonECS/latest/developerguide/docker-volumes.html
      taskDefinition.addVolume({
        name,
        dockerVolumeConfiguration: config,
      });

      // Mount the volume to your container
      container.addMountPoints({
        sourceVolume: name,
        containerPath,
        readOnly: false,
      });
    };

    const addDockerVolumes = (vMap) => {
      Object.entries(vMap).map(([name, path]) => {
        addDockerVolume(name, path);
      });
    };

    return {
      addDockerVolume,
      addDockerVolumes,
    };
  }
}
