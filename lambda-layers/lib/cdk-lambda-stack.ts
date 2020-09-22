import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';

interface ApigwProps extends cdk.StackProps {
  api: apigw.RestApi
}

export class CdkLambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ApigwProps) {
    super(scope, id, props);

    const layer = new lambda.LayerVersion(this, `Layers-${this.stackName}`, {
      code: lambda.AssetCode.fromAsset('layers'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X]
    });

    const calcFunction = new lambda.Function(this, `CalcFunction-${this.stackName}`, {
      code: lambda.Code.fromAsset('lambda'),
      layers: [layer],
      functionName: 'calcFunction',
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256
    });

    const calcIntegration = new apigw.LambdaIntegration(calcFunction);
    const calcResource = props.api.root.addResource('calc');
    const sumResource = calcResource.addResource('sum');
    sumResource.addMethod('GET', calcIntegration);
  }
}
