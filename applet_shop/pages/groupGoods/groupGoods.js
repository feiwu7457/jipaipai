const app = getApp()
var api = require("../../common/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isCollect: false,
    indicatorDots: true,
    autoplay: false,
    interval: 5000,
    duration: 1000,
    imgBase: api.https_path,
    imgUrls: [],
    guigeModel: false,//规格弹窗
    goodsnumber: 1, //购买数量
    modelShare: false,
    guigeGroup:false,//规则弹窗
    fg_id:0,
    fgInfo:[],
    goods:[],
    fgList:[],
    fgListCount:0,
    comment:[],
    commentCount : 0,
    is_on_sale:1,
    skuArr: [], //规格模型
    coArr: [], //选中的规格数组  {0:3,1:5}
    specifications: "", //选中的规格 拼接后的字符串  3:5
    skuprice: [], //规格价格数组
    valprice: 0, //普通及规格商品显示单价
    maxnum:0,
    skuImgs:'',
    showSku:'',
    showSkuName:'',
    showTime:['0','00','00','00'],
    showTime2:[],
  },
  goCustomer:function(){
    wx.navigateTo({
      url: '/pages/customer/customer'
    })
  },
  openGG() {
    this.setData({
      guigeModel:　true
    });
  },
  closeGG() {
    this.setData({
      guigeModel: false
    });
  },
  openGroup() {
    this.setData({
      guigeGroup: 　true
    });
  },
  closeGroup() {
    this.setData({
      guigeGroup: false
    });
  },
  //收藏
  collect() {
    let That = this;
    api.fetchPost(api.https_path + 'shop/api.goods/collect', {
      goods_id: That.data.goods.goods_id
    }, function(err, res) {
      if (res.code == 1) {
        That.setData({
          isCollect: !That.data.isCollect
        });
      } else {
        api.error_msg(res.msg)
      }
    });

  },
  // //颜色选择
  // changColor(e){
  //   this.setData({
  //     goodsitem: e.currentTarget.dataset.classify
  //   });
  // },
  // //尺码选择
  // changSize(e) {
  //   this.setData({
  //     sizeitem: e.currentTarget.dataset.classify
  //   });
  // }, 
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
      let showSku = skuprice[str].sku_name.replace(',',' - ');
      let showSkuName = skuprice[str].sku_name.replace(',',' / ');
      let number = That.data.goodsnumber;
      //根据所选属性修改价格及库存
      That.setData({
        valprice: skuprice[str].exp_price,
        maxnum: skuprice[str].goods_number,
        specifications: str,
        skuImgs:skuImgsArr[str],
        showSku:showSku,
        showSkuName:showSkuName
      })
    }
  },
  //数量减
  minus(e) {
    let goodsnumber = this.data.goodsnumber
    goodsnumber = goodsnumber <= 1 ? 1 : goodsnumber-1
    this.setData({
      goodsnumber: goodsnumber
    });
  }, 
  //数量加
  add(e) {
    let goodsnumber = this.data.goodsnumber
    goodsnumber+=1
    this.setData({
      goodsnumber: goodsnumber
    });
  }, 
  goindex(){
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
  shopCart(){
    wx.switchTab({
      url: '/pages/cart/cart'
    })
  },
  
  //购买
  buy_now:function(){
    const That = this;
    let fg_id = That.data.fgInfo.fg_id;
    let join_id = 0;
    let number = That.data.goodsnumber;
    let specifications = That.data.specifications
    // console.log(specifications); fg_id=4&join_id=43&number=1&sku_val=2%3A5  2:5
    
    if (That.data.goods.is_spec == 1) {
      if (specifications == '') {
        api.error_msg('请选择商品规格.');
        return false;
      }
    }
    wx.navigateTo({
      url: '/pages/paymentGroup/paymentGroup?fg_id=' + fg_id + '&join_id=' + join_id + '&number=' + number + '&sku_val=' + specifications
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const That = this;
    let imgUrls = That.data.imgUrls;
    let fgInfo = That.data.fgInfo;
    let goods = That.data.goods;
    let fgList = That.data.fgList;
    let fgListCount = That.data.fgListCount;
    let is_on_sale = That.data.is_on_sale;
    let showSku = That.data.showSku;
    That.setData({
        imgUrls: imgUrls,
        fgInfo:fgInfo,
        goods:goods,
        fgList:fgList,
        fgListCount:fgListCount,
        is_on_sale:is_on_sale,
        showSku:showSku
    })
    That.getInfo(options.fg_id);
  },
  goIndex:function(){
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
  getInfo:function(fg_id){
    const That = this;
    let data = {
      fg_id:fg_id
    }
    api.fetchPost(api.https_path + 'fightgroup/api.Index/info',data,function(err, res){
      if (res.code == 1) {
        // console.log(res.imgsList);
        That.setData({
          imgUrls: res.imgsList,
          fgInfo:res.fgInfo,
          goods:res.goods,
          fgList:res.fgList,
          fgListCount:res.fgListCount,
          is_on_sale:res.fgInfo.is_on_sale,
          valprice:res.fgInfo.exp_price,
          skuImgs:res.goods.goods_thumb
        });
        That.countdown(res.fgInfo.end_date);
        That.countdown2(res.fgList);
        if (res.goods.is_spec == 1) {
          let goods_img = '';
          if (res.skuImgs == '') {
            goods_img = res.goods.goods_thumb;
          }else{
            goods_img = res.skuImgs[res.fgInfo.firstcoSku]
          }
          That.setData({
            skuArr: res.goods.lstSKUArr,
            skuprice: res.goods.sub_goods,
            skuImgsArr:res.skuImgs,
            skuImgs:goods_img,
            valprice:res.goods.sub_goods[res.fgInfo.firstcoSku].exp_price
          })
        } else {
          That.setData({
            maxnum: res.goods.goods_number
          })
        }
        That.getCommentList(res.goods.goods_id);
      }else{
        api.error_msg(res.msg);
      }

    });
  },
  getCommentList:function(goods_id){
    const That = this;
    let _data = {
      goods_id:goods_id,
      limit:1
    }
    api.fetchPost(api.https_path + 'shop/api.comment/getListByGoods',_data,function(err, res){
      if (res.code == 1) {
        That.setData({
          commentCount:res.data.total_count,
          comment:res.data.list, 
        });
      }else{
        api.error_msg(res.msg);
      }
    })
  },
  // 倒计时
  countdown: function(fail_time) {
    let that = this;
    var timestamp = Date.parse(new Date()); // 获取当前时间
    let total_micro_second = 0; //倒计时的时间
    let fail_times = 0; // 结束时间
    let showTime = that.data.showTime; // 显示的时间
    let countDownTime = []; // 格式化输出的时间
    // console.log(showTime);
    fail_times = fail_time * 1000;
    total_micro_second = fail_times - timestamp;
    if (total_micro_second <= 0) {
      countDownTime = ['00', '00', '00'];
    }else{
      countDownTime = that.dateformat(total_micro_second) //显示的时间
    }
    // console.log(countDownTime);
    that.setData({
      showTime: countDownTime
    });
    
    setTimeout(function() {
      that.countdown(fail_time);
    }, 1000)
  },
  // 倒计时
  countdown2: function(lists) {
    let that = this;
    // console.log(lists);
    var timestamp = Date.parse(new Date()); // 获取当前时间
    let total_micro_second = 0; //倒计时的时间
    let fail_time = 0; // 结束时间
    let showTime2 = that.data.showTime2; // 显示的时间
    let countDownTime = []; // 格式化输出的时间
    // console.log(showTime2);
    for (var i = 0; i < lists.length; i++) {
      fail_time = lists[i].fail_time * 1000;
      total_micro_second = fail_time - timestamp;
      if (total_micro_second <= 0) {
        countDownTime = ['00', '00', '00'];
      }else{
        countDownTime = that.dateformat(total_micro_second) //显示的时间
      }

      showTime2[lists[i].gid] = countDownTime;
    }
    // console.log(showTime2);
    that.setData({
      showTime2: showTime2
    });
    
    setTimeout(function() {
      that.countdown2(lists);
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
    return [day,(hr < 10 ? '0' + hr : hr), (min < 10 ? '0' + min : min), (sec < 10 ? '0' + sec : sec)];
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