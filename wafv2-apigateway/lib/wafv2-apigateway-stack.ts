import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as waf from '@aws-cdk/aws-wafv2';

export class Wafv2ApigatewayStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = 'dev';
    const restApi = new apigw.RestApi(this, 'RestApi', {
      restApiName: 'test',
      deployOptions: {
        stageName: stage
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_METHODS,
        allowMethods: ['GET', 'OPTIONS'],
        statusCode: 200,
      }
    });

    const testFunction = new lambda.Function(this, 'TestFunction', {
      code: lambda.Code.fromAsset('lambda'),
      functionName: 'testFunction',
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256
    });

    const testIntegration = new apigw.LambdaIntegration(testFunction);
    const testResource = restApi.root.addResource('test');
    testResource.addMethod('GET', testIntegration);

    const websiteWafIPSet = new waf.CfnIPSet(this, 'TestWafIPSet', {
      name: 'TestWafIpSet',
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      addresses: [''],
    });

    const webAcl = new waf.CfnWebACL(this, 'WebAcl', {
      defaultAction: { allow: {} },
      name: 'TestWafWebAcl',
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: 'TestWafWebAcl',
      },
      rules: [
        {
          priority: 1,
          name: 'TestWafWebAclIpSetRule',
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'TestWafWebAclIpSetRule',
          },
          statement: {
            ipSetReferenceStatement: {
              arn: websiteWafIPSet.attrArn,
            },
          },
        },
      ],
    });

    const arn = `arn:aws:apigateway:ap-northeast-1::/restapis/${restApi.restApiId}/stages/${stage}`;
    new waf.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: arn,
      webAclArn: webAcl.attrArn
    });
  }
}
