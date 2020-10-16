import { axiosProxy } from './utils/axios-with-proxy';

const API_ENDPOINT = '';
const axios = axiosProxy();

describe('test', () => {
  test('execute', async () => {
    const response = await axios({
      url: `${API_ENDPOINT}/test`,
      method: 'get',
    }).catch((err) => {
      return err.response;
    });
    expect(response.status).toBe(200);
    expect(response.data).toBe('Test Function Response!');
  })
});
