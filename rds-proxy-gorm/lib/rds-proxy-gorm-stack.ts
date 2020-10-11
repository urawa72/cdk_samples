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

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
    });

    const lambdaToRDSProxyGroup = new ec2.SecurityGroup(
      this,
      'Lambda to RDS Proxy Connection',
      {
        vpc,
      }
    );

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
    //
    const parameterGroup = new rds.ParameterGroup(this, 'ParameterGroup', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_5_7_30,
      }),
      parameters: {
        character_set_client: 'utf8mb4',
        character_set_connection: 'utf8mb4',
        character_set_server: 'utf8mb4',
        character_set_results: 'utf8mb4',
        character_set_database: 'utf8mb4',
      },
    });

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
      parameterGroup: parameterGroup,
    });

    const proxy = rdsInstance.addProxy(id + '-proxy', {
      secrets: [databaseCredentialsSecret],
      debugLogging: true,
      vpc,
      securityGroups: [dbConnectionGroup],
      requireTLS: false,
    });

    const rdsLambda = new lambda.Function(this, 'rdsProxyHandler', {
      runtime: lambda.Runtime.GO_1_X,
      code: lambda.Code.asset('lambda/out'),
      handler: 'main',
      vpc: vpc,
      securityGroups: [lambdaToRDSProxyGroup],
      environment: {
        PROXY_ENDPOINT: proxy.endpoint,
        RDS_SECRET_NAME: id + '-rds-credentials',
      },
    });

    databaseCredentialsSecret.grantRead(rdsLambda);

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
