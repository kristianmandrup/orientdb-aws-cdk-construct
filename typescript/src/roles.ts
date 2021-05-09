// Setup Role Permissions
import * as iam from "@aws-cdk/aws-iam";

// # ECS Execution Role - Grants ECS agent to call AWS APIs
export class ExecutionRole {
  constructor(context, props: any) {
    const servicePrincipal =
      props.principal || new iam.ServicePrincipal("ecs-tasks.amazonaws.com");

    const ecsExecRoleName = props.ecsTaskRoleName || "ECSExecutionRole";
    const ecsRoleName = props.ecsRoleName || "ecs-cdk-task-role";

    const ecsExecRole = new iam.Role(context, ecsExecRoleName, {
      assumedBy: servicePrincipal,
      roleName: ecsRoleName,
    });

    const actions = props.actions || [
      "elasticloadbalancing:DeregisterInstancesFromLoadBalancer",
      "elasticloadbalancing:DeregisterTargets",
      "elasticloadbalancing:Describe*",
      "elasticloadbalancing:RegisterInstancesWithLoadBalancer",
      "elasticloadbalancing:RegisterTargets",
      "ec2:Describe*",
      "ec2:AuthorizeSecurityGroupIngress",
      "sts:AssumeRole",
    ];

    const resources = props.resources || ["*"];

    const policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions,
      resources,
    });
    ecsExecRole.addToPolicy(policy);
  }
}

// ECS Task Role - Grants containers in task permission to AWS APIs
export class TaskRole {
  readonly ecsTaskRole: iam.Role;

  constructor(context, props: any) {
    const servicePrincipal =
      props.principal || new iam.ServicePrincipal("ecs-tasks.amazonaws.com");

    const ecsTaskRoleName = props.ecsTaskRoleName || "ECSTaskRole";
    const ecsRoleName = props.ecsRoleName || "ecs-cdk-task-role";

    const ecsTaskRole = new iam.Role(context, ecsTaskRoleName, {
      assumedBy: servicePrincipal,
      roleName: ecsRoleName,
    });

    const actions = props.actions || [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ];

    const resources = props.resources || ["*"];

    const policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions,
      resources,
    });

    // Setup Role Permissions
    ecsTaskRole.addToPolicy(policy);
    this.ecsTaskRole = ecsTaskRole;
  }
}
