from aws_cdk import core
from aws_cdk import aws_ec2 as _ec2
from aws_cdk import aws_ecs as _ecs
from aws_cdk import aws_ecs_patterns as _ecs_patterns


class OrientDbOnFargateStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, env='PROD', ** kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Add your stack resources below):
        # Create VPC for hosting the micro service
        vpc = _ec2.Vpc(
            self,
            "dbVpc",
            max_azs=2,
            nat_gateways=1
        )

        # Create Fargate Cluster inside the VPC
        db_cluster = _ecs.Cluster(
            self,
            "dbCluster",
            vpc=vpc
        )

        # Deploy Container in the micro Service with an Application Load Balancer
        serverless_orientDB = _ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            "orientDB",
            cluster=db_cluster,
            memory_limit_mib=1024,
            cpu=512,
            task_image_options={
                "image": _ecs.ContainerImage.from_registry("orientdb"),
                "environment": {
                    "ENVIRONMENT": env
                }
            },
            desired_count=2
        )

        # Server Health Checks
        serverless_web_service.target_group.configure_health_check(path="/")

        # Output DB Url
        output_1 = core.CfnOutput(
            self,
            "dbUrl",
            value=f"{serverless_orientDB.load_balancer.load_balancer_dns_name}",
            description="Access the OrientDB url from your browser"
        )
