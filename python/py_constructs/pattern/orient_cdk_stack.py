from aws_cdk import (
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    core,
)


class OrientDbCdkStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        vpc = kwargs['vpc']
        max_azs = kwargs['max_azs'] or 2
        cpu = kwargs['cpu'] or 512
        desired_count = kwargs['desired_count'] or 1
        container_port = kwargs['container_port'] or 2424
        memory_limit_mib = kwargs['memory_limit_mib'] or 512

        vpc = vpc or ec2.Vpc(
            self, "OrientDbVPC",
            max_azs=2,  # default is all AZs in region,
        )

        cluster = ecs.Cluster(self, "OrientDbCluster", vpc=vpc)

        # Build Dockerfile from local folder and push to ECR
        image = ecs.ContainerImage.from_asset('orientdb-docker')

        # Use an ecs_patterns recipe to do all the rest!
        ecs_patterns.ApplicationLoadBalancedFargateService(self, "OrientDbFargateService",
                                                           cluster=cluster,            # Required
                                                           cpu=cpu,                    # Default is 512
                                                           desired_count=desired_count,            # Default is 1
                                                           task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                                                               image=image, container_port=2424),  # Docker exposes 2424 for orientdb
                                                           memory_limit_mib=memory_limit_mib,       # Default is 512
                                                           public_load_balancer=True,  # Default is False
                                                           )
