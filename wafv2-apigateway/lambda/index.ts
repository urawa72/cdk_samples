export const handler = async (event: any): Promise<any> => {
  return {
    'statusCode': 200,
    'body': 'Test Function Response!',
    'isBase64Encoded': false
  };
}
