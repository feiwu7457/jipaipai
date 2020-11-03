const app = getApp()
var api = require("../../common/api.js")
Page({
  /**
   * 页面的初始数据
   */
  data: {
    domain_name: api.domain_name,
    show_store:0,
    videoIndex:0,
    videoChangeIng: 0,
    videoSrc:'',
    share_token: '',
    user_share_token: '',
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var That = this;
    var roomid;
    var share_token;

    if (options.scene) {
      var scene = decodeURIComponent(options.scene);
      roomid = scene.split("$")[0];
      share_token = scene.split("$")[1];
    } else {
      roomid = options.roomid;
      share_token = options.share_token;
    }

    if (roomid) {
      That.setData({
        roomid: roomid
      })
      That.loadData(options.roomid);
    }
    if (share_token) {
      That.setData({
        share_token: share_token
      })
      That.putcache('share_token',share_token);
    }
  },
  loadData: function (roomid) {
    const _this = this;
    wx.showLoading({
      title: '加载中.',
    })
    let data = {
      roomid: roomid,
      share_token: share_token
    }
    api.fetchPost(api.https_path + "shop/api.live_room/getRoomReplay", data, function (err, res) {
      wx.hideLoading()
      if (res.code == 0) {
        api.error_msg(res.msg)
        return false
      }
      _this.setData({
        roomInfo: res.data,
        user_share_token: res.token
      })
      _this.videoPlay();
    })
  },
  clickStore:function(){
    var _this = this;
      this.setData({
        show_store: _this.data.show_store == 0 ? 1 : 0
      })
  },
  onReady: function (res) {
    this.videoContext = wx.createVideoContext('myVideo')//视频管理组件

  },
  videoEnd: function (res) {   // 视频播放结束后执行的方法
    var that = this;
    if (that.data.videoChangeIng == 1){
      return false;
    }
    if (that.data.videoIndex == that.data.roomInfo.live_replay.length - 1) {
      wx.showToast({
        title: '已播放完成',
        icon: 'loading',
        duration: 2500,
        mask: true,
      })
      that.setData({
        videoIndex: 0
      })
      this.videoContext.pause()  //暂停
    }else{
      that.setData({
        videoChangeIng: 1
      })
      that.videoPlay();
    }
  },
  videoPlay: function () {
    var that = this;
    var videolLength = that.data.roomInfo.live_replay.length;
    console.log(that.data.videoIndex)
    that.setData({
      videoIndex: that.data.videoIndex + 1,
      videoSrc: that.data.roomInfo.live_replay[that.data.videoIndex]['media_url'],
      videoChangeIng: 0
    })
    console.log(this.data.videoSrc);
    this.videoContext.play()//播放视频
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (options) {
    const _this = this
    let title = _this.data.roomInfo.room_title
    let roomid = _this.data.roomid
    let token = _this.data.user_share_token
    // console.log(token);

    var path = '/pages/roomReplay/index?scene=' + roomid +'$' + token
    console.log(path);
    let imageUrl = _this.data.roomInfo.room_img
    let shareObj = {}
    // if (options.from == 'button') {
      shareObj.path = path,
      shareObj.title = title;
      shareObj.imageUrl = api.https_path+imageUrl;
      return shareObj;
    // }
  }
})
