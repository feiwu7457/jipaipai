const app = getApp()
var api = require("../../common/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    pic_host:api.https_path,
    lists: [],
    is_tishi:0,
    tipTxt:'您已提交审核！',
    PayUser:[],
    role_directions_status:0,
    role_directions:[],
    rg_id:0,
    checkVIP:3,
    checkState:0,
    myOrderInfo:[]
  },
  changeImg(e) {
    
  },
  againBuy:function(){
    let That = this;
    That.setData({
      checkVIP:0
    });
  },
  goCustomer:function(){
    wx.navigateTo({
      url: '/pages/customer/customer'
    })
  },
  closeModal1:function(){
    let That = this;
    That.setData({
      is_tishi:0
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let That = this;
    That.getMyOrder();
    That.getRoleGoodsList();
    // That.getPayUser();
  },
  getRoleGoodsList:function(){
    let That = this;
    api.fetchPost(api.https_path + 'distribution/api.role_goods/getListAll', {}, function(err, res) {
      if (res.code == 1) {
        That.setData({
          lists:res.list,
          role_directions_status:res.role_directions_status,
          role_directions:res.role_directions
        });
      }
    })
  },
  radioChange: function (e) {
    this.setData({
      rg_id:e.target.dataset.rg_id,
      role_id:e.target.dataset.role_id
    });

    let _data = {
      role_id:e.target.dataset.role_id
    }
    this.getPayUser(_data);
  },
  // 获取交款上级用户信息
  getPayUser:function(_data){
    let That = this;
    api.fetchPost(api.https_path + 'member/api.users/getPayUser', _data, function(err, res) {
      if (res.code == 1) {
        That.setData({
          PayUser:res.info
        });
      }else{
        api.error_msg(res.msg);
      }
    })
  },
  getMyOrder:function(){
    let That = this;
    api.fetchPost(api.https_path + 'distribution/api.role_goods/MyOrder', {} , function(err, res) {
      if (res.code == 1) {
        That.setData({
          checkVIP:res.checkVIP,
          checkState:res.checkState,
          myOrderInfo:res.info
        });
        if (res.checkVIP == 1) {
          let _data = {};
          _data.receivables_user=res.info.receivables_user
          That.getPayUser(_data);
        }
        

      }else{
        api.error_msg(res.msg);
        return false;
      }
    })
  },
  /**
   * 提交申请
   */
  submitPay:function() {
    const That = this;
    wx.showModal({
      title: '提示',
      content: '确定要提交申请吗？',
      success: function (sm) {
        if (sm.confirm) {            
            let rg_id = That.data.rg_id;
            let receivables_user = That.data.PayUser.user_id;
            if(rg_id <= 0){
              api.error_msg('请选择升级类型');
              return false;
            }else{
              let _data = {
                rg_id : rg_id,
                receivables_user:receivables_user,
              }
              api.fetchPost(api.https_path + 'distribution/api.role_goods/addOrder', _data , function(err, res) {
                if (res.code == 1) {
                  api.success_msg('提交成功！');
                  setTimeout(function() {
                      That.getMyOrder();
                    }, 1500)
                }else{
                  api.error_msg(res.msg);
                  return false;
                }
              });
            }
          } else if (sm.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // wx.hideTabBar({})
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