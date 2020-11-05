const app = getApp()
var api = require("../../common/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    page:0,
    domain_name: api.domain_name,
    emptyData:false,
    load_more:true
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const _this = this;
    _this.setData({
      page: 0,
      load_more:true
    })
    // _this.loadData();
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
     const _this = this;
     _this.setData({
      page: 0,
      load_more:true
    })
     _this.loadData();
  },

  loadData: function () {
    const _this = this;
    if (_this.data.load_more == false) {
      return false;
    }
    wx.showLoading({
      title: '加载中.',
    })
    let data = {
      page: _this.data.page + 1,
    }
    api.fetchPost(api.https_path + "weixin/api.live_room/getList", data, function (err, res)    {
      wx.hideLoading()
      if (res.code == 0) {
        api.error_msg(res.msg)
        return false
      }
      if (res.data.length < 1) {
        if (_this.data.page == 0){
          _this.setData({
            emptyData: true,
          })
        }else{
          api.error_msg("没有更多数据!")
          _this.setData({
            load_more: false,
          })
        }
        return false;
      }
      _this.setData({
        ["lists[" + _this.data.page + "]"]: res.data,
        load_more: true,
        page: _this.data.page+1
      })

    })
  },
  /**
    * 滚动加载数据
    */
  scrolltloadlist: function () {
    let _this = this;
    if (_this.data.load_more == true) {
      _this.loadData();
    }
  }
})