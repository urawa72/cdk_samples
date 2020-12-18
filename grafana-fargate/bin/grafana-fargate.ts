#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GrafanaFargateStack } from '../lib/grafana-fargate-stack';

const app = new cdk.App();
new GrafanaFargateStack(app, 'GrafanaFargateStack');
