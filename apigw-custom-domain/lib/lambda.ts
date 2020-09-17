import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';

interface ApigwProps extends cdk.StackProps {
  apigw: apigw.RestApi
}

export class LambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ApigwProps) {
    super(scope, id, props);

    const sampleFunction = new lambda.Function(this, 'SampleFunction', {
      code: lambda.Code.fromAsset('lambda'),
      functionName: 'sampleFunction',
      handler: 'sample.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256
    });


    const sampleResource = props.apigw.root.addResource('samples');
    sampleResource.addMethod('GET', new apigw.LambdaIntegration(sampleFunction, {
      connectionType: apigw.ConnectionType.INTERNET,
      requestTemplates: {
        'application/json': "$input.json('$')"
      },
      integrationResponses: [
        {
          statusCode: '200',
          contentHandling: apigw.ContentHandling.CONVERT_TO_TEXT,
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': "'Origin,Content-Type,Authorization'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,OPTIONS'",
            'method.response.header.Access-Control-Allow-Origin': "'*'"
          },
          responseTemplates: {
            'application/json': "$input.json('$')"
          }
        },
      ],
      passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_MATCH,
      proxy: false,
    }), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Origin': true
          }
        }
      ]
    });
  }
}
