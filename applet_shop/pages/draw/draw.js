const app = getApp()
var api = require("../../common/api.js")
Page({
	data:{
	    total_mentioning:0.00,// 可提
	    rebate_user:[],// 返利用户
	    mentioning:0.00, // 提现金额
	},


	/**
	   * 生命周期函数--监听页面加载
	 */
	onLoad: function(options) {
	    const _this = this
	    let rebate_uid = options.rebate_uid;
	    _this.setData({
            rebate_uid: rebate_uid
        })
	    _this.publicloadlist(rebate_uid);
	},

	publicloadlist: function(rebate_uid) {
        const _this = this
        let data = {
            rebate_uid:rebate_uid
        }
        api.fetchPost(api.https_path + '/member/api.Users/drawAmount', data, function(err, res) {

            if (res.code == 0) {
                api.error_msg(res.msg)
                return false
            } else {

                _this.setData({
                    rebate_user: res.rebate_user,
                    total_mentioning: res.total_mentioning,
                    mentioning:res.total_mentioning,
                })
            }
        });
    },
    chengNumber:function(e){
    	const _this = this;
    	let total_mentioning = _this.data.total_mentioning;
    	let mentioning = e.detail.value;
    	if (mentioning > total_mentioning) {
    		api.error_msg('超过最大可提款金额')
    	}

    	if (mentioning <= 0) {
    		api.error_msg('提款金额不正确')
    	}
    	
    	_this.setData({
    		mentioning:mentioning
    	})
    },

    // 提交提款
    postDraw:function(){
    	const _this = this;
    	let total_mentioning = _this.data.total_mentioning;
    	let mentioning =  _this.data.mentioning;
    	if (mentioning > total_mentioning) {
    		api.error_msg('超过最大可提款金额')
    		return false;
    	}

    	if (mentioning <= 0) {
    		api.error_msg('提款金额不正确');
    		return false;
    	}
    	let data = {
    		rebate_uid:_this.data.rebate_uid,
    		mentioning:mentioning
    	}
    	api.fetchPost(api.https_path + '/member/api.Users/draw', data, function(err, res) {
    		if (res.code == 1) {
    			api.success_msg(res.msg);
    			setTimeout(function () {
                  wx.redirectTo({
                    url: '/pages/drawInfo/drawInfo?rebate_uid='+_this.data.rebate_uid,
                  });
                }, 1000)
    		}else{
    			api.error_msg(res.msg);
    		}
    	});
    }
    
});
