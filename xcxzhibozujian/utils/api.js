var config = require('config.js');
//GET方法获取数据或提交数据
function fetchGet(url, _data, callback) {
    let par = ''
    for (var i in _data) {
        par += i + '=' + _data[i] + '&'
    }
    wx.request({
      url: config.domain_name + url + '?' + par,
        header: {
            'Content-Type': 'application/json'
        },
        success(res) {
            callback(null, res.data)
        },
        fail(e) {
            callback(e)
        }
    })
}


//POST方法获取数据或提交数据
function fetchPost(url, data, callback) {
    wx.request({
        method: 'POST',
      url: config.domain_name + url,
        header: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        data: data,
        success(res) {
            callback(null, res.data)
        },
        fail(e) {
            console.error(e)
            callback(e)
        }
    })
}

function callbackfunction(data, callback) {
    callback("null", data);
}

/**
 * 提示成功消息
 */
function success_msg(_msg, _time) {
    var _time = _time == undefined ? 600 : _time
    wx.showToast({
        title: _msg,
        icon: 'success',
        duration: _time
    })
}

/**
 * 提示错误信息
 */
function error_msg(_msg, _time) {
    var _time = _time == undefined ? 600 : _time
    wx.showToast({
        title: _msg,
        icon: 'none',
        duration: _time
    })
}

/**
 * 加载信息提示
 */
function loading_msg(_msg) {
    var _msg = _msg == undefined ? "加载中" : _msg
    wx.showLoading({
        title: _msg,
    })
    setTimeout(function() {
        wx.hideLoading()
    }, 600)
}

/**
 * 获取缓存中的数据
 */
function getcache(_name) {
    const _value = wx.getStorageSync(_name)
    return _value
}


/**
 * 写入数据到缓存中
 */
function putcache(_name, _value) {
    wx.setStorage({
        key: _name,
        data: _value
    })
}

/**
 * 读取公共配置项
 */
function getconfig(_name, callback) {
    wx.request({
        method: 'POST',
      url: config.domain_name + '/publics/api.index/getGorupSet',
        header: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        data: {
            key_str: _name
        },
        success(res) {
            callback(res)
        },
        fail(e) {
            callback(e)
        }
    })
}

/**_mobile  发送的号码
 * _types  发送类型
 * 发送验证码
 */
function sendsms(_mobile, _types, callback) {
    const _data = {
        'mobile': _mobile,
        'type': _types,
    }
    wx.request({
        method: 'POST',
      url: config.domain_name + '/publics/api.sms/sendCode',
        header: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        data: _data,
        success(res) {
            callback(null, res.data)
        },
        fail(e) {
            callback(e)
        }
    })
}

//检测数组中是否存在某个字符串
function in_array(search, array) {
    for (var i in array) {
        if (array[i] == search) {
            return true;
        }
    }
    return false;
}


/**
 * 加载信息提示
 */
function loading_msgs(_msg) {
    var _msg = _msg == undefined ? "加载中" : _msg
    wx.showLoading({
        title: _msg,
    })
}

//模块化
module.exports = {
    in_array: in_array,
    loading_msgs: loading_msgs, //加载提示
    loading_msg: loading_msg, //加载提示
    sendsms: sendsms, //发送验证码
    getcache: getcache, //读取缓存中数据
    putcache: putcache, //写入数据到缓存中
    success_msg: success_msg, //提示成功消息
    error_msg: error_msg, //提示错误信息
    // API
    callbackfunction: callbackfunction,
    // METHOD
    fetchGet: fetchGet, //GET请求
    fetchPost: fetchPost, //POST请求
   
}