#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkLambdaStack } from '../lib/cdk-lambda-stack';
import { CdkApigwStack } from '../lib/cdk-apigw-stack';

const app = new cdk.App();
const apigw = new CdkApigwStack(app, 'LambdaLayersApigwStack');
new CdkLambdaStack(app, 'LambdaLayersLambdaStack', {
  api: apigw.restApi
});
