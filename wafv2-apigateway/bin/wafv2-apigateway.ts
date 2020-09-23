#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Wafv2ApigatewayStack } from '../lib/wafv2-apigateway-stack';

const app = new cdk.App();
new Wafv2ApigatewayStack(app, 'Wafv2ApigatewayStack');
