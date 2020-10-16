import axios from 'axios';
import * as socks from 'socks-proxy-agent';

const WITH_PROXY = process.env.WITH_PROXY;
const proxyOptions = process.env.PROXY_OPTIONS!;
const httpsAgent = new socks.SocksProxyAgent(proxyOptions);

export const axiosProxy = () => {
  if (WITH_PROXY) {
    return axios.create({httpsAgent});
  } else {
    return axios;
  }
};
