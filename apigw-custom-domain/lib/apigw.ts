import * as cdk from '@aws-cdk/core';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as route53 from '@aws-cdk/aws-route53';
import * as alias from '@aws-cdk/aws-route53-targets';
import { LocalEnvironments } from './interfaces/local-environments';

interface Route53Props extends cdk.StackProps {
  hostedZone: route53.HostedZone;
  certificate: acm.Certificate;
}

export class ApigwStack extends cdk.Stack {
  public restApi: apigw.RestApi;

  constructor(scope: cdk.Construct, id: string, env: LocalEnvironments, props: Route53Props) {
    super(scope, id, props);

    this.restApi = new apigw.RestApi(this, 'SampleRestApi', {
      restApiName: 'sample',
      deployOptions: {
        stageName: 'dev'
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_METHODS,
        allowMethods: ['GET', 'OPTIONS'],
        statusCode: 200,
      }
    });

    const customDomain = new apigw.DomainName(this, 'CustromDomain', {
      domainName: `api.${props.hostedZone.zoneName}`,
      certificate: props.certificate,
      securityPolicy: apigw.SecurityPolicy.TLS_1_2,
      endpointType: apigw.EndpointType.REGIONAL
    });

    new route53.ARecord(this, 'SampleARecod', {
      zone: props.hostedZone,
      recordName: `api.${props.hostedZone.zoneName}`,
      target: route53.RecordTarget.fromAlias(new alias.ApiGatewayDomain(customDomain))
    });

    customDomain.addBasePathMapping(this.restApi, {
      basePath: 'dev',
    });

    // CDK外で作成したHostedZoneと証明書を取得
    // const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', env.certificateArn);
    // const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
    //   zoneName: env.zoneName,
    //   hostedZoneId: env.hostedZoneId
    // });
    //
    // const customDomain = new apigw.DomainName(this, 'CustromDomain', {
    //   domainName: `api.${hostedZone.zoneName}`,
    //   certificate: certificate,
    //   securityPolicy: apigw.SecurityPolicy.TLS_1_2,
    //   endpointType: apigw.EndpointType.REGIONAL
    // });
    //
    // new route53.ARecord(this, 'SampleARecod', {
    //   zone: hostedZone,
    //   recordName: `api.${hostedZone.zoneName}`,
    //   target: route53.RecordTarget.fromAlias(new alias.ApiGatewayDomain(customDomain))
    // });
  }
}
