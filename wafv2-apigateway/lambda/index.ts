export const handler = async (event: any): Promise<any> => {
  return {
    'statusCode': 200,
    'headers': {
      "Access-Control-Allow-Origin": "*",
    },
    'body': 'Test Function Response!',
    'isBase64Encoded': false
  };
}
