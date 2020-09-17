#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Route53Stack } from '../lib/route53';
import { CertificateStack } from '../lib/certificate';
import { ApigwStack } from '../lib/apigw';
import { LambdaStack } from '../lib/lambda';
import { LocalEnvironments } from '../lib/interfaces/local-environments';

const app = new cdk.App();
const env: LocalEnvironments = app.node.tryGetContext('sample');

const route53 = new Route53Stack(app, 'Route53Stack', env);
const acm = new CertificateStack(app, 'CertificateStack', {
  hostedZone: route53.hostedZone
});
const apigw = new ApigwStack(app, 'ApigwStack', env, {
  hostedZone: route53.hostedZone,
  certificate: acm.certificate
});
const lambda = new LambdaStack(app, 'LambdaStack', {
  apigw: apigw.restApi
});
