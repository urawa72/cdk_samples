import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecsPatterns from '@aws-cdk/aws-ecs-patterns';
import * as ec2 from '@aws-cdk/aws-ec2';

export class GrafanaFargateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: vpc,
    });

    const grafanaService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'grafanaService',
      {
        cluster: cluster,
        memoryLimitMiB: 512,
        cpu: 256,
        desiredCount: 1,
        taskImageOptions: {
          containerPort: 3000,
          image: ecs.ContainerImage.fromRegistry('grafana/grafana'),
        },
      }
    );

    grafanaService.targetGroup.configureHealthCheck({
      path: '/api/health',
    });
  }
}
