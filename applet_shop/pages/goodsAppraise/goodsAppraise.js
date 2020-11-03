// pages/goodsAppraise/goodsAppraise.js
var api = require("../../common/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgBase: api.https_path,
    lists: [],
    goods_id : 0,
    pages:1,
    listscount: 0,
    isloaddata: true,
    _data : [0],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const That = this;
    let goods_id = options.goods_id;

    That.setData({
      goods_id:goods_id
    });
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
    const That = this;
    let goods_id = That.data.goods_id;
    let _pages = 1;
    let _data = {
      goods_id:goods_id
    }
    That.getList(_pages,_data);
  },
   // 获取列表
  getList:function(_pages,_data){
    const That = this
    const lists = That.data.lists
    const isloaddata = That.data.isloaddata
    let fail_time = [];
    if (isloaddata == true) {
        That.setData({
            isloaddata: false
        })
        api.pagelist(api.https_path + 'shop/api.comment/getListByGoods', _pages, _data, function(err, res) {
          
            if (res.code == 1) {
                if (res.data.list.length > 0) {
                    That.setData({
                        isloaddata: true,
                        lists: res.data.list,
                        listscount: res.data.total_count,
                        pages: parseInt(_pages) + 1
                    });
                } else {
                    That.setData({
                        isloaddata: false,
                    })
                }
            }
        })
    }
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