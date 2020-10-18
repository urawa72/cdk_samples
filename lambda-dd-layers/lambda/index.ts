const { datadog, sendDistributionMetric } = require('datadog-lambda-js');

async function myHandler(event: any, context: any) {
    for(let i = 0; i < 1000; i++) {
        sendDistributionMetric(
              'coffee_house.order_value', // メトリクス名
            Math.random(), // メトリクス値
            'product:latte',
            'order:online' // 関連付けられたタグ
        );
    }

    return {
        statusCode: 200,
        body: 'hello, dog!'
    };
}

module.exports.handler = datadog(myHandler);
