import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as waf from '@aws-cdk/aws-wafv2';

export class Wafv2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, restApiId: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // IPアドレス制限のためのIPアドレスセット
    const wafIPSet = new waf.CfnIPSet(this, 'TestWafIPSet', {
      name: 'TestWafIpSet',
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      addresses: ['192.168.0.1/32']
    });

    // WebACL本体
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

    // WAFにAPI Gatewayを関連づける
    const arn = `arn:aws:apigateway:ap-northeast-1::/restapis/${restApiId}/stages/dev`;
    const association = new waf.CfnWebACLAssociation(this, 'TestWebAclAssociation', {
      resourceArn: arn,
      webAclArn: webAcl.attrArn
    });
  }
}
