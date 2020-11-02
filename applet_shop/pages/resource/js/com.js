var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
    return typeof t;
} : function(t) {
    return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
};

function _defineProperty(t, e, o) {
    return e in t ? Object.defineProperty(t, e, {
        value: o,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : t[e] = o, t;
}

var com = {
    params: {},
    mainColor: function(t) {
        return "theme-custom01" == t ? "#fb2d37" : "theme-custom02" == t ? "#ff2726" : "theme-custom03" == t ? "#fcc600" : "theme-custom04" == t ? "#ff547b" : "theme-custom05" == t ? "#09bb07" : "theme-custom06" == t ? "#65c4aa" : "theme-custom07" == t ? "#388cee" : "theme-custom08" == t ? "#f8e9dd" : "theme-custom09" == t ? "#6cbe72" : "#fb2d37";
    },
    murl: function(t, e) {
        return e && (e.m = "zofui_sales"), this.url("entry/wxapp/" + t, e);
    },
    setBar: function(e, o) {
        if (!o.Menu) if (e.globalData.footer) o.setData({
            Menu: e.globalData.footer,
            copyright: e.globalData.copyright ? e.globalData.copyright : {},
            isIPX: !!e.globalData.isIPX
        }); else {
            var t, a = e.siteInfo.siteroot + "?i=" + e.siteInfo.uniacid + "&c=entry&a=wxapp&m=zofui_sales&t=" + e.siteInfo.multiid + "&v=" + e.siteInfo.version + "&from=wxapp&do=myinit";
            wx.request((_defineProperty(t = {
                url: a,
                data: {},
                header: {},
                method: "POST"
            }, "header", {
                "content-type": "application/x-www-form-urlencoded"
            }), _defineProperty(t, "success", function(t) {
                t.data.data && (e.globalData.footer = t.data.data.footer, e.globalData.copyright = t.data.data.copy, 
                o.setData({
                    Menu: t.data.data.footer ? t.data.data.footer : [],
                    copyright: t.data.data.copy ? t.data.data.copy : {},
                    isIPX: !!e.globalData.isIPX
                }));
            }), t));
        }
    },
    url: function(t, e) {
        var o = getApp(), a = o.siteInfo.siteroot + "?i=" + o.siteInfo.uniacid + "&t=" + o.siteInfo.multiid + "&v=" + o.siteInfo.version + "&from=wxapp&";
        if (t && ((t = t.split("/"))[0] && (a += "c=" + t[0] + "&"), t[1] && (a += "a=" + t[1] + "&"), 
        t[2] && (a += "do=" + t[2] + "&")), e && "object" === (void 0 === e ? "undefined" : _typeof(e))) for (var n in e) n && e.hasOwnProperty(n) && e[n] && (a += n + "=" + e[n] + "&");
        return a;
    },
    http: function(t, e, o, a, n, i, s, r) {
        var c = getApp();
        a = "http://127.0.0.6/app/index.php" == c.siteInfo.siteroot ? 0 : a;
        c.util.request({
            url: c.com.murl(t),
            method: e,
            cachetime: a || 0,
            data: o,
            showLoading: !!n,
            success: function(t) {
                i && 41009 != t.data.errno && i(t);
            },
            complete: function(t) {
                r && 41009 != t.data.errno && r(t);
            },
            fail: function(t) {
                s && s(t);
            }
        });
    },
    auth: function(e, o) {
        var a = this;
        a.getUserInfo(function(t) {
            o && (!t.wxInfo || !t.wxInfo.nickname && t.wxInfo.headimgurl) && o.setData({
                showuserbtn: !0
            }), e && e(t);
        }, function(t) {
            a.toAuth(e);
        });
    },
    toAuth: function(e) {
        var o = this;
        wx.showModal({
            title: "提示",
            content: "请允许使用您的用户信息",
            showCancel: !1,
            complete: function() {
                wx.openSetting({
                    success: function(t) {
                        t.authSetting["scope.userInfo"] ? o.auth(e) : o.toAuth(e);
                    }
                });
            }
        });
    },
    getUserInfo: function(o, t, a) {
        var n = getApp(), e = function() {
            wx.login({
                success: function(t) {
                    n.util.getWe7User(function(e) {
                        a ? n.util.upadteUser(a, function(t) {
                            "function" == typeof o && o(t);
                        }) : wx.canIUse("getUserInfo") ? wx.getUserInfo({
                            withCredentials: !0,
                            success: function(t) {
                                n.util.upadteUser(t, function(t) {
                                    "function" == typeof o && o(t);
                                });
                            },
                            fail: function(t) {
                                "function" == typeof o && o(e);
                            }
                        }) : "function" == typeof o && o(e);
                    }, t.code);
                },
                fail: function() {
                    wx.showModal({
                        title: "获取信息失败",
                        content: "请允许授权以便为您提供服务",
                        success: function(t) {
                            t.confirm && n.util.getUserInfo();
                        }
                    });
                }
            });
        }, i = wx.getStorageSync("userInfo") || {};
        if (i.sessionid) {
            if (!a) return void ("function" == typeof o && o(i));
            n.util.checkSession({
                success: function() {
                    a ? n.util.upadteUser(a, function(t) {
                        "function" == typeof o && o(t);
                    }) : "function" == typeof o && o(i);
                },
                fail: function() {
                    i.sessionid = "", wx.removeStorageSync("userInfo"), e();
                }
            });
        } else e();
    },
    getPage: function(e, o, t, a, n, i) {
        if (o.doing || o.isend) return !1;
        e.setData({
            doing: !0,
            "page.nodataf": 0,
            "page.waitf": 1
        }), this.http(o.doo ? o.doo : "pagelist", "GET", o.pdata, t, !1, function(t) {
            0 < t.data.data.list.length ? o.pdata.page++ : (o.isend = !0, e.setData({
                "page.nodataf": 1
            })), a && a(t);
        }, function(t) {
            i && i(t);
        }, function(t) {
            n && n(t), e.setData({
                doing: !1,
                "page.waitf": 0
            });
        });
    },
    getSet: function() {
        var e = wx.getStorageSync("set"), o = new Date().getTime() / 1e3;
        return (void 0 === e || "" == e || e.data.length <= 0 || e._expiretime <= o) && this.http("ajax", "get", {
            op: "set"
        }, 30, !1, function(t) {
            t.data.data ? (e = {
                _expiretime: o + 60,
                data: t.data.data
            }, wx.setStorageSync("set", e)) : e = {};
        }), e.data;
    },
    location: function(t) {
        wx.openLocation({
            latitude: parseFloat(t.currentTarget.dataset.lat),
            longitude: parseFloat(t.currentTarget.dataset.lng),
            name: t.currentTarget.dataset.addname,
            address: t.currentTarget.dataset.address,
            scale: 13
        });
    },
    otherapp: function(t) {
        wx.navigateToMiniProgram({
            appId: t.currentTarget.dataset.appid,
            path: t.currentTarget.dataset.appurl,
            success: function() {
                console.log("tosuc");
            },
            fail: function(t) {
                getApp().util.message(t.errMsg, "", "error");
            }
        });
    },
    navigateto: function(t) {
        var e = t.currentTarget.dataset.url;
        e && ("/zofui_sales/pages/index/index" == e || "/zofui_sales/pages/user/user" == e || "/zofui_sales/pages/ucard/ucard" == e || "/zofui_sales/pages/shop/list" == e || "/zofui_sales/pages/comment/comment" == e ? wx.switchTab({
            url: e
        }) : wx.navigateTo({
            url: e
        }));
    },
    redirectto: function(t) {
        var e = t.currentTarget.dataset.url;
        e && ("/zofui_sales/pages/index/index" == e || "/zofui_sales/pages/user/user" == e || "/zofui_sales/pages/ucard/ucard" == e || "/zofui_sales/pages/shop/list" == e || "/zofui_sales/pages/comment/comment" == e ? wx.switchTab({
            url: e
        }) : wx.navigateTo({
            url: t.currentTarget.dataset.url
        }));
    },
    callphone: function(t) {
        var e = t.currentTarget.dataset.tel;
        e && wx.makePhoneCall({
            phoneNumber: e
        });
    },
    toweburl: function(t, e) {
        var o = encodeURIComponent(t.currentTarget.dataset.weburl);
        wx.navigateTo({
            url: "/zofui_sales/pages/webview/webview?url=" + o
        });
    },
    showimages: function(t) {
        var e = [];
        if (t.currentTarget.dataset.img[0].url) for (var o = 0; o < t.currentTarget.dataset.img.length; o++) e.push(t.currentTarget.dataset.img[o].url); else e = t.currentTarget.dataset.img;
        wx.previewImage({
            urls: e
        });
    },
    pullDown: function(t) {
        if (t.data.isdown) return !1;
        t.setData({
            isdown: !0
        }), t.onLoad(t.data.options), t.setData({
            isdown: !1
        });
    },
    isArr: function(t) {
        return "[object Array]" === Object.prototype.toString.call(t);
    },
    toast: function(t, e, o) {
        wx.showToast({
            title: t,
            icon: e || "success",
            duration: 1e3,
            mask: !0,
            complete: function() {
                o && setTimeout(function() {
                    o();
                }, 1e3);
            }
        });
    },
    alert: function(t, e, o) {
        wx.showModal({
            title: "提示",
            content: t,
            showCancel: !1,
            success: function(t) {
                t.confirm ? e && e(t) : t.cancel && o && o(t);
            }
        });
    },
    confirm: function(t, e, o, a, n) {
        wx.showModal({
            title: "提示",
            content: t,
            showCancel: !0,
            cancelText: a || "取消",
            confirmText: n || "确定",
            success: function(t) {
                t.confirm ? e && e(t) : t.cancel && o && o(t);
            }
        });
    },
    verify: function(t, e, o) {
        if ("number" == t) {
            if ("int" == e) var a = /^[1-9]*[1-9][0-9]*$/; else if ("intAndLetter" == e) a = /^[A-Za-z0-9]*$/; else if ("money" == e) a = /^\d+\.?\d{0,2}$/;
            return a.test(o);
        }
        return "mobile" == t ? (a = /^1[3|4|5|6|7|8|9]\d{9}$/).test(e) : "cn" == t ? (a = /^[\u2E80-\u9FFF]+$/).test(e) : void 0;
    },
    clearhist: function(t, e) {
        wx.removeStorage({
            key: "zofui_searchhist" + e
        }), t.setData({
            searchhist: []
        });
    },
    addhist: function(t, e, o) {
        if (0 <= t.data.searchhist.indexOf(e)) return !1;
        t.data.searchhist.unshift(e), 10 <= t.data.searchhist.length && t.data.searchhist.splice(10, t.data.searchhist.length), 
        wx.setStorageSync("zofui_searchhist" + o, t.data.searchhist), t.setData({
            searchhist: t.data.searchhist
        });
    },
    tosearchhist: function(t, e) {
        var o = "/zofui_sitetemp/pages/goodlist/goodlist?for=" + t.data.for;
        1 == e && (o = "/zofui_sitetemp/pages/deskorder/goodlist?for=" + t.data.for), wx.navigateTo({
            url: o
        });
    },
    tosearch: function(t, e) {
        if (!t.data.for) return !1;
        t.addhist(t.data.for, e);
        var o = "/zofui_sitetemp/pages/goodlist/goodlist?for=" + t.data.for;
        1 == e && (o = "/zofui_sitetemp/pages/deskorder/goodlist?for=" + t.data.for), wx.navigateTo({
            url: o
        });
    },
    getUrl: function() {
        var t = getCurrentPages();
        return t[t.length - 1].route;
    },
    getUrlArgs: function() {
        var t = getCurrentPages(), e = t[t.length - 1], o = e.route, a = e.options, n = o + "?";
        for (var i in a) {
            n += i + "=" + a[i] + "&";
        }
        return n = n.substring(0, n.length - 1);
    },
    theRequest: function(t) {
        var e = {};
        if (-1 != t.indexOf("?")) for (var o = t.split("?")[1].split("&"), a = 0; a < o.length; a++) e[o[a].split("=")[0]] = unescape(o[a].split("=")[1]);
        return e;
    },
    getLocation: function(t, o) {
        var e = wx.getStorageSync("nlloc"), a = this;
        t.setData({
            loc: e
        }), e ? o(e) : wx.getLocation({
            type: "gcj02",
            success: function(t) {
                a.locsucces(t, o, 1);
            },
            fail: function(t) {
                1 * wx.getStorageSync("needloc") <= new Date().getTime() ? a.confirm("请开启位置授权,以便为您提供服务", function() {
                    wx.openSetting({
                        complete: function(t) {
                            t.authSetting["scope.userLocation"] ? a.locsucces("", o, 2) : o({
                                latitude: 11,
                                longitude: 11
                            });
                            var e = new Date().getTime() + 3e5;
                            wx.setStorageSync("needloc", e);
                        }
                    });
                }, function() {
                    var t = new Date().getTime() + 3e5;
                    wx.setStorageSync("needloc", t), o({
                        latitude: 11,
                        longitude: 11
                    });
                }) : o({
                    latitude: 11,
                    longitude: 11
                });
            }
        });
    },
    locsucces: function(t, e, o) {
        1 == o ? (wx.setStorageSync("nlloc", {
            latitude: t.latitude,
            longitude: t.longitude
        }), e(t)) : wx.getLocation({
            success: function(t) {
                wx.setStorageSync("nlloc", {
                    latitude: t.latitude,
                    longitude: t.longitude
                }), e(t);
            }
        });
    },
    notloc: function() {
        var e = getApp();
        wx.getSetting({
            success: function(t) {
                t.authSetting["scope.userLocation"] || e.com.alert("请开启位置功能为你提供最近的服务", function() {
                    wx.openSetting();
                });
            }
        });
    },
    uptomaster: function(t, o) {
        wx.showLoading({
            mask: !0,
            title: "上传中"
        });
        var e = getApp();
        wx.uploadFile({
            url: e.siteInfo.siteroot + "?i=" + e.siteInfo.uniacid + "&j=&c=utility&a=file&do=upload&type=image&thumb=0",
            filePath: t,
            name: "file",
            success: function(t) {
                var e = JSON.parse(t.data);
                o && o(e);
            },
            complete: function() {
                wx.hideLoading();
            }
        });
    }
};

module.exports = com;