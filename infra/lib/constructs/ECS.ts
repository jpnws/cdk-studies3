import { CfnOutput, Duration } from "aws-cdk-lib";
import { InstanceType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import {
  Cluster,
  ContainerDefinition,
  ContainerImage,
  Protocol,
  LogDriver,
  FargateService,
  FargateTaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import {
  ApplicationListener,
  ApplicationLoadBalancer,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Dynamodb } from "./Dynamodb";
import { resolve } from "path";

interface Props {
  dynamodb: Dynamodb;
}

export class ECS extends Construct {
  public readonly vpc: Vpc;

  public readonly cluster: Cluster;

  public readonly task_definition: FargateTaskDefinition;

  public readonly container: ContainerDefinition;

  public readonly service: FargateService;

  public readonly load_balancer: ApplicationLoadBalancer;

  public readonly listener: ApplicationListener;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    // Since Fargate will spin up EC2 machines that in turn run ECS containers,
    // we need a virtually isolated private cloud, a VPC. It's an environment
    // with a network isolated from the rest of the customers of AWS for you to
    // safely wset up virtual machines.
    this.vpc = new Vpc(scope, "Vpc", { maxAzs: 2 });
    this.cluster = new Cluster(scope, "EcsCluster", { vpc: this.vpc });
    this.cluster.addCapacity("DefaultAutoScalingGroup", {
      instanceType: new InstanceType("t2.micro"),
    });

    // Next, we are setting up an ECS cluster that holds a group of ECS services
    // (we will only have one for now). This section creates the ECS task
    // definition. A task definition is a blueprint for your application. It
    // specifies how the application is built and run. It includes the container
    // image, the CPU and memory requirements, the networking configuration, and
    // the IAM role that the container will assume. The task definition is used
    // to run tasks or services on ECS. In this case, we are pointing to the
    // Dockerfile located at ./server/Dockerfile. Define how much memory should
    // be assigned to the task and also ask AWS to keep hold of the logs of the
    // application. As seen during the deployment, CDK builds the image on our
    // behalf and deals with all the necessary steps to upload the image to ECR
    // and make it available for the ECS task definition:
    this.task_definition = new FargateTaskDefinition(scope, "TaskDefinition");
    this.container = this.task_definition.addContainer("Express", {
      image: ContainerImage.fromAsset(
        resolve(__dirname, "..", "..", "..", "server")
      ),
      memoryLimitMiB: 256,
      logging: LogDriver.awsLogs({ streamPrefix: "chapter3" }),
    });

    // Set up all the port mapping and the load balancer for our back-end. It
    // tells the load balancer that it should forward any traffic it receives on
    // port 80 and hand it over to our ECS. It also indicates to the load
    // balancer that it can check whether the service is up by periodically
    // calling the /healthcheck endpoint. The last line of code creates an
    // output that will be displayed in the terminal after the deployment is
    // complete. It will show the URL of the load balancer that we can use to
    // access the back-end:
    this.container.addPortMappings({
      containerPort: 80,
      protocol: Protocol.TCP,
    });
    this.service = new FargateService(scope, "Service", {
      cluster: this.cluster,
      taskDefinition: this.task_definition,
    });
    this.load_balancer = new ApplicationLoadBalancer(scope, "LB", {
      vpc: this.vpc,
      internetFacing: true,
    });

    this.listener = this.load_balancer.addListener("PublicListener", {
      port: 80,
      open: true,
    });

    this.listener.addTargets("ECS", {
      port: 80,
      targets: [
        this.service.loadBalancerTarget({
          containerName: "Express",
          containerPort: 80,
        }),
      ],
      healthCheck: {
        interval: Duration.seconds(60),
        path: "/healthcheck",
        timeout: Duration.seconds(5),
      },
    });

    // We are also granting all the necessary permissions so that the API can
    // perform the desired actions on DynamoDB, in this case, read and write
    // permissions.
    props.dynamodb.main_table.grantReadWriteData(this.task_definition.taskRole);

    new CfnOutput(scope, "BackendURL", {
      value: this.load_balancer.loadBalancerDnsName,
    });
  }
}
