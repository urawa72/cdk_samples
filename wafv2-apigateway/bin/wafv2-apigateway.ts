#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ApigwLambdaStack } from '../lib/apigw-lambda-stack';
import { Wafv2Stack } from '../lib/wafv2-stack';

const app = new cdk.App();

const stageName: string = app.node.tryGetContext('stageName');

const api = new ApigwLambdaStack(app, 'ApigwLambdaStack');
new Wafv2Stack(app, 'Wafv2Stack', api.restApi.restApiId);
