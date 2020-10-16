const { datadog, sendDistributionMetric } = require('datadog-lambda-js');

async function handler(event: any, context: any) {
    sendDistributionMetric(
        'coffee_house.order_value', // メトリクス名
        12.45, // メトリクス値
        'product:latte',
        'order:online' // 関連付けられたタグ
    );
    return {
        statusCode: 200,
        body: 'hello, dog!'
    };
}
// ラップする必要があるのは関数ハンドラーだけです（ヘルパー関数ではありません）。
module.exports.handler = datadog(handler);
