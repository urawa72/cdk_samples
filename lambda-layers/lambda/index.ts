import * as Calc from 'calc-sample';

export const handler = async (event: any): Promise<any> => {
  return {
    'statusCode': 200,
    'body': Calc.calcSum().toString(),
    'isBase64Encoded': false
  };
}
