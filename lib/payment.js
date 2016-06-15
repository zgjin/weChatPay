import util from './util';

const requireData = {
  appid: true,
  partnerKey: true,
  mch_id: true,
  device_info: false,
  nonce_str: true,
  sign: true,
  body: true,
  detail: false,
  attach: false,
  out_tarde_no: true,
  fee_type: true,
  total_fee: true,
  spbill_create_ip: true,
  time_start: false,
  time_expire: false,
  goods_tag: false,
  notify_url: true,
  trade_type: true,
  limit_pay: false
};

const URLS = {
  UNIFIED_ORDER: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
  ORDER_QUERY: 'https://api.mch.weixin.qq.com/pay/orderquery',
  REFUND: 'https://api.mch.weixin.qq.com/secapi/pay/refund',
  REFUND_QUERY: 'https://api.mch.weixin.qq.com/pay/refundquery',
  DOWNLOAD_BILL: 'https://api.mch.weixin.qq.com/pay/downloadbill',
  SHORT_URL: 'https://api.mch.weixin.qq.com/tools/shorturl',
  CLOSE_ORDER: 'https://api.mch.weixin.qq.com/pay/closeorder'
};

class Payment {
  constructor(config) {
    // this.app_id = config.appId;// APPID
    // this.mch_id = config.mchId;// 微信支付分配的商户号
    // this.notify_url = config.notifyUrl;// 支付成功后回调的url
    this.config = config || '';
  }

  // 调用微信统一下单API，获取预订单的信息
  getReadyPayParams = async (order) => {
    const default_params = {
      out_tarde_no: util._generateTimeStamp(), // 商户订单号XSDX+'时间戳'
      nonce_str: util._generateNonceStr() // 随机字符串，不长于32位
    };
    const params = Object.assign({}, this.config, default_params, order);
    const vali = util.validate(params, requireData);
    if (vali) {
      throw new Error(`缺少参数${vali}`);
    }
    // 发送请求到微信
    const { error, data } = await this.sendRequestTWcPay(params, URLS.UNIFIED_ORDER);
    if (error) {
      throw error;
    }
    const payParams = Object.assign({}, this.config, default_params, data);
    payParams.paySign = util._getSign(payParams);
    return payParams;
  }

  sendRequestTWcPay = async (params, url) => {
    params.sign = util._getSign(util.toString(params));
    const body = await util._httpRequest(url, util.buildXml(params));
    const { error, data } = await util.validateBody(body);
    return { error, data };
  }

  // 接收微信付款确认请求
  getWcPayConfirmRequest = async (req) => {
    if (req.method !== 'POST') {
      const error = new Error();
      error.name = 'NotImplemented';
      throw error;
    }
    const rawBody = await util.getRawBody(req);
    const { error, body } = await util.validateBody(rawBody);
    if (error) {
      throw error;
    }
    return body;
  }

  getOrder = async (params) => {
    const { error, data } = await this.sendRequestTWcPay(params, URLS.ORDER_QUERY);
    if (error) {
      throw error;
    }
    return data;
  }

  closeOrder = async (params) => {
    const { error, data } = await this.sendRequestTWcPay(params, URLS.CLOSE_ORDER);
    if (error) {
      throw error;
    }
    return data;
  }

  refund = async (params) => {
    const { error, data } = await this.sendRequestTWcPay(params, URLS.REFUND);
    if (error) {
      throw error;
    }
    return data;
  }

  refundQuery = async (params) => {
    const { error, data } = await this.sendRequestTWcPay(params, URLS.REFUND_QUERY);
    if (error) {
      throw error;
    }
    return data;
  }

  downloadBill = async (params) => {
    const { error, data } = await this.sendRequestTWcPay(params, URLS.DOWNLOAD_BILL);
    if (error) {
      throw error;
    }
    return data;
  }
}
