const app = getApp()
var api = require("../../common/api.js")
Page({
	data:{
		emptyData: false, //有无数据
	    lists: [],
	    page: 0,
	    rebate: 0.00, //已提
	    total_mentioning:0.00,// 可提
	    total_rebate: 0.00, //全部
	    frozen_amount:0.00,// 冻结
	    load_more: true,
	    dateTime: '',
	},

	bindDateChange: function(e) {
	    const _this = this
	    let arr = e.detail.value.split('-')
	    let rebate_uid = _this.data.rebate_uid;
	    let date = arr[0] + '年' + arr[1] + '月'
	    _this.setData({
	        dateTime: date,
	        page: 0,
	        lists: [],
	    })
	    _this.publicloadlist(rebate_uid);

	},

	/**
	   * 生命周期函数--监听页面加载
	 */
	onLoad: function(options) {
	    const _this = this
	    let rebate_uid = options.rebate_uid;
	    let myDate = new Date();
		//获取当前年
		let year = myDate.getFullYear();
		//获取当前月
		let month = myDate.getMonth() + 1; 
		if (month < 10) {
			month = "0" + month;
		}else{
			month = month;
		}
	    _this.setData({
	    	rebate_uid:rebate_uid,
	    	dateTime:year + '年' + month + '月',
	    })
	    api.islogin();
	    _this.publicloadlist(rebate_uid);
	},

	publicloadlist: function(rebate_uid) {
        const _this = this
        let time = _this.data.dateTime;
        let data = {
            p: _this.data.page + 1,
            time:time,
            rebate_uid:rebate_uid
        }

        api.fetchPost(api.https_path + '/member/api.Users/drawList', data, function(err, res) {

            console.log(res)
            if (res.code == 0) {
                api.error_msg(res.msg)
                return false
            } else {

                _this.setData({
                    rebate: res.rebate,
                    total_rebate: res.total_rebate,
                    frozen_amount: res.frozen_amount,
                    total_mentioning: res.total_mentioning
                })
                if (res.list.length > 0) {
                    _this.setData({
                        ["lists[" + _this.data.page + "]"]: res.list,
                        load_more: true,
                        emptyData: false
                    })
                } else {
                    api.error_msg("没有更多数据!")
                    _this.setData({
                        load_more: false,
                    })
                    if (_this.data.page == 0 && res.list.length == 0) {
                        _this.setData({
                            emptyData: true,
                        })
                    }
                }

            }
        });


    },

    /**
     * 滚动加载数据
     */
    scrolltloadlist: function() {
        let _this = this;
        if (_this.data.load_more == true) {
            let more = _this.data.page + 1;
            let rebate_uid = _this.data.rebate_uid
            _this.setData({
                page: more,
            });
            _this.publicloadlist(rebate_uid);
        }
    },
});
