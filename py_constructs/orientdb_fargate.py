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
        # OrientDb binary
        # EXPOSE 2424
        # OrientDb http
        # EXPOSE 2480
        # See
        # https://www.osradar.com/how-to-install-orientdb-in-windows-10/
        # https://orientdb.com/docs/last/gettingstarted/Tutorial-Run-the-server.html
        # The database server is now running and accessible on your system through ports 2424 and 2480.
        # At the first startup the server will ask for the root user password.
        # The password is stored in the config file.
        # https://orientdb.com/docs/2.2.x/Server-Security.html
        # https://orientdb.com/docs/2.2.x/Security-Config.html
        # https://orientdb.com/docs/2.2.x/Distributed-Configuration.html
        # The distributed configuration consists of 3 files under the config/ directory:
        # - orientdb-server-config.xml
        # - default-distributed-db-config.json
        # - hazelcast.xml

        # load image from registry or asset
        # https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-ecs/lib/container-image.ts
        image = _ecs.ContainerImage.from_asset("../docker")
        # docker run -d --restart=always --name orientdb -p 2424:2424 -p 2480:2480 -e ORIENTDB_ROOT_PASSWORD=root orientdb

        # image = _ecs.ContainerImage.from_registry("orientdb")

        serverless_orientDB = _ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            "orientDB",
            cluster=db_cluster,
            memory_limit_mib=1024,
            cpu=512,
            # Orientdb images
            # https://hub.docker.com/_/orientdb/?tab=tags&page=1&ordering=last_updated
            # https://github.com/orientechnologies/orientdb-docker/blob/master/release/3.1.x/3.1.11/Dockerfile
            task_image_options={
                "image": image,
                "environment": {
                    "ENVIRONMENT": env
                }
            },
            desired_count=2
        )

        # Server Health Checks
        serverless_web_service.target_group.configure_health_check(path="/")

        # Output DB Url
        # Port 2424
        output_1 = core.CfnOutput(
            self,
            "dbUrl",
            value=f"{serverless_orientDB.load_balancer.load_balancer_dns_name}",
            description="Access the OrientDB url from your browser"
        )
