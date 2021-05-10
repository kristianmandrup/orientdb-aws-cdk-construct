// Setup Role Permissions
import * as iam from "@aws-cdk/aws-iam";
import { Construct } from "@aws-cdk/core";

// # ECS Execution Role - Grants ECS agent to call AWS APIs
export class ExecutionRole {
  context: Construct;

  get ecsActions(): string[] {
    return ["ecs:DescribeTasks", "ecs:ListTasks"];
  }

  get ec2Actions(): string[] {
    return ["ec2:DescribeNetworkInterfaces"];
  }

  constructor(context: Construct, props: any) {
    this.context = context;
    const servicePrincipal =
      props.principal || new iam.ServicePrincipal("ecs-tasks.amazonaws.com");

    const ecsExecRoleName = props.ecsTaskExecRoleName || "ECSExecutionRole";
    const ecsRoleName = props.ecsExecRoleName || "ecs-cdk-task-role";

    const ecsExecRole = new iam.Role(context, ecsExecRoleName, {
      assumedBy: servicePrincipal,
      roleName: ecsRoleName,
    });

    const actions = (props.actions || [])
      .concat(this.ecsActions)
      .concat(this.ec2Actions)
      .unique();

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
  context: Construct;
  readonly ecsTaskRole: iam.Role;

  constructor(context: Construct, props: any) {
    this.context = context;
    const servicePrincipal =
      props.principal || new iam.ServicePrincipal("ecs-tasks.amazonaws.com");

    const ecsTaskRoleName = props.ecsTaskRoleName || "ECSTaskRole";
    const ecsRoleName = props.ecsRoleName || "ecs-cdk-task-role";

    const ecsTaskRole = new iam.Role(context, ecsTaskRoleName, {
      assumedBy: servicePrincipal,
      roleName: ecsRoleName,
    });

    const actions = props.actions || [];

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

  buildTaskRole(name: string, execution?: boolean): iam.Role {
    const taskRole = new iam.Role(this.context, name, {
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
}
