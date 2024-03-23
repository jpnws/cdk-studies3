import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
} from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { resolve } from "path";
import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { v4 as uuidv4 } from "uuid";

export class S3 extends Construct {
  public readonly web_bucket: Bucket;

  public readonly web_bucket_deployment: BucketDeployment;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Our front-end code is practically hosted by an S3 bucket. This is because
    // the front-end React app is a browser-rendered single-page application
    // (SPA) and S3 has the capability to act as a content server for our files.

    // Here, we are declaring the bucket, naming it, and letting AWS know that
    // index.html acts as both websiteIndexDocument and websiteErrorDocument. In
    // production applications however, you would ideally have 404.html defined
    // for websiteErrorDocument. Furthermore, we are setting publicReadAccess to
    // true. Also, just like our DynamoDB table, setting the removal policy to
    // DESTROY ensures that the bucket is deleted when the stack is deleted. One
    // additional bucket removal policy is autoDeleteObjects, which ensures that
    // the objects in the bucket are deleted when the bucket is deleted. This is
    // required since AWS will otherwise still refuse to remove the bucket when
    // the stack is destroyed if there are files in it. This gives AWS the heads
    // up that we don't care about the contents of the bucket, and that it can
    // safely remove those before also removing the bucket.

    // Next we are telling CDK to grab all the files in the web/build directory,
    // which contains our frontend build files, and deploy them to the bucket we
    // just created. Finally, we are outputting the URL of the bucket so that we
    // can access the frontend.
    this.web_bucket = new Bucket(scope, "WebBucket", {
      bucketName: `chapter-3-web-bucket-${uuidv4()}`,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.web_bucket_deployment = new BucketDeployment(
      scope,
      "WebBucketDeployment",
      {
        sources: [
          Source.asset(resolve(__dirname, "..", "..", "..", "web", "build")),
        ],
        destinationBucket: this.web_bucket,
      }
    );

    new CfnOutput(scope, "FrontendURL", {
      value: this.web_bucket.bucketWebsiteUrl,
    });
  }
}
