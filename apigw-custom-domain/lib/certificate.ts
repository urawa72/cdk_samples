import * as cdk from '@aws-cdk/core';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';

interface Route53Props extends cdk.StackProps {
  hostedZone: route53.HostedZone
}

export class CertificateStack extends cdk.Stack {
  public readonly certificate: acm.Certificate;

  constructor(scope: cdk.Construct, id: string, props: Route53Props) {
    super(scope, id, props);

    this.certificate = new acm.DnsValidatedCertificate(this, 'Certificate', {
      domainName: `api.${props.hostedZone.zoneName}`,
      hostedZone: props.hostedZone,
      region: 'ap-northeast-1',
      validationMethod: acm.ValidationMethod.DNS,
      // subjectAlternativeNames: [`*.${props.hostedZone.zoneName}`]
    });
  }
}
