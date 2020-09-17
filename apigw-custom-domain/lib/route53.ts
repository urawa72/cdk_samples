import * as cdk from '@aws-cdk/core';
import * as route53 from '@aws-cdk/aws-route53';
import { LocalEnvironments } from './interfaces/local-environments';

export class Route53Stack extends cdk.Stack {
  public readonly hostedZone: route53.HostedZone;

  constructor(scope: cdk.Construct, id: string, env: LocalEnvironments, props?: cdk.StackProps) {
    super(scope, id, props);

    this.hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: env.zoneName,
      comment: 'created by cdk'
    });
  }
}
