var config = require('/utils/config.js');
var md5 = require('/utils/md5.js');
var api = require('/utils/api.js');
let livePlayer = requirePlugin('live-player-plugin');//直播插件
//模块化
//app.js
App({
  onLaunch: function () {
    // 登录
    wx.login({
      success: function (res) {
        wx.getSystemInfo({
          success: function (resb) {
            if (resb.model.search('iPhone X') != -1) {
              wx.setStorageSync('isIphoneX', true);
            } else{
              wx.setStorageSync('isIphoneX', false);
            }
          }
        })
        //获取小程序openid
        var timestamp = Date.parse(new Date()) / 1000;
        if (wx.getStorageSync('openidExpiredTime') != false){
          if (timestamp >= wx.getStorageSync('openidExpiredTime')){
            wx.clearStorageSync('openid');//销毁
          }
        }
        if (wx.getStorageSync('openid') == false) {
          wx.showNavigationBarLoading();
          wx.request({
            method: 'GET',
            url: config.domain_name + '/weixin/api.Miniprogram/getConfig?code=' + res.code,
            success: (res) => {
              console.log(res);
              wx.setStorageSync('openid', res.data.openid);
              wx.setStorageSync('openidExpiredTime', timestamp + 86400);//缓存有效时间一天
              wx.setStorageSync('apiKey', res.data.apiKey);
              wx.setStorageSync('defWebUrl', res.data.defWebUrl);
              wx.setStorageSync('siteName', res.data.siteName);
              wx.setStorageSync('siteLogo', res.data.siteLogo);
              wx.hideNavigationBarLoading();
            },
            fail: (err) => {
              wx.showToast({
                title: err.errMsg,
                icon: "loading",
                durantion: 2000
              })
              wx.hideNavigationBarLoading();
            }
          });
        }
      }, fail: function () {

      }
    })
},
  onShow(options) {
    // 分享卡片入口场景才调用getShareParams接口获取以下参数
    if (options.scene == 1007 || options.scene == 1008 || options.scene == 1044) {
      livePlayer.getShareParams()
        .then(data => {
          console.log('get room id', data.room_id) // 房间号
          console.log('get openid', data.openid) // 用户openid
          console.log('get share openid', data.share_openid) // 分享者openid，分享卡片进入场景才有
          console.log('get custom params', data.custom_params) // 开发者在跳转进入直播间页面时，页面路径上携带的自定义参数，这里传回给开发者
          api.fetchPost( "weixin/api.live_room/liveLogin", data, function (err, res){})
        }).catch(err => {
          console.log('get share params', err)
        })
    }
  },
  config: config,
  md5: md5.hexMD5,
  api: api
})