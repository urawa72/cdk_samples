## How to deploy

1. Deploy Route53 public hosted zone.

```
npm run build
cdk deploy Route53Stack
```

2. Set DNS server name on the site where you acquired your domain.

3. Deploy ApigwStack. CertificateStack and LambdaStack are deployed automatically because ApigwStack depends on these Stacks.
Notice: CertificateStack stops temporarily because ACM DNS valification takes a few minutes.

```
cdk deploy ApigwStack
```
