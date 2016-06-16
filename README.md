# weChatPay

基于es6的微信支付for Nodejs

## 初始化

`import Payment form './payment';`

`let initConfig = {`

  &nbsp;&nbsp;`partnerKey: '<partnerKey>',`

  &nbsp;&nbsp;`appid: '<appid>',`

  &nbsp;&nbsp;`mch_id: '<mch_id>',`

  &nbsp;&nbsp;`notify_url: '<notify_url>'`

`}`

## 付个钱

`let order = {`
&nbsp;&nbsp;`body:<商品的描述>,`

&nbsp;&nbsp;`attach:<商品的附属描述>,`

&nbsp;&nbsp;`total_fee:<商品的费用>,`

&nbsp;&nbsp;`spbill_create_ip: <终端的ip>,`

&nbsp;&nbsp;`trade_type: <交易类型>`

`}`

`let payParams = await payment.getReadyPayParams(order);`

* 注意：await一定要处于try/catche中。

## 接收微信付款确认请求

`app.use('<notify_url>', async (req,res,next) =>{`

  `let body = await payment.getWcPayConfirmRequest(req);`

`});`




