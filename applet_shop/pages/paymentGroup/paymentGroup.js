// pages/payment/payment.js
const app = getApp()
var util = require("../../utils/util.js")
var api = require("../../common/api.js")
var md5 = require("../../common/md5.js")
var sms = require("../../common/smscode.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgBase: api.https_path,
    goodsnumber:1,
    wordnum:0,
    goodsList: [], //商品列表
    totalGoodsPrice: 0, //商品总价格
    totalDiscount: 0, //总折扣价
    bounsData: [],
    orderTotal: 0,
    shippingFee: 0, //运费
    bonus_money: 0, //使用优惠券金额
    payInteger: 0, //实际支付金额整数
    payTotalDecimal: 0, //实际支付金额小数点
    address_id: 0, //地址id
    addressinfo: [], //地址信息
    rec_ids: [], //购物车id集合
    ableNum: 0, //可使用优惠卷数量
    bonus_id: 0, //使用优惠卷id, 为0不使用
    buy_msg: '', //留言
    join_id:0,
    fg_id:0,
    goods_img:'',
    fgInfo:[],
    payTotal:0,
    sku_val:'',
  },
  //数量减
  minus(e) {
    let goodsnumber = this.data.goodsnumber
    goodsnumber = goodsnumber <= 1 ? 1 : goodsnumber - 1
    this.setData({
      goodsnumber: goodsnumber
    });
    this.evalCart();
  },
  //数量加
  add(e) {
    let goodsnumber = parseInt(this.data.goodsnumber)
    goodsnumber += parseInt(1)
    this.setData({
      goodsnumber: goodsnumber
    });
    this.evalCart();
  }, 
  getWord(e){
    this.setData({
      wordnum: e.detail.cursor
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const That = this;
    console.log(options);
    That.setData({
      goodsnumber: options.number,
      fg_id: options.fg_id,
      join_id: options.join_id,
      sku_val:options.sku_val
    });
    let bonus_money = options.bonus_money != undefined ? options.bonus_money : 0;
    if (options.bonus_money != undefined) {
        That.setData({
            bonus_money: bonus_money
        })
    }
    let bonus_id = options.bonus_id != undefined ? options.bonus_id : 0;
    if (options.bonus_id != undefined) {
        That.setData({
            bonus_id: bonus_id
        })
    }
  },
  evalCart:function(){
    const _this = this;
    let _data = {
      number: _this.data.goodsnumber,
      fg_id:  _this.data.fg_id,
      join_id: _this.data.join_id,
      address_id:_this.data.address_id,
      sku_val:_this.data.sku_val
    }
    
    api.fetchPost(api.https_path + 'fightgroup/api.flow/evalCart', _data, function(err, res) {
      console.log(res);
      if (res.code == 0) {
        api.error_msg(res.msg);
        return false;
      }else{
        _this.setData({
          goodsList:res.buyGoods,
          totalGoodsPrice:res.totalGoodsPrice,
          orderTotal:res.orderTotal,
          goods_img:res.goods_img,
        })

        _this.evalShippingFee();
        _this.getBonusList()
      }
    })
  },
  getFgInfo:function(fg_id){
    const _this = this;
    let _data = {
      fg_id:fg_id
    }
    api.fetchPost(api.https_path + 'fightgroup/api.Index/getFgInfo', _data, function(err, res) {
      if (res.code == 1) {
         _this.setData({
          fgInfo:res.fgInfo,
        })
      }else{
        api.error_msg(res.msg);
        return false;
      }
    });
  },
  //去选择优惠券
  selectbonus: function() {
      const _this = this
      let bonus_id = _this.data.bonus_id;
      let fg_id = _this.data.fg_id;
      let number = _this.data.goodsnumber;
      let join_id = _this.data.join_id;
      let sku_val=_this.data.sku_val
      console.log(number);
      wx.navigateTo({
          url: '/pages/couponsGroup/couponsGroup?payTotal=' + _this.data.payTotal + '&bonus_id=' + bonus_id +'&fg_id=' + fg_id +"&number="+ number + '&join_id=' +join_id + '&sku_val=' + sku_val,
      })

  },
  //获取优惠券列表
  getBonusList: function() {
      const _this = this;
      let data = {
        goods_type:2,
        fg_id:_this.data.fg_id,
        number:_this.data.goodsnumber,
        is_sel:1,
        sku_val:_this.data.sku_val
      };
      api.fetchPost(api.https_path + 'shop/api.Bonus/getBonusListToCheckout', data, function(err, res) {
          // console.log(res)
          if (res != null) {
              if (res.code == 0) {
                  api.error_msg(res.msg)
                  return false;
              }
              // let bounsData = res.data;

              // if (_this.data.totalGoodsPrice != 0) {
              //   bounsData.totalGoodsPrice = parseFloat(_this.data.totalGoodsPrice);
              // } else {
              //   bounsData.totalGoodsPrice = -1;
              // }
              _this.setData({
                  ableNum: res.data.ableNum,
              })
              // console.log(bounsData);
          }
      })
  },
  //获取收货地址
  getAddress: function() {
      const _this = this;
      let data = {};

      api.fetchPost(api.https_path + 'member/api.address/getList', data, function(err, res) {
          // console.log(res)
          if (res.code == 1 && res.list) {
            _this.setData({
                addressinfo: res.list[0],
                address_id: res.list[0].address_id,
            })
          }
      })
  },
  //计算运费
  evalShippingFee: function() {
      const _this = this;
      let address_id = _this.data.address_id;
      if (address_id <= 0) {
        api.error_msg('请先选择收货地址.');
        return false;
      }
      let fg_id = _this.data.fg_id;
      let number =  _this.data.goodsnumber;
      let data = {
          address_id: _this.data.address_id,
          number: number,
          fg_id:fg_id
      }
      api.fetchPost(api.https_path + '/fightgroup/api.flow/evalShippingFee', data, function(err, res) {
        console.log(res);
          if (res.code == 1) {
              _this.setData({
                  shippingFee: res.shippingFee,
              })
          }
          _this.evalPrice();
      })
  },
  //计算支付金额
  evalPrice: function() {
      const _this = this;
      let orderTotal = _this.data.orderTotal;
      let shippingFee = _this.data.shippingFee;
      let bonus_money = _this.data.bonus_money;
      // console.log(bonus_money);
      let payTotal = Number(orderTotal) + Number(shippingFee.shipping_fee) - Number(bonus_money);
      // console.log(payTotal);

      let payTotal_arr = payTotal.toFixed(2);
      payTotal_arr = payTotal_arr.split(".");

      _this.setData({
          payTotal: payTotal, //总支付金额
          payInteger: payTotal_arr[0],
          payTotalDecimal: payTotal_arr[1],
          shippingFee: shippingFee
      })
  },
  // 下单
  doaddorder:function(){
    const That = this;
    let used_bonus_id = That.data.bonus_id;
    let buy_msg = That.data.buy_msg;
    let address_id = That.data.address_id;
    let sku_val= That.data.sku_val
    if (address_id <= 0) {
      api.error_msg('请设置收货地址后，再操作.');
      return false;
    }
    let fg_id = That.data.fg_id;
    let join_id = That.data.join_id;
    let number =  That.data.goodsnumber;

    const _data = {
      used_bonus_id:used_bonus_id,
      buy_msg:buy_msg,
      address_id:address_id,
      fg_id:fg_id,
      join_id:join_id,
      number:number,
      pay_id: 8,
      sku_val:sku_val
    }

    api.fetchPost(api.https_path + '/fightgroup/api.flow/addOrder', _data, function(err, res) {
        console.log(res)
        if (res.code == 1) {
            wx.redirectTo({
                url: '/pages/payorder/payorder?order_id=' + res.order_id,
            })

        } else {
            api.error_msg(res.msg)
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
    wx.showLoading({
        title: '数据加载中',
    })
    setTimeout(function() {
        wx.hideLoading()
    }, 1500)
    const _this = this
    _this.getAddress();
    _this.getFgInfo(_this.data.fg_id);
    _this.evalCart();
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