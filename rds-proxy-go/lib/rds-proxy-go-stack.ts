import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as rds from '@aws-cdk/aws-rds';
import * as secrets from '@aws-cdk/aws-secretsmanager';

export class RdsProxyGoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      cidr: '10.1.0.0/16',
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    new ec2.InterfaceVpcEndpoint(this, 'SecretManagerVpcEndpoint', {
      vpc: vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    const bastionGroup = new ec2.SecurityGroup(
      this,
      'Bastion to DB Connection',
      {
        vpc,
      }
    );

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

    dbConnectionGroup.addIngressRule(
      bastionGroup,
      ec2.Port.tcp(3306),
      'allow bastion connection'
    );

    const host = new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      securityGroup: bastionGroup,
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    host.allowSshAccessFrom(ec2.Peer.ipv4('153.222.44.168/32'));

    host.instance.addUserData('yum -y update', 'yum install -y mysql jq');

    const databaseCredentialsSecret = new secrets.Secret(
      this,
      'DBCredentialsSecret',
      {
        secretName: id + '-rds-credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: 'syscdk',
          }),
          excludePunctuation: true,
          includeSpace: false,
          generateStringKey: 'password',
        },
      }
    );

    // new ssm.StringParameter(this, 'DBCredentialsArn', {
    //   parameterName: 'rds-credentials-arn',
    //   stringValue: databaseCredentialsSecret.secretArn,
    // });

    // Aurora Cluster
    // const aurora = new rds.DatabaseCluster(this, 'MySQLAurora', {
    //   engine: rds.DatabaseClusterEngine.auroraMysql({
    //     version: rds.AuroraMysqlEngineVersion.VER_2_08_1,
    //   }),
    //   credentials: rds.Credentials.fromUsername('syscdk'),
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
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.ISOLATED,
      },
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

    const rdsLambda = new lambda.Function(this, 'RdsProxyHandler', {
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
    databaseCredentialsSecret.grantRead(host);

    const restApi = new apigw.RestApi(this, 'RestApi', {
      restApiName: 'rds-proxy-go',
      deployOptions: {
        stageName: 'dev',
      },
    });

    const rdsLambdaIntegration = new apigw.LambdaIntegration(rdsLambda);
    const booksResource = restApi.root.addResource('books');
    booksResource.addMethod('GET', rdsLambdaIntegration);
  }
}
