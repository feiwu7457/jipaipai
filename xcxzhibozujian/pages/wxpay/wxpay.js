// pages/wxpay/wxpay.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    //页面加载调取微信支付（原则上应该对options的携带的参数进行校验）
    that.requestPayment(options);
  },
  //根据 obj 的参数请求wx 支付
  requestPayment: function (obj) {
    //console.log(obj); 
    //调起微信支付
    wx.requestPayment({
      //相关支付参数
      'timeStamp': obj.timestamp,
      'nonceStr': obj.nonceStr,
      'package': 'prepay_id=' + obj.prepay_id,
      'signType': obj.signType,
      'paySign': obj.paySign,
      //小程序微信支付成功的回调通知
      'success': function (res) {
        console.log('ok'); // 错误信息  
        wx.navigateBack();
      },
      //小程序支付失败的回调通知
      'fail': function (res) {        
        if (res.errMsg === "requestPayment:fail cancel") {
          // 用户取消支付  
          wx.navigateBack();
          return
        }
        if (res.errMsg === "requestPayment:fail") {
          console.log(res.err_desc) // 错误信息  
          wx.navigateBack();
          return
        }  

      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})