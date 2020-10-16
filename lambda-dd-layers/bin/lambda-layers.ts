#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ApigwLambdaStack } from '../lib/apigw-lambda-stack';

const app = new cdk.App();
new ApigwLambdaStack(app, 'ApigwLambdaStack');
