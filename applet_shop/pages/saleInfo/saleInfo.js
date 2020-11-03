// pages/saleAfter/saleAfter.js
const app = getApp()
var api = require("../../common/api.js")
Page({

    /**
     * 页面的初始数据
     */
    data: {
        imgUrl: api.https_path,
        goodsinfo:[],
        info:[],
        shipping_name:'请选择快递公司',
        shipping_no_str:'请输入快递单号',
        shipping_no:'',
        shipping_id:0,
        returnInfo:[]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        const That = this
        api.islogin()
        That.setData({
            id: options.id,
        })
        const _data = {
            id: options.id,
        }
        That.loadinfo(_data)
    },

    pickerChange:function(e){
       
        let shippingList = this.data.shippingList;
        let index = e.detail.value
         // console.log(shippingList[index].shipping_id)
        this.setData({
          shipping_name : shippingList[index].shipping_name,
          shipping_id : shippingList[index].shipping_id
        })
    },

    wshipping_no:function(e){
        let shipping_no = e.detail.value;
        this.setData({
            shipping_no:shipping_no
        })
    },

    loadinfo: function(_data) {
        const That = this
        api.fetchPost(api.https_path + '/shop/api.after_sale/info', _data, function(err, res) {
            console.log(res);
            if (res.code == 1) {
                That.setData({
                    goodsinfo: res.goods,
                    info: res.info,
                    shippingList:res.shippingList,
                    returnInfo:res.returnInfo
                })
            } else if(res.code == -1){
              api.error_msg(res.msg, 2000,-1)
            }  else {
                api.error_msg(res.msg)
                setTimeout(function () {
                    wx.redirectTo({
                      url: '/pages/sales/sales',
                    })
                }, 1000)
            }
        })
    },
   
    postSale:function(){
        const That = this;
        let shipping_id = That.data.shipping_id
        let shipping_no = That.data.shipping_no
        let as_id = That.data.info.as_id

        if (shipping_id == '') {
            api.error_msg('请选择快递公司');
            return false;
        }

        if (shipping_no == '') {
            api.error_msg('请输入快递单号');
            return false;
        }

        if (shipping_no.length < 8) {
            api.error_msg('请输入正确的快递单号');
            return false;
        }

        let _data = {
            shipping_id:shipping_id,
            shipping_no:shipping_no,
            as_id:as_id
        }
        api.fetchPost(api.https_path + '/shop/api.after_sale/shipping', _data, function(err, res) {
            if (res.code == 1) {
                wx.showModal({
                    title: '提示',
                    content: '处理成功',
                    showCancel: false,
                    success(res) {
                        wx.redirectTo({
                            url: '/pages/sales/sales',
                        });
                    }
                })
            } else if(res.code == -1){
                api.error_msg(res.msg, 2000,-1)
            } else{
                api.error_msg(res.msg)
                setTimeout(function () {
                    wx.redirectTo({
                        url: '/pages/sales/sales',
                    })
                }, 1000)
            }
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})