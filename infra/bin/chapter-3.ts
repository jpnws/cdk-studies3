#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { Chapter3Stack } from "../lib/chapter-3-stack";

// We are writing the instructions to load up the root stack of the CDK app.
// The root stack is the main stack that will be deployed to the AWS account.
// The root stack will load up the Chapter3Stack, which is the stack that we
// will be deploying to AWS.

const app = new cdk.App();

new Chapter3Stack(app, "Chapter3Stack", {});
