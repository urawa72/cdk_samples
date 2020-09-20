export const handler = async (event: any): Promise<any> => {
  return {
    'statusCode': 200,
    'body': 'hello! sample api gateway with lambda!',
    'isBase64Encoded': false
  };
}
