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
    let params = Object.assign({}, this.config, default_params, order);
    const vali = util.validate(params, requireData);
    if (vali) {
      return new Error(`缺少参数${vali}`);
    }
    // 发送请求到微信
    return null;
  };

  // 下单api
  unifiedOrder = async (params) => {
    params.sign = util._getSign(util.toString(params));
    try {
      let body = await util._httpRequest(URLS.UNIFIED_ORDER, util.buildXml(params));
      let { error, data } = await util.validateBody(body);
      
    } catch (e) {
      console.log(`发生了错误:${e.message}`);
      return e;
    }
  }
}
