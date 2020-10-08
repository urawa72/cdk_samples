import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigatewayv2';
import * as rds from '@aws-cdk/aws-rds';
import * as secrets from '@aws-cdk/aws-secretsmanager';
import * as ssm from '@aws-cdk/aws-ssm';

export class RdsProxyGormStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // RDS needs to be setup in a VPC
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2, // Default is all AZs in the region
    });

    // We need this security group to add an ingress rule and allow our lambda to query the proxy
    const lambdaToRDSProxyGroup = new ec2.SecurityGroup(
      this,
      'Lambda to RDS Proxy Connection',
      {
        vpc,
      }
    );

    // We need this security group to allow our proxy to query our MySQL Instance
    const dbConnectionGroup = new ec2.SecurityGroup(
      this,
      'Proxy to DB Connection',
      {
        vpc,
      }
    );
    dbConnectionGroup.addIngressRule(
      dbConnectionGroup,
      ec2.Port.tcp(3306),
      'allow db connection'
    );
    dbConnectionGroup.addIngressRule(
      lambdaToRDSProxyGroup,
      ec2.Port.tcp(3306),
      'allow lambda connection'
    );

    const databaseUsername = 'syscdk';

    // Dynamically generate the username and password, then store in secrets manager
    const databaseCredentialsSecret = new secrets.Secret(
      this,
      'DBCredentialsSecret',
      {
        secretName: id + '-rds-credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: databaseUsername,
          }),
          excludePunctuation: true,
          includeSpace: false,
          generateStringKey: 'password',
        },
      }
    );

    new ssm.StringParameter(this, 'DBCredentialsArn', {
      parameterName: 'rds-credentials-arn',
      stringValue: databaseCredentialsSecret.secretArn,
    });

    // Aurora Cluster
    // const aurora = new rds.DatabaseCluster(this, 'MySQLAurora', {
    //   engine: rds.DatabaseClusterEngine.auroraMysql({
    //     version: rds.AuroraMysqlEngineVersion.VER_2_08_1,
    //   }),
    //   credentials: rds.Credentials.fromUsername(databaseUsername),
    //   instanceProps: {
    //     instanceType: ec2.InstanceType.of(
    //       ec2.InstanceClass.BURSTABLE2,
    //       ec2.InstanceSize.SMALL
    //     ),
    //     vpc,
    //   },
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    //   deletionProtection: false,
    // });

    const rdsInstance = new rds.DatabaseInstance(this, 'DBInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_5_7_30,
      }),
      credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.SMALL
      ),
      vpc,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      securityGroups: [dbConnectionGroup],
    });

    const proxy = rdsInstance.addProxy(id + '-proxy', {
      secrets: [databaseCredentialsSecret],
      debugLogging: true,
      vpc,
      securityGroups: [dbConnectionGroup],
    });

    // // Workaround for bug where TargetGroupName is not set but required
    // const targetGroup = proxy.node.children.find((child) => {
    //   return child instanceof rds.CfnDBProxyTargetGroup;
    // }) as rds.CfnDBProxyTargetGroup;
    //
    // targetGroup.addPropertyOverride('TargetGroupName', 'default');

    // Lambda to Interact with RDS Proxy
    const rdsLambda = new lambda.Function(this, 'rdsProxyHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('lambda/rds'),
      handler: 'rdsLambda.handler',
      vpc: vpc,
      securityGroups: [lambdaToRDSProxyGroup],
      environment: {
        PROXY_ENDPOINT: proxy.endpoint,
        RDS_SECRET_NAME: id + '-rds-credentials',
      },
    });

    databaseCredentialsSecret.grantRead(rdsLambda);

    // defines an API Gateway Http API resource backed by our "rdsLambda" function.
    const api = new apigw.HttpApi(this, 'Endpoint', {
      defaultIntegration: new apigw.LambdaProxyIntegration({
        handler: rdsLambda,
      }),
    });

    new cdk.CfnOutput(this, 'HTTP API Url', {
      value: api.url ?? 'Something went wrong with the deploy',
    });
  }
}
