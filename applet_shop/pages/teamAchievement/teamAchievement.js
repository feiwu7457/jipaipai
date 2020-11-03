// pages/result/result.js
const app = getApp()
var api = require("../../common/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    total_achievement:0.00,//总业绩
    my_achievement:0.00,// 我的业绩
    emptyData: false, //有无数据
    lists: [],
    page: 0,
    load_more: true,
    user_info:[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  	const _this = this
    api.islogin();
    _this.publicloadlist();
  },

  publicloadlist: function() {
    const _this = this

    let data = {
      p: _this.data.page + 1,
    }

    api.fetchPost(api.https_path + '/member/api.users_achievement/getList', data, function(err, res) {

      console.log(res)
      if (res.code == 0) {
        api.error_msg(res.msg)
        return false
      } else {

        _this.setData({
          total_achievement: res.total_achievement,
          my_achievement: res.my_achievement,
          user_info:res.user_info,
        })
        if (res.list.length > 0) {
          _this.setData({
            ["lists[" + _this.data.page + "]"]: res.list,
            load_more: true,
            emptyData: false
          })
        } else {
          api.error_msg("没有更多数据!")
          _this.setData({
            load_more: false,
          })
          if (_this.data.page == 0 && res.list.length == 0) {
            _this.setData({
              emptyData: true,
            })
          }
        }

      }
    });


  },

  /**
   * 滚动加载数据
   */
  scrolltloadlist: function() {
    let _this = this;
    if (_this.data.load_more == true) {
      let more = _this.data.page + 1;
      _this.setData({
        page: more,
      });
      _this.publicloadlist();
    }
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