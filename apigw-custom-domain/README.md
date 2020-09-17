## How to deploy

1. Install dependencies and build.

```
npm install
npm run build
```

2. Deploy Route53 public hosted zone.

```
cdk deploy Route53Stack
```

3. Set DNS server name on the site where you acquired your domain.

4. Deploy API Gateway.
CertificateStack and LambdaStack are deployed automatically because ApigwStack depends on these Stacks.
Notice: CertificateStack stops temporarily because ACM DNS valification takes a few minutes.

```
cdk deploy ApigwStack
```
