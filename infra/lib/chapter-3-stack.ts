import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import { Dynamodb } from "./constructs/Dynamodb";
import { ECS } from "./constructs/ECS";
import { S3 } from "./constructs/S3";

/**
 * Our stack consists of three main constructs that we will be deploying to AWS:
 * - Dynamodb: A DynamoDB table that we will use to store data.
 * - S3: An S3 bucket that we will use to hold our front-end assets.
 * - ECS: An ECS that hosts our back-end app.
 */
export class Chapter3Stack extends Stack {
  public readonly dynamodb: Dynamodb;

  public readonly s3: S3;

  public readonly ecs: ECS;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Once we have instantiated the DynamoDB table, ECS gets a reference to it.
    this.dynamodb = new Dynamodb(this, "Dynamodb");

    this.s3 = new S3(this, "S3");

    // ECS gets a reference to the DynamoDB table. This makes sense because our
    // back-end needs to know where to reach the DynamoDB table.
    this.ecs = new ECS(this, "ECS", {
      dynamodb: this.dynamodb,
    });
  }
}
