// pages/addAddress/addAddress.js
const app = getApp()
var api = require("../../common/api.js");

const date = new Date()
const years = []
const months = []
const days = []

const year = date.getFullYear();
const month = date.getMonth();
const day = date.getDate();

for (let i = date.getFullYear(); i <= date.getFullYear()+1; i++) {
  years.push(i)
}

for (let i = 1; i <= 12; i++) {
  months.push(i)
}

for (let i = 1; i <= 31; i++) {
  days.push(i)
}
Page({
    /**
     * 页面的初始数据
     */
    data: {
        is_show: true,
        isshowarea: false,
        path: api.https_path,
        live_code: '',

        title: '',
        name: '',
        weixin: '',
        weixin_fu: '',

        years,
        months,
        days,
        value1: [0, month, day-1],
        value2: [0, month, day-1],

        img_url_1: '',
        img_url_2: '',
        img_url_3: '',
    },

    bindChange1: function(e) {
        const val = e.detail.value;
        console.log(val)
        this.setData({
          value1: val
        })
    },
    bindChange2: function(e) {
        const val = e.detail.value;
        console.log(val)
        this.setData({
          value2: val
        })
    },

    doaddress: function(options) {
        const That = this
        const value = options.detail.value;

        const name = value.name
        const title = value.title
        const weixin = value.weixin
        const weixin_fu = value.weixin_fu

        var value1 = That.data.value1
        var value2 = That.data.value2

        var years = That.data.years
        var months = That.data.months
        var days = That.data.days

        var time1 = years[value1[0]]+'-'+months[value1[1]]+'-'+days[value1[2]]
        var time2 = years[value2[0]]+'-'+months[value2[1]]+'-'+days[value2[2]]

        var img_url_1 = That.data.img_url_1
        var img_url_2 = That.data.img_url_2
        var img_url_3 = That.data.img_url_3

        var isshowarea = That.data.isshowarea;
        if (isshowarea == true) {
            api.error_msg("提交申请中,请勿重复提交")
            return false
        }
        That.setData({
            isshowarea: true
        })

        if (title == "") {
            api.error_msg("请输入直播间标题")
            return false
        } else if (name == "") {
            api.error_msg("请输入主播昵称")
            return false
        } else if (weixin == "") {
            api.error_msg("请输入主播微信号")
            return false
        } else if (weixin_fu == "") {
            api.error_msg("请输入主播副号")
            return false
        } else if (time1 == "") {
            api.error_msg("请选择开始时间")
            return false
        } else if (time2 == "") {
            api.error_msg("请选择结束时间")
            return false
        } else if (img_url_1 == "") {
            api.error_msg("请选择分享卡片封面")
            return false
        } else if (img_url_2 == "") {
            api.error_msg("请选择直播卡片封面")
            return false
        } else if (img_url_3 == "") {
            api.error_msg("请选择直播间背景")
            return false
        } else {
            api.fetchPost(api.https_path + '/member/api.users/applyLive', {
                name: name,
                title: title,
                weixin: weixin,
                weixin_fu: weixin_fu,
                time_1: time1,
                time_2: time2,
                img_url_1: img_url_1,
                img_url_2: img_url_2,
                img_url_3: img_url_3,
            }, function(err, res) {
                console.log(res)
                That.setData({
                    isshowarea: false
                })
                if (res.code == 1) {
                    wx.showModal({
                        title: '提示',
                        content: '申请成功,请等待审核结果',
                        success(res) {
                            if (res.confirm) {
                                That.setData({
                                    name: '',
                                    title: '',
                                    weixin: '',
                                    weixin_fu: '',
                                    time1: '',
                                    time2: '',
                                    img_url_1: '',
                                    img_url_2: '',
                                    img_url_3: '',
                                })
                            }
                            wx.reLaunch({
                                url: '/pages/my/my'
                            })
                        }
                    })
                } else {
                    api.error_msg(res.msg)
                }
            })
        }
    },

    //选择图片
    addImg: function(e){
        var that = this;
        var id = e.currentTarget.dataset.id
        console.log(id)
        wx.chooseImage({
          count: 1, // 默认9
          sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
          sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
          success: function (res) {
            // console.log(res);
            // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
            var tempFiles = res.tempFilePaths 
            console.log(tempFiles);
            //循环把图片加入上传列表
            for(var i in tempFiles){
              wx.uploadFile({
                url: api.https_path + '/publics/api.index/uploaderimages',
                filePath: tempFiles[i],
                name: 'file',
                formData: { },
                success(res) {
                  var data = JSON.parse(res.data);
                  if (data.code == 1) {
                    if (id == 1) {
                        that.setData({
                            img_url_1: data.src
                        })
                    } else if (id == 2) {
                        that.setData({
                            img_url_2: data.src
                        })
                    } else if (id == 3) {
                        that.setData({
                            img_url_3: data.src
                        })
                    }
                  } else {
                      api.error_msg(res.msg)
                  };
                }
              })
            }
          }
        })
    },

    //删除已选图片
    delImg: function(e){
        var that = this;
        var id = e.currentTarget.id;
        if (id == 1) {
            that.setData({
                img_url_1: ''
            })
        } else if (id == 2) {
            that.setData({
                img_url_2: ''
            })
        } else if (id == 3) {
            that.setData({
                img_url_3: ''
            })
        }
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        const That = this
        api.islogin();
        api.fetchPost(api.https_path + '/member/api.users/applyLiveXml', {}, function(err, res) {
            console.log(res)
            if (res.code == -1) {
                wx.showModal({
                    title: '提示',
                    content: res.msg,
                    success(res) {
                        wx.reLaunch({
                            url: '/pages/my/my'
                        })
                    }
                })
            } else if (res.code == -2) {
                That.setData({
                    live_code: res.live_code
                })
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
    // onShareAppMessage: function() {

    // }
})