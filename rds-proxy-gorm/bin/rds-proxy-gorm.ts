#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { RdsProxyGormStack } from '../lib/rds-proxy-gorm-stack';

const app = new cdk.App();
new RdsProxyGormStack(app, 'RdsProxyGormStack');
