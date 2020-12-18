import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as GrafanaFargate from '../lib/grafana-fargate-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new GrafanaFargate.GrafanaFargateStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
