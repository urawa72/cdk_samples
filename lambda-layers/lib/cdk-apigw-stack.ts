import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';

export class CdkApigwStack extends cdk.Stack {
  public restApi: apigw.RestApi;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.restApi = new apigw.RestApi(this, 'RestApi', {
      restApiName: 'calc',
      deployOptions: {
        stageName: 'dev'
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_METHODS,
        allowMethods: ['GET', 'OPTIONS'],
        statusCode: 200,
      }
    });
  }
}
