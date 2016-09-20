import utility from 'utility';
import xml2js from 'xml2js';
import request from 'request';

const RETURN_CODES = {
  SUCCESS: 'SUCCESS',
  FAIL: 'FAIL'
};

const validate = (obj, requireData) => {
  for (const key of Object.keys(requireData)) {
    if (requireData[key]) {
      if (!obj[key]) {
        return key;
      }
    }
  }
  return null;
};

const _generateTimeStamp = () => `${parseInt(+new Date() / 1000, 10)}`;

const _generateNonceStr = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const maxPos = chars.length;
  let noceStr = '';
  for (let i = 0; i < (length || 32); i++) {
    noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return noceStr;
};

const toString = (params) => {
  for (const key of Object.keys(params)) {
    if (params[key] !== undefined && params[key] !== null) {
      params[key] = params[key].toString();
    }
  }
  return params;
};

const _toQueryString = (object) =>
  Object.keys(object).filter((key) => object[key] !== undefined && object[key] !== '').sort()
  .map((key) => `${key}=${object[key]}`)
  .join('&');

const _getSign = (params, key) => {
  const pkg = Object.assign({}, params);
  const partner_key = pkg.partner_key || key || '';
  if (!partner_key) {
    throw new Error('invalidPartnerKey');
  }
  delete pkg.partner_key;
  delete pkg.sign;
  const string_query = _toQueryString(pkg);
  const stringSignTemp = `${string_query}&key=${partner_key}`;
  return utility.md5(stringSignTemp).toUpperCase();
};

const buildXml = (obj) => {
  const builder = new xml2js.Builder();
  return builder.buildObject({ xml: obj });
};

const _httpRequest = (url, data) => new Promise((reslove, reject) => {
  request({
    url,
    method: 'POST',
    body: data
  }, (err, response, body) => {
    if (err) {
      reject(err);
    }
    reslove(body);
  });
});

const validateBody = (body, key) => new Promise((reslove, reject) => {
  xml2js.parseString(body, {
    trim: true,
    explicitArray: false
  }, (err, json) => {
    if (err) {
      err.name = 'XMLParseError';
      reject(err);
    }

    let error = null;
    const data = json ? json.xml : {};
    if (data.return_code === RETURN_CODES.FAIL) {
      error = new Error(data.return_msg);
      error.name = 'ProtocolError';
    } else if (data.result_code === RETURN_CODES.FAIL) {
      error = new Error(data.err_code);
      error.name = 'BusinessError';
    } else if (key && _getSign(data, key) !== data.sign) {
      error = new Error();
      error.name = 'InvalidSignature';
    }

    reslove({ error, data });
  });
});

const getRawBody = (req) => new Promise((reslove, reject) => {
  if (req.rawBody) {
    reslove(req.rawBody);
  }

  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    req.rawBody = data;
    reslove(data);
  });
});

const checkRequireData = (params, options) => new Promise((reslove, reject) => {
  const required = options.required || [];
  const missing = [];
  required.forEach((key) => {
    const alters = key.split('|');
    for (let i = alters.length - 1; i >= 0; i--) {
      if (params[alters[i]]) {
        return;
      }
    }
    missing.push(key);
  });

  if (missing.length) {
    reject(new Error(`missing params :' ${missing.join(',')}`));
  }
  reslove('reslove');
});

export default {
  validate,
  _generateTimeStamp,
  _generateNonceStr,
  toString,
  _getSign,
  buildXml,
  _httpRequest,
  validateBody,
  getRawBody,
  checkRequireData
};
