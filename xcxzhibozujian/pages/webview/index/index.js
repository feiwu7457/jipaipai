//index.js
const app = getApp();

Page({
  onLoad: function (options) {
    var openid = wx.getStorageSync('openid');
    if (openid == '' ){
      var that = this;
      setTimeout(function () {
        that.onLoad(options);
      }, 1000);
      return false;
    }
    var parameter = 'is_xcx=1';
    parameter += '&xcx_openid=' + openid;
    var timestamp = Date.parse(new Date()) / 1000;
    parameter += '&timestamp=' + timestamp;
    parameter += '&sgin=' + app.md5(openid + '_' + timestamp + '_' + wx.getStorageSync('apiKey'));//加密签名，保证传递的openid正确
    
    var webViewUrl = app.config.domain_name;
    if (typeof (options.webViewUrl) != 'undefined') {//分享进入
      options.webViewUrl = options.webViewUrl.replace('|_|', '?');
      var re = new RegExp('_#_', 'g');
      options.webViewUrl = options.webViewUrl.replace(re, '&');
      return this.setData({ 'webViewUrl': webViewUrl + options.webViewUrl + '&' + parameter });
    }
    if (wx.getStorageSync('defWebUrl') !== false) {
      webViewUrl += wx.getStorageSync('defWebUrl');
    }
    this.setData({'webViewUrl': webViewUrl += '?' + parameter});
    console.log(this.data.webViewUrl);
  }, 
  msgHandler: function (e) {    //(h5向小程序传递参数）
    var length = e.detail.data.length;
    this.setData({ 'share_data': e.detail.data[length-1] });
  },
  onShareAppMessage: function (res) {//分享处理
    var webViewUrl = wx.getStorageSync('defWebUrl');
    if (typeof (this.data.share_data.share_url) != 'undefined'){
      webViewUrl = this.data.share_data.share_url;
      if (webViewUrl.indexOf('?') >= 0){
        webViewUrl += '&share_token=' + this.data.share_data.share_token;
      }else{
        webViewUrl += '?share_token=' + this.data.share_data.share_token;
      }
    }
    webViewUrl = webViewUrl.replace('?', '|_|');
    var re = new RegExp('&', 'g');
    webViewUrl = webViewUrl.replace(re, '_#_');
    console.log(webViewUrl);
    return {
      title: typeof (this.data.share_data.share_title) != 'undefined' ? this.data.share_data.share_title : wx.getStorageSync('siteName'),
      desc: '',
      path: '/pages/webview/index/index?webViewUrl=' + webViewUrl
    }

  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  }
})