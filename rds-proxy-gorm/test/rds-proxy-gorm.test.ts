import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as RdsProxyGorm from '../lib/rds-proxy-gorm-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new RdsProxyGorm.RdsProxyGormStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
