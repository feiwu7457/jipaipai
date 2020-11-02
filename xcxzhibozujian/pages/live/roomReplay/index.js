const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    show_store:0,
    videoIndex:0,
    videoChangeIng: 0,
    videoSrc:''
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadData(options.roomid);
  },
  loadData: function (roomid) {
    const _this = this;
    wx.showLoading({
      title: '加载中.',
    })
    let data = {
      roomid: roomid
    }
    app.api.fetchPost( "weixin/api.live_room/getRoomReplay", data, function (err, res) {
      wx.hideLoading()
      if (res.code == 0) {
        app.api.error_msg(res.msg)
        return false
      }
      _this.setData({
        roomInfo: res.data
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
    
  }

})
