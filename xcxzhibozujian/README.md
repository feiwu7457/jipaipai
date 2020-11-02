一、web加载微信提供的js
<script type="text/javascript" src="https://res.wx.qq.com/open/js/jweixin-1.3.2.js"></script>

二、小程序分享 web向小程序通知分享的网址和标题
<script type="text/javascript">

    wx.miniProgram.getEnv(function (res) {
        if (res.miniprogram) {
            wx.miniProgram.postMessage({
                data: {
                    share_token: '{$userInfo.token}',
                    share_title: '{$title}  - {$setting.shop_title}',
                    share_url:'{$_SERVER["REQUEST_URI"]}'
                }
            });
        }
    })
</script>

三、调起小程序支付，$jsApiParameters为小程序支付的JSAPI
<script type="text/javascript">
    wx.miniProgram.getEnv(function (res) {
        if (res.miniprogram) {
            var jsApiParameters = $jsApiParameters;
            var prepay_id = jsApiParameters.package;
            prepay_id = prepay_id.replace('prepay_id=', '');
            var params = '?timestamp=' + jsApiParameters.timeStamp + '&nonceStr=' + jsApiParameters.nonceStr + '&prepay_id=' + prepay_id + '&signType=' + jsApiParameters.signType + '&paySign=' + jsApiParameters.paySign;
            wx.miniProgram.navigateTo({
                url: '/pages/wxpay/wxpay' + params
            })
        }
    })
 </script>

=============以上为web的相关的===================

四、小程序 app.js中32行通过接口获取当前用户的小程序openid，
1、用于传回加载的h5页记录
2、获取JSAPI时使用到
3、h5页依然使用公众号的登陆，但不能使用弹窗授权，否则小程序将无法过审，php这边是使用静默授权，登陆后与小程序的openid关联


五、用户直接进入直播间，会触发小程序 app.js中58行onShow中的方法，在这里调用接口，判断是否新建用户，绑定上下级关系


