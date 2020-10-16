import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';

export class ApigwLambdaStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const restApi = new apigw.RestApi(this, 'RestApi', {
      restApiName: 'test',
      deployOptions: {
        stageName: 'dev'
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_METHODS,
        allowMethods: ['GET', 'OPTIONS'],
        statusCode: 200,
      }
    });

    const ddLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'ddLayer',
      'arn:aws:lambda:ap-northeast-1:464622532012:layer:Datadog-Node12-x:32'
    )

    const ddExtLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'ddExtLayer',
      'arn:aws:lambda:ap-northeast-1:464622532012:layer:Datadog-Extension:3'
    )

    const testFunction = new lambda.Function(this, 'TestFunction', {
      code: lambda.Code.fromAsset('lambda'),
      layers: [ddLayer, ddExtLayer],
      functionName: 'testFunction',
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 128
    });

    const testIntegration = new apigw.LambdaIntegration(testFunction);
    const testResource = restApi.root.addResource('test');
    testResource.addMethod('GET', testIntegration);
  }
}
