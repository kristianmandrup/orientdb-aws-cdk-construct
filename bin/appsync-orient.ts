#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { AppsyncOrientDbStack } from "../lib/appsync-orientdb-stack";

const app = new cdk.App();
new AppsyncOrientDbStack(app, "AppsyncOrientStack");
