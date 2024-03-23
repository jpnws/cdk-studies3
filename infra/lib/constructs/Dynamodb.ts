import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";

export class Dynamodb extends Construct {
  public readonly main_table: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Spinning up a DynamoDB table with CDK is very straightforward. All we
    // have to do is instantiate the Table class from the
    // `aws-cdk-lib/aws-dynamodb` package.

    // The `Table` class requires a few parameters to be passed in:
    // - `partitionKey` and `sortKey` indexing attributes of DynamoDB database.
    // - `tableName` is the name of the table. `billingMode`.
    // - DynamoDB has two billing modes: `PAY_PER_REQUEST` and `PROVISIONED`.
    // - `PAY_PER_REQUEST` is for unpredictable traffic patterns.
    // - `PROVISIONED` is for predictable traffic patterns.
    // - `removalPolicy`:
    //   - `DESTROY` means the table is deleted when stack is deleted.
    //   - `RETAIN` means that the table not deleted when the stack is deleted.
    this.main_table = new Table(scope, "MainTable", {
      partitionKey: {
        name: "partition_key",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sort_key",
        type: AttributeType.STRING,
      },
      tableName: "main_table",
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
