import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as RdsProxyGo from '../lib/rds-proxy-go-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new RdsProxyGo.RdsProxyGoStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  );
});
