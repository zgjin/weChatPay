import util from './util';

const requireData = {
  appid: true,
  partner_key: true,
  mch_id: true,
  device_info: false,
  nonce_str: true,
  sign: false,
  body: true,
  detail: false,
  attach: false,
  out_trade_no: true,
  fee_type: false,
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
    // partner_key
    this.config = config || {};
  }

  // 调用微信统一下单API，获取预订单的信息
  getReadyPayParams = async (order) => {
    const default_params = {
      out_trade_no: `XSDX${util._generateTimeStamp()}`, // 商户订单号XSDX+'时间戳'
      nonce_str: util._generateNonceStr() // 随机字符串，不长于32位
    };
    const params = Object.assign({}, this.config, default_params, order);
    console.log('getReadyPayParams.fullparams', params);
    const vali = util.validate(params, requireData);
    if (vali) {
      throw new Error(`缺少参数${vali}`);
    }
    // 发送请求到微信
    const unifiRequired = ['body', 'out_trade_no', 'total_fee', 'spbill_create_ip', 'trade_type'];
    if (params.trade_type === 'JSAPI') {
      unifiRequired.push('openid');
    } else if (params.trade_type === 'NATIVE') {
      unifiRequired.push('product_id');
    }
    const { error, data } = await this.sendRequestTWcPay(params, URLS.UNIFIED_ORDER, { required: unifiRequired });
    console.log('getReadyPayParams.aftersendRequestTWcPay.result', data);
    if (error) {
      throw error;
    }
    // 返回参数重新生成sign,{app_id,partner_key,prepayid,nonce_str,timeStamp,package:prepay_id=}
    // APP与JSAPI生成签名的package字段的值不同
    let packageVal = 'Sign=WXPay';
    if (params.trade_type === 'JSAPI') {
      packageVal = `prepay_id=${data.prepay_id}`;
    }
    const payParams = Object.assign({}, {
      appid: data.appid || this.config.appid,
      partnerid: this.config.mch_id,
      prepayid: data.prepay_id,
      timestamp: util._generateTimeStamp(),
      noncestr: util._generateNonceStr(),
      package: packageVal
    });
    payParams.sign = util._getSign(payParams, this.config.partner_key);

    if (order.trade_type === 'NATIVE') {
      params.code_url = data.code_url;
    }
    console.log('getReadyPayParams.result', payParams);
    return payParams;
  }

  // TODO:收货地址共享接口,Generate parameters for `WeixinJSBridge.invoke('editAddress', parameters)`.
  // getEditAddressParams = async (params) => {
  // }

  sendRequestTWcPay = async (params, url, options) => {
    await util.checkRequireData(params, options);
    params.sign = util._getSign(util.toString(params), this.config.partner_key);
    delete params.partner_key;
    const body = await util._httpRequest(url, util.buildXml(params));
    const { error, data } = await util.validateBody(body, this.config.partner_key);
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
    const { error, data } = await util.validateBody(rawBody, this.config.partner_key);
    return { error, data };
  }

  /**
   * @params{out_trade_no}
   * @config{appid,mch_id}
   */
  getOrder = async (params) => {
    const default_params = {
      nonce_str: util._generateNonceStr() // 随机字符串，不长于32位
    };
    const obj = Object.assign({}, this.config, default_params, params);
    const { error, data } = await this.sendRequestTWcPay(obj, URLS.ORDER_QUERY, { required: ['transaction_id|out_trade_no'] });
    if (error) {
      throw error;
    }
    return data;
  }

  closeOrder = async (params) => {
    const { error, data } = await this.sendRequestTWcPay(params, URLS.CLOSE_ORDER, { required: ['out_trade_no'] });
    if (error) {
      throw error;
    }
    return data;
  }

  refund = async (params) => {
    const { error, data } = await this.sendRequestTWcPay(params, URLS.REFUND, { required: ['transaction_id|out_trade_no', 'out_refund_no', 'total_fee', 'refund_fee'] });
    if (error) {
      throw error;
    }
    return data;
  }

  refundQuery = async (params) => {
    const { error, data } = await this.sendRequestTWcPay(params, URLS.REFUND_QUERY, { required: ['transaction_id|out_trade_no|out_refund_no|refund_id'] });
    if (error) {
      throw error;
    }
    return data;
  }

  downloadBill = async (params) => {
    const { error, data } = await this.sendRequestTWcPay(params, URLS.DOWNLOAD_BILL, { required: ['bill_date', 'bill_type'] });
    if (error) {
      throw error;
    }
    return data;
  }
}

export default Payment;

