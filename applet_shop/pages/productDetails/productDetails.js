const app = getApp()
var api = require("../../common/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    goods_id: 0, //商品id
    isCollect: 0, //收藏状态
    is_spec: 0, //是否多规格商品
    indicatorDots: true, //轮播图参数
    autoplay: true,
    interval: 5000,
    duration: 1000, //轮播图参数
    imgBase: app.globalData.imgUrl, //图片域名
    imgUrls: [], //商品轮播图
    guigeModel: 0, //购买弹窗
    goods: [], //商品数据
    skuArr: [], //规格模型
    coArr: [], //选中的规格数组  {0:3,1:5}
    specifications: "", //选中的规格 拼接后的字符串  3:5
    skuprice: [], //规格价格数组
    valprice: [], //普通及规格商品显示单价
    pinglun: [], //评论列表
    plnum: 0, //评论数
    cartInfo: [], //购物车数据
    goodsnumber: 1, //购买数量
    maxnum: 1, //商品库存
    role_id:0,
    activity_is_on:0,// 是否参与活动
    isshowBtn:1,
    showSku:'',
    showSkuName:'',
    skuImgs:'',
    skuImgsArr:[],
    tan_text:'',
    showTime: ['00', '00', '00'],// 显示时间
    time:0,
    seckilldata:[],
    exp_price:[],
    exp_min_price:[],
    exp_max_price:[],
    f_specifications:'',
    is_tan:0,
    live_room:0,
    room_id: 0,
    roomGoods: '',
    user_share_token: '',
  },
  goCustomer:function(){
    wx.navigateTo({
      url: '/pages/customer/customer'
    })
  },
  openGG() {
    this.setData({
      guigeModel: 1
    });
  },
  closeGG() {
    this.setData({
      guigeModel: 0
    });
  },
  collect() {
    let That = this;
    api.fetchPost(api.https_path + 'shop/api.goods/collect', {
      goods_id: That.data.goods_id
    }, function(err, res) {
      if (res.code == 1) {
        That.setData({
          isCollect: !That.data.isCollect
        });
      } else if(res.msg == '请登陆后再操作.'){
        var goods_id = That.data.goods_id
        var share_token = That.data.share_token
        wx.redirectTo({
          url: '/pages/authorizeLogin/authorizeLogin?goods_id=' + goods_id + '&share_token=' + share_token,
        })
        // api.error_msg(res.msg, 2000,-1)
      } else {
        api.error_msg(res.msg)
      }
    });

  },
  toindex() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  tocart() {
    wx.switchTab({
      url: '/pages/cart/cart',
    })
  },
  toqrcode() {
    let That = this;
    wx.navigateTo({
      url: '/pages/goodsQR/goodsQR?goods_id=' + That.data.goods_id,
    })
  },
  //商品数量--
  minus: function() {
    let That = this;
    let endnum = 0;
    //大于1则减1
    if (That.data.goodsnumber > 1) {
      endnum = That.data.goodsnumber - 1;
    }
    //小于1则等于1
    if (endnum < 1) {
      endnum = 1;
    }
    //处理input的超库存
    if (endnum > That.data.maxnum) {
      endnum = That.data.maxnum;
    }

    That.setData({
      goodsnumber: endnum
    })
  },
  //商品数量++
  add: function() {
    let That = this;
    let endnum = 0;
    //低于库存则+1，否则等于库存
    endnum = That.data.goodsnumber < That.data.maxnum ? ++That.data.goodsnumber : That.data.maxnum;
    //数量不能小于1
    if (endnum < 1) {
      endnum = 1;
    }
    That.setData({
      goodsnumber: endnum
    })
  },
  input_num: function(e) {
    let That = this;
    That.setData({
      goodsnumber: e.detail.value
    })
  },
  //选规格，切换颜色，调整单价及库存
  changColor: function(e) {
    let That = this;
    let pid = e.target.dataset.pid;
    let id = e.target.dataset.id;
    That.setData({
      ["coArr." + pid]: id
    });
    let coArr = That.data.coArr;
    let skuprice = That.data.skuprice;
    let skuImgsArr = That.data.skuImgsArr;
    let str = "";
    for (var index in coArr) {
      if (str == "") {
        str += coArr[index];
      } else {
        str += ":" + coArr[index];
      }
    }
    if (skuprice != null && skuprice[str] != undefined) {
      let activity_is_on = That.data.activity_is_on
      if (activity_is_on == 0) {
        That.setData({
          valprice: skuprice[str].exp_price,
        })
      }
      let showSku = skuprice[str].sku_name.replace(',',' - ');
      let showSkuName = skuprice[str].sku_name.replace(',',' / ');
      let number = That.data.goodsnumber;
      //根据所选属性修改价格及库存
      That.setData({

        maxnum: skuprice[str].goods_number,
        specifications: str,
        skuImgs:skuImgsArr[str],
        showSku:showSku,
        showSkuName:showSkuName,
        goodsnumber:number
      })
      That.initActivity();
    }
  },
  //添加购物车
  addcart: function() {
    let That = this;
    let specifications = That.data.specifications;
    if (specifications == '' && That.data.goods.is_spec == 1) {
      api.error_msg('请选择规格.');
      return false;
    }
    let sku_id = 0;
    if (specifications != '') {
      let skuprice = That.data.skuprice
      sku_id = skuprice[specifications].sku_id
    }
    let activity_is_on = That.data.activity_is_on
    let is_tan = That.data.is_tan
    let prom_type = 0;
    let prom_id = 0;
    if (activity_is_on == 1 && is_tan == 0) {
      prom_type = That.data.seckilldata.prom_type;
      prom_id = That.data.seckilldata.prom_id;
    }
    var room_id = That.data.room_id;
    api.fetchPost(api.https_path + 'shop/api.flow/addcart', {
      goods_id: That.data.goods_id,
      specifications:specifications,
      type: "oncart",
      number: That.data.goodsnumber,
      prom_id:prom_id,
      prom_type:prom_type,
      sku_id:sku_id,
      room_id: room_id
    }, function(err, res) {
      if (res.code == 1) {
        api.success_msg(res.msg, 1000);
      } else if(res.msg == '请登陆后再操作.'){
        var goods_id = That.data.goods_id
        var share_token = That.data.share_token
        wx.redirectTo({
          url: '/pages/authorizeLogin/authorizeLogin?goods_id=' + goods_id + '&share_token=' + share_token,
        })
        // api.error_msg(res.msg, 2000,-1)
      } else {
        api.error_msg(res.msg, 1500);
      }
    })
  },
  buy_now: function() {
    let That = this;
    let specifications = That.data.specifications;
    if (specifications == '' && That.data.goods.is_spec == 1) {
      api.error_msg('请选择规格.');
      return false;
    }
    let sku_id = 0;
    if (specifications != '') {
      let skuprice = That.data.skuprice
      sku_id = skuprice[specifications].sku_id
    }


    let activity_is_on = That.data.activity_is_on
    let is_tan = That.data.is_tan
    let prom_type = 0;
    let prom_id = 0;
    console.log(activity_is_on,is_tan);
    if (activity_is_on == 1 && is_tan == 0) {
      prom_type = That.data.seckilldata.prom_type;
      prom_id = That.data.seckilldata.prom_id;
    }
    var room_id = That.data.room_id;
    api.fetchPost(api.https_path + 'shop/api.flow/addcart', {
      goods_id: That.data.goods_id,
      specifications: specifications,
      type: "onbuy",
      number: That.data.goodsnumber,
      prom_id:prom_id,
      prom_type:prom_type,
      sku_id:sku_id,
      room_id: room_id
    }, function(err, res) {
      if (res.code == 1) {
        wx.navigateTo({
          url: '/pages/payment/payment?rec_id=' + res.rec_id,
        })
      } else if(res.msg == '请登陆后再操作.'){
        var goods_id = That.data.goods_id
        var share_token = That.data.share_token
        wx.redirectTo({
          url: '/pages/authorizeLogin/authorizeLogin?goods_id=' + goods_id + '&share_token=' + share_token,
        })
        // api.error_msg(res.msg, 2000,-1)
      } else  {
        api.error_msg(res.msg, 1500);
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let That = this;
    var room_id = 0;
    console.log(options);
    if(options.room_id){
      room_id = options.room_id;
      That.setData({
        room_id: room_id
      })
      api.putcache('room_id', room_id);
    }
    var room_openid = '';
    if(options.openid){
      That.setData({
        room_openid: options.openid
      })
      api.putcache('room_openid', options.openid);
    }

    wx.showLoading({
      title: '数据加载中',
    })

    let goods_id;
    let share_token;
    if (options.scene) {
      var scene = decodeURIComponent(options.scene);
      goods_id = scene.split("$")[0];
      share_token = scene.split("$")[1];
      That.setData({
        goods_id: goods_id,
        share_token: share_token,
      })

      That.nologin(goods_id, share_token);
    } else {
      share_token = options.share_token != undefined ? options.share_token : 0;
      if (options.share_token != undefined) {
        That.setData({
          share_token: share_token,
        })
      }

      goods_id = options.goods_id != undefined ? options.goods_id : 0;
      if (options.goods_id != undefined) {
        That.setData({
          goods_id: goods_id,
        })
      } else {
        wx.switchTab({
          url: '/pages/index/index',
        })
        return false
      }
    }
    if (share_token) {
        api.putcache('share_token',share_token);
    }
    //根据商品id请求接口获取商品数据
    var arr = [];
    arr.id = goods_id;
    arr.room_id = room_id;
    arr.share_token = share_token;
    api.fetchPost(api.https_path + 'shop/api.goods/info', arr, function(err, res) {
      console.log(res)

      wx.hideLoading();
      if (res.code == 0) {
        api.error_msg(res.msg)
        return false
      } else if (res.list != undefined) {
        That.setData({
          imgBase: api.https_path,
          imgUrls: res.list.imgsList,
          goods: res.list.goods,
          roomGoods: res.list.roomGoods,
          cartInfo: res.list.cartInfo,
          isCollect: res.list.isCollect,
          role_id:res.role_id,
          skuImgs:res.list.goods.goods_thumb,
          user_share_token:res.list.goods.user_share_token,
        })

      } else {
        return false
      }
      if (res.list.goods.is_spec == 1) {
        let goods_img = '';
        if (res.list.skuImgs == '') {
          goods_img = res.list.goods.goods_thumb;
        }else{
          goods_img = res.list.skuImgs[res.firstcoSku]
        }

        That.setData({
          skuArr: res.list.goods.lstSKUArr,
          skuprice: res.list.goods.sub_goods,
          skuImgsArr:res.list.skuImgs,
          skuImgs:goods_img,
          f_specifications:res.firstcoSku
        })
      } else {
        That.setData({
          maxnum: res.list.goods.goods_number
        })
      }

      That.initActivity();
    });
    //获取商品评论
    api.fetchPost(api.https_path + 'shop/api.comment/getListByGoods', {
      goods_id: goods_id,
      limit: 1
    }, function(err, res) {
      if (res.code == 0) {
        api.error_msg(res.msg)
        return false
      } else if (res.data.list != undefined && res.data.list[0] != undefined) {
        That.setData({
          pinglun: res.data.list[0],
          plnum: res.data.total_count
        })
      } else {
        return false
      }
    })
  },

  /**
 * 初始化商品活动
 */
  initActivity:function () {
      const That = this;
      let arr = new Object;
      arr.goods_id = That.data.goods.goods_id;
      let sku = [];
      let skuprice = That.data.skuprice
      let specifications = That.data.specifications
      if (specifications == '') {
        specifications = That.data.f_specifications
      }

      if (skuprice != null && skuprice[specifications] != undefined) {
        arr.sku_id = skuprice[specifications].sku_id
      }
      api.fetchPost(api.https_path + 'shop/api.goods/checkActivity',arr,function(err,res){
        That.activityTheme(res.data);
      })
  },

  //活动相关显示
  activityTheme:function(data){
    const That = this;
    if (data.activity_is_on == 1) {
      let isshowBtn = 0;
      let tan_text='';
      let is_tan = 0;
      let specifications = That.data.specifications;
      let valprice = [];
      if (data.status == 1) {
        isshowBtn = 2;
        if(data.goods.stock <=0 ){
          isshowBtn = 3;
        }
        if(data.goods.is_spec==1){
            if(data.goods_info){
                if(data.goods_info.goods_number<=0){
                  if (specifications != '') {
                    is_tan = 1;
                  }
                  tan_text = '该规格活动库存已售罄！';
                }
            }
        }
        if(!data.goods_info){
          valprice = That.data.goods.exp_price;
          is_tan = 1;
          tan_text = '该规格不参与优惠！';
        }else{
          valprice = data.goods_info.exp_price;
        }

      }else if(data.status == 0){
        isshowBtn = 1;
      }else{
        isshowBtn = 4;
      }
      console.valprice
      That.setData({
        activity_is_on:data.activity_is_on,
        isshowBtn:isshowBtn,
        tan_text:tan_text,
        is_tan:is_tan,
        time:data.diff_time * 1000,
        seckilldata:data,
        exp_price:data.goods.exp_min_price,
        exp_min_price:data.goods.exp_min_price,
        exp_max_price:data.goods.exp_max_price,
        valprice:valprice
      })
      That.countdown();
    }else{
      let goods = That.data.goods;
      That.setData({
        activity_is_on:data.activity_is_on,
        exp_price:goods.exp_price,
        exp_min_price:goods.exp_min_price,
        exp_max_price:goods.exp_max_price,
        valprice: goods.exp_price,
      })
    }
  },

  // 倒计时
  countdown: function() {
    let that = this;
    let total_micro_second = that.data.time;
    let countDownTime;
    if (total_micro_second <= 0) {
      let seckilldata = that.data.seckilldata;
      if (seckilldata.status == 0 && seckilldata.prom_type == 1) {
        let isshowBtn = 0;
        that.initActivity();
      }else if(seckilldata.status == 1 && seckilldata.prom_type == 1){
        let isshowBtn = 4;
      }
      that.setData({
        time: 0,
        showTime: ['00', '00', '00'],
      });

      return
    } else {
      countDownTime = that.dateformat(total_micro_second) //显示的时间
      total_micro_second -= 1000; //剩余的毫秒数
    }
    that.setData({
      time: total_micro_second,
      showTime: countDownTime
    });
    setTimeout(function() {
      that.countdown();
    }, 1000)
  },

  // 时间格式化输出，如11天03小时25分钟19秒  每1s都会调用一次
  dateformat: function(micro_second) {
    // 总秒数
    var second = Math.floor(micro_second / 1000);
    // 天数
    var day = Math.floor(second / 3600 / 24);
    // 小时
    var hr = Math.floor(second / 3600 % 24);
    // 分钟
    var min = Math.floor(second / 60 % 60);
    // 秒
    var sec = Math.floor(second % 60);
    return [(hr < 10 ? '0' + hr : hr), (min < 10 ? '0' + min : min), (sec < 10 ? '0' + sec : sec)];
  },

  nologin: function (goods_id, share_token) {
    const user_devtoken = api.getcache('user_devtoken')
    if (user_devtoken == "") {
      wx.redirectTo({
        url: '/pages/authorizeLogin/authorizeLogin?goods_id=' + goods_id + '&share_token=' + share_token,
      })
      return false
    }
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
  onShareAppMessage: function (options) {
    const _this = this
    let title = _this.data.goods.goods_name
    let goods_id = _this.data.goods.goods_id
    let token = _this.data.user_share_token
    // console.log(token);

    var path = '/pages/productDetails/productDetails?scene=' + goods_id +'$' + token
    console.log(path);
    let imageUrl = _this.data.goods.goods_thumb
    let shareObj = {}
    // if (options.from == 'button') {
      shareObj.path = path,
      shareObj.title = title;
      shareObj.imageUrl = api.https_path+imageUrl;
      return shareObj;
    // }
  }
})