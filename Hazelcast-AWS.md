# Hazelcast on AWS

See [How to set up Hazelcast on AWS ECS](https://hazelcast.com/blog/how-to-set-up-hazelcast-imdg-on-aws-ecs/)
and [video walk-through](https://www.youtube.com/watch?v=yQnrts0hfi4)

This guide demonstrates the steps and configuration needed to configure a docker image with Hazelcast on AWS.

Instead of multicast configure use of AWS for discovery in `hazelcast.yaml` (or `hazelcast.xml`)

```yaml
hazelcast:
  network:
    join:
      multicast:
        enabled: false
      aws:
        enabled: true
    interfaces:
      interfaces:
        - 10.0.*.*
```

We need to use the right network interface
Find the VPC you will use in your ECS cluster: `my-vpc`

Use IPv4 CIDR address of VPC in `hazelcast.network.interfaces.interfaces` list such as `10.0.*.*` for `10.0.0.0/16` CIDR

Create ECS Fargate cluster named f.ex `fargate-cluster`
Create hazelcast IAM role `hazelcast-ecs-role`
Create IAM Policy: `hazelcast-policy` with the policy

```
- ECS
  - DescribeTasks
  - ListTasks
  - Applies to all resources (*)

- EC2
  - DescribeNetworkInterfaces
```

Add policy `hazelcast-policy` to new IAM role `hazelcast-ecs-role`

Create New Fargate Task Definition such as `hazelcast-definition`
Attach task definition to newly created role `hazelcast-ecs-role`
Select `Task execution role` and set to `ecsTaskExecutionRole`

Add the ECS container
Set container name such as `ecs-fargate-container` and provide name of Docker image to use
Configure logs to use CloudWatch

Create Service on ECS Cluster

- Launch type: Fargate
- Task Definition: `hazelcast-definition`
- Select the ECS cluster `fargate-cluster`
- Service name: set name `hazelcast-service`
- Number of tasks 3 (or whatever number is suitable)
- Set cluster VPC same as configured before: `my-vpc`
- Select a subnet

Create new Security group for the service: `hazelcast-sg`
Set allow TCP over `5701` and HTTP or TCP over port `8080`
Start the service.
If you check the logs, it should indicate that it connects each member through hazelcast.

## Hazelcast on AWS with cdk

- ECS
  - DescribeTasks
  - ListTasks
  - Applies to all resources (\*)
- EC2
  - DescribeNetworkInterfaces

```ts
const ecsPolicy = new iam.PolicyStatement({
  resources: ["arn:aws:*"],
  actions: ["ecs:DescribeTasks", "ecs:ListTasks"],
  // 👇 Default for `effect` is ALLOW
  effect: iam.Effect.ALLOW,
});

const ec2Policy = new iam.PolicyStatement({
  resources: ["arn:aws:*"],
  actions: ["ec2:DescribeNetworkInterfaces"],
  // 👇 Default for `effect` is ALLOW
  effect: iam.Effect.ALLOW,
});

// 👇 Create a Policy Document (Collection of Policy Statements)
const describeAndListTasks = new iam.PolicyDocument({
  statements: [ecsPolicy, ec2Policy],
});
```

```ts
// 👇 Create role, to which we'll attach our Policies
const ecsTaskRole = new iam.Role(this, "hazelcast-ecs-role", {
  assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
  description: "Hazelcast ECS role",
  inlinePolicies: {
    // 👇 attach the Policy Document as inline policies
    DescribeAndListTasks: describeAndListTasks,
  },
});
```

Alternatively using `addToPolicy`

```ts
ecsTaskRole.addToPolicy(ecsPolicy);
ecsTaskRole.addToPolicy(ec2Policy);
```

See `typescripts/src/roles.ts` for how to configure task and execution roles and policies for ECS.

In python:

```py
# ECS Execution Role - Grants ECS agent to call AWS APIs
ecs_execution_role = iam.Role(
    self, 'ECSExecutionRole',
    assumed_by=iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    role_name="ecs-cdk-execution-role"
)

# Setup Role Permissions
ecs_execution_role.add_to_policy(
    iam.PolicyStatement(
        effect=iam.Effect.ALLOW,
        actions=[
            'elasticloadbalancing:DeregisterInstancesFromLoadBalancer',
            'elasticloadbalancing:DeregisterTargets',
            'elasticloadbalancing:Describe*',
            'elasticloadbalancing:RegisterInstancesWithLoadBalancer',
            'elasticloadbalancing:RegisterTargets',
            'ec2:Describe*',
            'ec2:AuthorizeSecurityGroupIngress',
            'sts:AssumeRole'
        ],
        resources=["*"]
    )
)

# ECS Task Role - Grants containers in task permission to AWS APIs
ecs_task_role = iam.Role(
    self, 'ECSTaskRole',
    assumed_by=iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    role_name="ecs-cdk-task-role"
)

# Setup Role Permissions
ecs_task_role.add_to_policy(
    iam.PolicyStatement(
        effect=iam.Effect.ALLOW,
        actions=[
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
            'logs:CreateLogStream',
            'logs:PutLogEvents'
        ],
        resources=["*"]
    )
)

# Setup Fargate Task Definition
fargate_taskdef = ecs.FargateTaskDefinition(
    self,'ECSFargateTask',
    memory_limit_mib=512,
    cpu=256,
    execution_role=ecs_execution_role,
    task_role=ecs_task_role,
    family="ecs-cdk-taskdef"
)

# Add Container Info to Task
ecs_container = fargate_taskdef.add_container(
    "FargateImage",
    image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
    logging=ecs.LogDriver.aws_logs(
        stream_prefix="ecs-fargate-logs",
        log_group=log_group
    )
)

# Setup Port Mappings
ecs_container.add_port_mappings(
    ecs.PortMapping(
        container_port=80,
        host_port=80,
        protocol=ecs.Protocol.TCP
    )
)

# Setup Fargate Service
fargate_service = ecs.FargateService(
    self,"FargateService",
    task_definition=fargate_taskdef,
    cluster=ecs_cluster,
    desired_count=1,
    service_name="ecs-cdk-service"
)
```

A sample (but incomplete) CDK for hazelcast on AWS with fargate and OrientDB image can be found in `orientdb-fargate-stack`

It takes the following properties:

- `name` such as `orient`
- `cloudNamespace` such as `orientdb.com` (if not set cluster will not use AWS Cloud Map)
- `clusterName` such as `orientCluster`
- `vpcName` such as `orientVpc`
- `vpc` to reuse existing vpc
- `desiredCount` (defaults to `3` instances)
- `taskDefName` such as `OrientTaskDef`
- `cpu` cpu size (default to `512` Mb)
- `memoryLimit` memory limit in Mb (defaults to `1024` Mb)
- `containerName` such as `OrientContainer`
- `logGroupName` such as `OrientLogGroup`
- `containerRegistryImageName` container image name in registry to be used (defaults to `orientdb:3.1.11-tp3`)
- `streamPrefix` defaults to `OrientDb`
- `image`
- `securityGroupName`
- `serviceName` such as `OrientService`
- `cloudMapOptionsName` defaults to `OrientDb`
- `availabilityZones` such as `['eu-west-1]`

The following instance variables are exposed by the stack (read only)

- `clusterName`
- `cloudNamespace`
- `vpcName`
- `taskDefName`
- `containerName`
- `logGroupName`
- `containerRegistryImageName`
- `desiredCount`
- `cpu`
- `memoryLimit`
- `ecsService`
