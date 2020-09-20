import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';

interface ApigwProps extends cdk.StackProps {
  apigw: apigw.RestApi
}

export class LambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ApigwProps) {
    super(scope, id, props);

    const sampleFunction = new lambda.Function(this, 'SampleFunction', {
      code: lambda.Code.fromAsset('lambda'),
      functionName: 'sampleFunction',
      handler: 'sample.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256
    });

    const sampleIntegration = new apigw.LambdaIntegration(sampleFunction);
    const sampleResource = props.apigw.root.addResource('samples');
    sampleResource.addMethod('GET', sampleIntegration);
  }
}
