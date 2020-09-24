import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as waf from '@aws-cdk/aws-wafv2';

interface Env {
  stage: string;
  whiteIpAddress: string[];
}

export class Wafv2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, restApiId: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const env: Env = this.node.tryGetContext('dev');

    const wafIPSet = new waf.CfnIPSet(this, 'TestWafIPSet', {
      name: 'TestWafIpSet',
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      addresses: env.whiteIpAddress
    });

    const webAcl = new waf.CfnWebACL(this, 'TestWebAcl', {
      defaultAction: { block: {} },
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
          action: { allow: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'TestWafWebAclIpSetRule',
          },
          statement: {
            ipSetReferenceStatement: {
              arn: wafIPSet.attrArn,
            },
          },
        },
      ],
    });

    const arn = `arn:aws:apigateway:ap-northeast-1::/restapis/${restApiId}/stages/${env.stage}`;
    const association = new waf.CfnWebACLAssociation(this, 'TestWebAclAssociation', {
      resourceArn: arn,
      webAclArn: webAcl.attrArn
    });
  }
}
