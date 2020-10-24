#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { RdsProxyGoStack } from '../lib/rds-proxy-go-stack';

const app = new cdk.App();
new RdsProxyGoStack(app, 'RdsProxyGoStack');
