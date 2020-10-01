import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';

export class ApigwLambdaStack extends cdk.Stack {
  public restApi: apigw.RestApi;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // メンバー変数に設定しWAFのスタックでIDを参照できるようにする
    this.restApi = new apigw.RestApi(this, 'TestRestApi', {
      restApiName: 'test',
      deployOptions: {
        stageName: 'dev'
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'OPTIONS'],
        statusCode: 200,
      }
    });

    // テスト用関数
    const testFunction = new lambda.Function(this, 'TestFunction', {
      code: lambda.Code.fromAsset('lambda'),
      functionName: 'testFunction',
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256
    });

    // トリガーにAPI Gatewayを設定する
    const testIntegration = new apigw.LambdaIntegration(testFunction);
    const testResource = this.restApi.root.addResource('test');
    testResource.addMethod('GET', testIntegration);
  }
}
