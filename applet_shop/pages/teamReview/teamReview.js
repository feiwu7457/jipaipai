// pages/teamReview/teamReview.js
const app = getApp()
var api = require("../../common/api.js")
Page({
	data: {
		imgBase: app.globalData.imgUrl,
    type: 1,
    pages:1,
    lists: [],
    listscount: 0,
    isloaddata: true,
    pic_host:api.https_path,
	_data:[],
	times: [
      {
        id: "1",
        type: 1,
        text: "待审核",
        curr: true
      },
      {
        id: "2",
        type: 2,
        text: "已审核",
        curr: false
			}
		]
	},
  changeTab: function (e) {
    let that = this;
    let id = e.currentTarget.dataset.id;
    let type = e.currentTarget.dataset.type;
    let times = this.data.times;
    let _data = that.data._data;
    let _pages = 1;


    for (let i = 0; i < times.length; i++) {
      if (times[i].type == type) {
        times[i].curr = true
      } else {
        times[i].curr = false
      }
    }
    that.setData({
      isloaddata: true,
      listscount: 0,
      lists: [],
      type: type,
      pages: _pages
    });
    if (type == 1) {
      _data = {
        type:1
      }
    }else if (type == 2) {
      _data = {
        type:2
      }
    }
    that.loadlist(_pages,_data);
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const That = this;
    let _pages = 1;
    let type = That.data.type;
    let _data = That.data._data;
    That.setData({
        isloaddata: true,
        listscount: 0,
        lists: [],
        type: type,
        pages: _pages
    })
    if (type == 1) {
      _data = {
        type:'1'
      }
    }else if (type == 2) {
      _data = {
        type:'2'
      }
    }
    That.loadlist(_pages,_data);
  },
  loadlist:function(_pages,_data){
    const That = this
    const lists = That.data.lists
    const isloaddata = That.data.isloaddata
    if (isloaddata == true) {
        That.setData({
            isloaddata: false
        })
        api.pagelist(api.https_path + 'distribution/api.Order/getList', _pages, _data, function(err, res) {
            if (res.code == 1 && res.list) {
                if (res.list.length > 0) {
                    // for (var i = 0; i < res.list.length; i++) {
                    //     lists.push(res.list[i])
                    // }
                    console.log(res.list);
                    That.setData({
                        isloaddata: true,
                        lists: res.list,
                        listscount: res.total_count,
                        pages: parseInt(_pages) + 1
                    })
                } else {
                    That.setData({
                        isloaddata: false,
                    })
                }
            }else{
            	api.error_msg(res.msg);
            }
        })
    }
  },
  examineUser:function(e){
  	let That = this;
  	
  	wx.showModal({
      	title: '提示',
      	content: '确定要通过该申请吗？',
      	success: function (sm) {
        	if (sm.confirm) {
		         let _data = {
				  		order_id:e.target.dataset.order_id,
				  		operating:'pass'
				  	}
		         api.fetchPost(api.https_path + 'distribution/api.Order/upExamineUser', _data , function(err, res) {
		            if (res.code == 1) {
                    api.success_msg(res.msg);
                    That.setData({
                      isloaddata: true,
                      isloaddata: true,
                      listscount: 0,
                      lists: [],
                      page:1
                  })
		              	setTimeout(function() {
		              		let page = 1;
		              		let data = {
						        type:That.data.type
						    }       
		                  	That.loadlist(page,data);
		                }, 1500)
		            }else{
		              api.error_msg(res.msg);
		              return false;
		            }
		         });
         	 } else if (sm.cancel) {
            console.log('用户点击取消')
          	}
        }
    })
  },

  /**
   * 滚动加载数据
   */
  scrolltloadlist: function() {
    console.log(123);
    const That = this
    const _pages = That.data.pages
    let type = That.data.type;
    let _data = That.data._data;
    if (type == 1) {
      _data = {
        type:'myInitiate'
      }
    }else if (type == 2) {
      _data = {
        type:'myJoin'
      }
    }
    That.loadlist(_pages, _data)
  },

})