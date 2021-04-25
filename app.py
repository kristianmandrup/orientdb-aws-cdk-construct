#!/usr/bin/env python3

from aws_cdk import core

from advanced_use_cases.serverless_containers_architecture_with_fargate import ServerlessContainersArchitectureWithFargateStack
import os

app = core.App()

account = os.environ['AWS_ACCOUNT']  # such as 835800058584
region = os.environ['AWS_REGION']  # such as us-east-1

env_prod = core.Environment(account=account, region=region)

# Create highly available load balanced serverless containerized microservices with Fargate
orientdb_fargate = OrientDBOnFargateStack(
    app,
    "orientdb_fargate",
    description="OrientDB on Fargate"
)

# Stack Level Tagging
core.Tag.add(app, key="Owner",
             value=app.node.try_get_context('owner'))
core.Tag.add(app, key="OwnerProfile",
             value=app.node.try_get_context('github_profile'))
core.Tag.add(app, key="GithubRepo",
             value=app.node.try_get_context('github_repo_url'))

app.synth()
