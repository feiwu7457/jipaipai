const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    page:0,
    emptyData:false,
    load_more:true
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      domain_name:app.config.domain_name
    })
    this.loadData();
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
      page: _this.data.page + 1
    }
    app.api.fetchPost( "weixin/api.live_room/getList", data, function (err, res)    {
      wx.hideLoading()
      if (res.code == 0) {
        app.api.error_msg(res.msg)
        return false
      } 
      if (res.data.length < 1) {
        if (_this.data.page == 0){
          _this.setData({
            emptyData: true,
          })
        }else{
          app.api.error_msg("没有更多数据!")
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
      let more = _this.data.page + 1;
      _this.setData({
        page: more,
      });
      _this.loadData();
    }
  }
})