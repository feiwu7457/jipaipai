var _createClass = function() {
    function s(t, e) {
        for (var i = 0; i < e.length; i++) {
            var s = e[i];
            s.enumerable = s.enumerable || !1, s.configurable = !0, "value" in s && (s.writable = !0), 
            Object.defineProperty(t, s.key, s);
        }
    }
    return function(t, e, i) {
        return e && s(t.prototype, e), i && s(t, i), t;
    };
}();

function _classCallCheck(t, e) {
    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
}

var ERROR_CONF = {
    KEY_ERR: 311,
    KEY_ERR_MSG: "key格式错误",
    PARAM_ERR: 310,
    PARAM_ERR_MSG: "请求参数信息有误",
    SYSTEM_ERR: 600,
    SYSTEM_ERR_MSG: "系统错误",
    WX_ERR_CODE: 1e3,
    WX_OK_CODE: 200
}, BASE_URL = "https://apis.map.qq.com/ws/", URL_SEARCH = BASE_URL + "place/v1/search", URL_SUGGESTION = BASE_URL + "place/v1/suggestion", URL_GET_GEOCODER = BASE_URL + "geocoder/v1/", URL_CITY_LIST = BASE_URL + "district/v1/list", URL_AREA_LIST = BASE_URL + "district/v1/getchildren", URL_DISTANCE = BASE_URL + "distance/v1/", URL_DIRECTION = BASE_URL + "direction/v1/", MODE = {
    driving: "driving",
    transit: "transit"
}, EARTH_RADIUS = 6378136.49, Utils = {
    safeAdd: function(t, e) {
        var i = (65535 & t) + (65535 & e);
        return (t >> 16) + (e >> 16) + (i >> 16) << 16 | 65535 & i;
    },
    bitRotateLeft: function(t, e) {
        return t << e | t >>> 32 - e;
    },
    md5cmn: function(t, e, i, s, o, n) {
        return this.safeAdd(this.bitRotateLeft(this.safeAdd(this.safeAdd(e, t), this.safeAdd(s, n)), o), i);
    },
    md5ff: function(t, e, i, s, o, n, r) {
        return this.md5cmn(e & i | ~e & s, t, e, o, n, r);
    },
    md5gg: function(t, e, i, s, o, n, r) {
        return this.md5cmn(e & s | i & ~s, t, e, o, n, r);
    },
    md5hh: function(t, e, i, s, o, n, r) {
        return this.md5cmn(e ^ i ^ s, t, e, o, n, r);
    },
    md5ii: function(t, e, i, s, o, n, r) {
        return this.md5cmn(i ^ (e | ~s), t, e, o, n, r);
    },
    binlMD5: function(t, e) {
        var i, s, o, n, r;
        t[e >> 5] |= 128 << e % 32, t[14 + (e + 64 >>> 9 << 4)] = e;
        var l = 1732584193, a = -271733879, d = -1732584194, c = 271733878;
        for (i = 0; i < t.length; i += 16) s = l, o = a, n = d, r = c, l = this.md5ff(l, a, d, c, t[i], 7, -680876936), 
        c = this.md5ff(c, l, a, d, t[i + 1], 12, -389564586), d = this.md5ff(d, c, l, a, t[i + 2], 17, 606105819), 
        a = this.md5ff(a, d, c, l, t[i + 3], 22, -1044525330), l = this.md5ff(l, a, d, c, t[i + 4], 7, -176418897), 
        c = this.md5ff(c, l, a, d, t[i + 5], 12, 1200080426), d = this.md5ff(d, c, l, a, t[i + 6], 17, -1473231341), 
        a = this.md5ff(a, d, c, l, t[i + 7], 22, -45705983), l = this.md5ff(l, a, d, c, t[i + 8], 7, 1770035416), 
        c = this.md5ff(c, l, a, d, t[i + 9], 12, -1958414417), d = this.md5ff(d, c, l, a, t[i + 10], 17, -42063), 
        a = this.md5ff(a, d, c, l, t[i + 11], 22, -1990404162), l = this.md5ff(l, a, d, c, t[i + 12], 7, 1804603682), 
        c = this.md5ff(c, l, a, d, t[i + 13], 12, -40341101), d = this.md5ff(d, c, l, a, t[i + 14], 17, -1502002290), 
        a = this.md5ff(a, d, c, l, t[i + 15], 22, 1236535329), l = this.md5gg(l, a, d, c, t[i + 1], 5, -165796510), 
        c = this.md5gg(c, l, a, d, t[i + 6], 9, -1069501632), d = this.md5gg(d, c, l, a, t[i + 11], 14, 643717713), 
        a = this.md5gg(a, d, c, l, t[i], 20, -373897302), l = this.md5gg(l, a, d, c, t[i + 5], 5, -701558691), 
        c = this.md5gg(c, l, a, d, t[i + 10], 9, 38016083), d = this.md5gg(d, c, l, a, t[i + 15], 14, -660478335), 
        a = this.md5gg(a, d, c, l, t[i + 4], 20, -405537848), l = this.md5gg(l, a, d, c, t[i + 9], 5, 568446438), 
        c = this.md5gg(c, l, a, d, t[i + 14], 9, -1019803690), d = this.md5gg(d, c, l, a, t[i + 3], 14, -187363961), 
        a = this.md5gg(a, d, c, l, t[i + 8], 20, 1163531501), l = this.md5gg(l, a, d, c, t[i + 13], 5, -1444681467), 
        c = this.md5gg(c, l, a, d, t[i + 2], 9, -51403784), d = this.md5gg(d, c, l, a, t[i + 7], 14, 1735328473), 
        a = this.md5gg(a, d, c, l, t[i + 12], 20, -1926607734), l = this.md5hh(l, a, d, c, t[i + 5], 4, -378558), 
        c = this.md5hh(c, l, a, d, t[i + 8], 11, -2022574463), d = this.md5hh(d, c, l, a, t[i + 11], 16, 1839030562), 
        a = this.md5hh(a, d, c, l, t[i + 14], 23, -35309556), l = this.md5hh(l, a, d, c, t[i + 1], 4, -1530992060), 
        c = this.md5hh(c, l, a, d, t[i + 4], 11, 1272893353), d = this.md5hh(d, c, l, a, t[i + 7], 16, -155497632), 
        a = this.md5hh(a, d, c, l, t[i + 10], 23, -1094730640), l = this.md5hh(l, a, d, c, t[i + 13], 4, 681279174), 
        c = this.md5hh(c, l, a, d, t[i], 11, -358537222), d = this.md5hh(d, c, l, a, t[i + 3], 16, -722521979), 
        a = this.md5hh(a, d, c, l, t[i + 6], 23, 76029189), l = this.md5hh(l, a, d, c, t[i + 9], 4, -640364487), 
        c = this.md5hh(c, l, a, d, t[i + 12], 11, -421815835), d = this.md5hh(d, c, l, a, t[i + 15], 16, 530742520), 
        a = this.md5hh(a, d, c, l, t[i + 2], 23, -995338651), l = this.md5ii(l, a, d, c, t[i], 6, -198630844), 
        c = this.md5ii(c, l, a, d, t[i + 7], 10, 1126891415), d = this.md5ii(d, c, l, a, t[i + 14], 15, -1416354905), 
        a = this.md5ii(a, d, c, l, t[i + 5], 21, -57434055), l = this.md5ii(l, a, d, c, t[i + 12], 6, 1700485571), 
        c = this.md5ii(c, l, a, d, t[i + 3], 10, -1894986606), d = this.md5ii(d, c, l, a, t[i + 10], 15, -1051523), 
        a = this.md5ii(a, d, c, l, t[i + 1], 21, -2054922799), l = this.md5ii(l, a, d, c, t[i + 8], 6, 1873313359), 
        c = this.md5ii(c, l, a, d, t[i + 15], 10, -30611744), d = this.md5ii(d, c, l, a, t[i + 6], 15, -1560198380), 
        a = this.md5ii(a, d, c, l, t[i + 13], 21, 1309151649), l = this.md5ii(l, a, d, c, t[i + 4], 6, -145523070), 
        c = this.md5ii(c, l, a, d, t[i + 11], 10, -1120210379), d = this.md5ii(d, c, l, a, t[i + 2], 15, 718787259), 
        a = this.md5ii(a, d, c, l, t[i + 9], 21, -343485551), l = this.safeAdd(l, s), a = this.safeAdd(a, o), 
        d = this.safeAdd(d, n), c = this.safeAdd(c, r);
        return [ l, a, d, c ];
    },
    binl2rstr: function(t) {
        var e, i = "", s = 32 * t.length;
        for (e = 0; e < s; e += 8) i += String.fromCharCode(t[e >> 5] >>> e % 32 & 255);
        return i;
    },
    rstr2binl: function(t) {
        var e, i = [];
        for (i[(t.length >> 2) - 1] = void 0, e = 0; e < i.length; e += 1) i[e] = 0;
        var s = 8 * t.length;
        for (e = 0; e < s; e += 8) i[e >> 5] |= (255 & t.charCodeAt(e / 8)) << e % 32;
        return i;
    },
    rstrMD5: function(t) {
        return this.binl2rstr(this.binlMD5(this.rstr2binl(t), 8 * t.length));
    },
    rstrHMACMD5: function(t, e) {
        var i, s, o = this.rstr2binl(t), n = [], r = [];
        for (n[15] = r[15] = void 0, 16 < o.length && (o = this.binlMD5(o, 8 * t.length)), 
        i = 0; i < 16; i += 1) n[i] = 909522486 ^ o[i], r[i] = 1549556828 ^ o[i];
        return s = this.binlMD5(n.concat(this.rstr2binl(e)), 512 + 8 * e.length), this.binl2rstr(this.binlMD5(r.concat(s), 640));
    },
    rstr2hex: function(t) {
        var e, i, s = "0123456789abcdef", o = "";
        for (i = 0; i < t.length; i += 1) e = t.charCodeAt(i), o += s.charAt(e >>> 4 & 15) + s.charAt(15 & e);
        return o;
    },
    str2rstrUTF8: function(t) {
        return unescape(encodeURIComponent(t));
    },
    rawMD5: function(t) {
        return this.rstrMD5(this.str2rstrUTF8(t));
    },
    hexMD5: function(t) {
        return this.rstr2hex(this.rawMD5(t));
    },
    rawHMACMD5: function(t, e) {
        return this.rstrHMACMD5(this.str2rstrUTF8(t), str2rstrUTF8(e));
    },
    hexHMACMD5: function(t, e) {
        return this.rstr2hex(this.rawHMACMD5(t, e));
    },
    md5: function(t, e, i) {
        return e ? i ? this.rawHMACMD5(e, t) : this.hexHMACMD5(e, t) : i ? this.rawMD5(t) : this.hexMD5(t);
    },
    getSig: function(e, t, i, s) {
        var o = null, n = [];
        return Object.keys(e).sort().forEach(function(t) {
            n.push(t + "=" + e[t]);
        }), "search" == i && (o = "/ws/place/v1/search?" + n.join("&") + t), "suggest" == i && (o = "/ws/place/v1/suggestion?" + n.join("&") + t), 
        "reverseGeocoder" == i && (o = "/ws/geocoder/v1/?" + n.join("&") + t), "geocoder" == i && (o = "/ws/geocoder/v1/?" + n.join("&") + t), 
        "getCityList" == i && (o = "/ws/district/v1/list?" + n.join("&") + t), "getDistrictByCityId" == i && (o = "/ws/district/v1/getchildren?" + n.join("&") + t), 
        "calculateDistance" == i && (o = "/ws/distance/v1/?" + n.join("&") + t), "direction" == i && (o = "/ws/direction/v1/" + s + "?" + n.join("&") + t), 
        o = this.md5(o);
    },
    location2query: function(t) {
        if ("string" == typeof t) return t;
        for (var e = "", i = 0; i < t.length; i++) {
            var s = t[i];
            e && (e += ";"), s.location && (e = e + s.location.lat + "," + s.location.lng), 
            s.latitude && s.longitude && (e = e + s.latitude + "," + s.longitude);
        }
        return e;
    },
    rad: function(t) {
        return t * Math.PI / 180;
    },
    getEndLocation: function(t) {
        for (var e = t.split(";"), i = [], s = 0; s < e.length; s++) i.push({
            lat: parseFloat(e[s].split(",")[0]),
            lng: parseFloat(e[s].split(",")[1])
        });
        return i;
    },
    getDistance: function(t, e, i, s) {
        var o = this.rad(t), n = this.rad(i), r = o - n, l = this.rad(e) - this.rad(s), a = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(r / 2), 2) + Math.cos(o) * Math.cos(n) * Math.pow(Math.sin(l / 2), 2)));
        return a *= EARTH_RADIUS, a = Math.round(1e4 * a) / 1e4, parseFloat(a.toFixed(0));
    },
    getWXLocation: function(t, e, i) {
        wx.getLocation({
            type: "gcj02",
            success: t,
            fail: e,
            complete: i
        });
    },
    getLocationParam: function(t) {
        "string" == typeof t && (t = 2 === t.split(",").length ? {
            latitude: t.split(",")[0],
            longitude: t.split(",")[1]
        } : {});
        return t;
    },
    polyfillParam: function(t) {
        t.success = t.success || function() {}, t.fail = t.fail || function() {}, t.complete = t.complete || function() {};
    },
    checkParamKeyEmpty: function(t, e) {
        if (!t[e]) {
            var i = this.buildErrorConfig(ERROR_CONF.PARAM_ERR, ERROR_CONF.PARAM_ERR_MSG + e + "参数格式有误");
            return t.fail(i), t.complete(i), !0;
        }
        return !1;
    },
    checkKeyword: function(t) {
        return !this.checkParamKeyEmpty(t, "keyword");
    },
    checkLocation: function(t) {
        var e = this.getLocationParam(t.location);
        if (!e || !e.latitude || !e.longitude) {
            var i = this.buildErrorConfig(ERROR_CONF.PARAM_ERR, ERROR_CONF.PARAM_ERR_MSG + " location参数格式有误");
            return t.fail(i), t.complete(i), !1;
        }
        return !0;
    },
    buildErrorConfig: function(t, e) {
        return {
            status: t,
            message: e
        };
    },
    handleData: function(t, e, i) {
        if ("search" == i) {
            for (var s = e.data, o = [], n = 0; n < s.length; n++) o.push({
                id: s[n].id || null,
                title: s[n].title || null,
                latitude: s[n].location && s[n].location.lat || null,
                longitude: s[n].location && s[n].location.lng || null,
                address: s[n].address || null,
                category: s[n].category || null,
                tel: s[n].tel || null,
                adcode: s[n].ad_info && s[n].ad_info.adcode || null,
                city: s[n].ad_info && s[n].ad_info.city || null,
                district: s[n].ad_info && s[n].ad_info.district || null,
                province: s[n].ad_info && s[n].ad_info.province || null
            });
            t.success(e, {
                searchResult: s,
                searchSimplify: o
            });
        } else if ("suggest" == i) {
            var r = e.data, l = [];
            for (n = 0; n < r.length; n++) l.push({
                adcode: r[n].adcode || null,
                address: r[n].address || null,
                category: r[n].category || null,
                city: r[n].city || null,
                district: r[n].district || null,
                id: r[n].id || null,
                latitude: r[n].location && r[n].location.lat || null,
                longitude: r[n].location && r[n].location.lng || null,
                province: r[n].province || null,
                title: r[n].title || null,
                type: r[n].type || null
            });
            t.success(e, {
                suggestResult: r,
                suggestSimplify: l
            });
        } else if ("reverseGeocoder" == i) {
            var a = e.result, d = {
                address: a.address || null,
                latitude: a.location && a.location.lat || null,
                longitude: a.location && a.location.lng || null,
                adcode: a.ad_info && a.ad_info.adcode || null,
                city: a.address_component && a.address_component.city || null,
                district: a.address_component && a.address_component.district || null,
                nation: a.address_component && a.address_component.nation || null,
                province: a.address_component && a.address_component.province || null,
                street: a.address_component && a.address_component.street || null,
                street_number: a.address_component && a.address_component.street_number || null,
                recommend: a.formatted_addresses && a.formatted_addresses.recommend || null,
                rough: a.formatted_addresses && a.formatted_addresses.rough || null
            };
            if (a.pois) {
                var c = a.pois, u = [];
                for (n = 0; n < c.length; n++) u.push({
                    id: c[n].id || null,
                    title: c[n].title || null,
                    latitude: c[n].location && c[n].location.lat || null,
                    longitude: c[n].location && c[n].location.lng || null,
                    address: c[n].address || null,
                    category: c[n].category || null,
                    adcode: c[n].ad_info && c[n].ad_info.adcode || null,
                    city: c[n].ad_info && c[n].ad_info.city || null,
                    district: c[n].ad_info && c[n].ad_info.district || null,
                    province: c[n].ad_info && c[n].ad_info.province || null
                });
                t.success(e, {
                    reverseGeocoderResult: a,
                    reverseGeocoderSimplify: d,
                    pois: c,
                    poisSimplify: u
                });
            } else t.success(e, {
                reverseGeocoderResult: a,
                reverseGeocoderSimplify: d
            });
        } else if ("geocoder" == i) {
            var g = e.result, f = {
                title: g.title || null,
                latitude: g.location && g.location.lat || null,
                longitude: g.location && g.location.lng || null,
                adcode: g.ad_info && g.ad_info.adcode || null,
                province: g.address_components && g.address_components.province || null,
                city: g.address_components && g.address_components.city || null,
                district: g.address_components && g.address_components.district || null,
                street: g.address_components && g.address_components.street || null,
                street_number: g.address_components && g.address_components.street_number || null,
                level: g.level || null
            };
            t.success(e, {
                geocoderResult: g,
                geocoderSimplify: f
            });
        } else if ("getCityList" == i) {
            var h = e.result[0], m = e.result[1], _ = e.result[2];
            t.success(e, {
                provinceResult: h,
                cityResult: m,
                districtResult: _
            });
        } else if ("getDistrictByCityId" == i) {
            var p = e.result[0];
            t.success(e, p);
        } else if ("calculateDistance" == i) {
            var R = e.result.elements, y = [];
            for (n = 0; n < R.length; n++) y.push(R[n].distance);
            t.success(e, {
                calculateDistanceResult: R,
                distance: y
            });
        } else if ("direction" == i) {
            var E = e.result.routes;
            t.success(e, E);
        } else t.success(e);
    },
    buildWxRequestConfig: function(i, t, s) {
        var o = this;
        return t.header = {
            "content-type": "application/json"
        }, t.method = "GET", t.success = function(t) {
            var e = t.data;
            0 === e.status ? o.handleData(i, e, s) : i.fail(e);
        }, t.fail = function(t) {
            t.statusCode = ERROR_CONF.WX_ERR_CODE, i.fail(o.buildErrorConfig(ERROR_CONF.WX_ERR_CODE, t.errMsg));
        }, t.complete = function(t) {
            switch (+t.statusCode) {
              case ERROR_CONF.WX_ERR_CODE:
                i.complete(o.buildErrorConfig(ERROR_CONF.WX_ERR_CODE, t.errMsg));
                break;

              case ERROR_CONF.WX_OK_CODE:
                var e = t.data;
                0 === e.status ? i.complete(e) : i.complete(o.buildErrorConfig(e.status, e.message));
                break;

              default:
                i.complete(o.buildErrorConfig(ERROR_CONF.SYSTEM_ERR, ERROR_CONF.SYSTEM_ERR_MSG));
            }
        }, t;
    },
    locationProcess: function(e, t, i, s) {
        var o = this;
        if (i = i || function(t) {
            t.statusCode = ERROR_CONF.WX_ERR_CODE, e.fail(o.buildErrorConfig(ERROR_CONF.WX_ERR_CODE, t.errMsg));
        }, s = s || function(t) {
            t.statusCode == ERROR_CONF.WX_ERR_CODE && e.complete(o.buildErrorConfig(ERROR_CONF.WX_ERR_CODE, t.errMsg));
        }, e.location) {
            if (o.checkLocation(e)) {
                t(Utils.getLocationParam(e.location));
            }
        } else o.getWXLocation(t, i, s);
    }
}, QQMapWX = function() {
    function e(t) {
        if (_classCallCheck(this, e), !t.key) throw Error("key值不能为空");
        this.key = t.key;
    }
    return _createClass(e, [ {
        key: "search",
        value: function(e) {
            if (e = e || {}, Utils.polyfillParam(e), Utils.checkKeyword(e)) {
                var i = {
                    keyword: e.keyword,
                    orderby: e.orderby || "_distance",
                    page_size: e.page_size || 10,
                    page_index: e.page_index || 1,
                    output: "json",
                    key: this.key
                };
                e.address_format && (i.address_format = e.address_format), e.filter && (i.filter = e.filter);
                var s = e.distance || "1000", o = e.auto_extend || 1, n = null, r = null;
                e.region && (n = e.region), e.rectangle && (r = e.rectangle);
                Utils.locationProcess(e, function(t) {
                    i.boundary = n && !r ? "region(" + n + "," + o + "," + t.latitude + "," + t.longitude + ")" : r && !n ? "rectangle(" + r + ")" : "nearby(" + t.latitude + "," + t.longitude + "," + s + "," + o + ")", 
                    e.sig && (i.sig = Utils.getSig(i, e.sig, "search")), wx.request(Utils.buildWxRequestConfig(e, {
                        url: URL_SEARCH,
                        data: i
                    }, "search"));
                });
            }
        }
    }, {
        key: "getSuggestion",
        value: function(e) {
            if (e = e || {}, Utils.polyfillParam(e), Utils.checkKeyword(e)) {
                var i = {
                    keyword: e.keyword,
                    region: e.region || "全国",
                    region_fix: e.region_fix || 0,
                    policy: e.policy || 0,
                    page_size: e.page_size || 10,
                    page_index: e.page_index || 1,
                    get_subpois: e.get_subpois || 0,
                    output: "json",
                    key: this.key
                };
                if (e.address_format && (i.address_format = e.address_format), e.filter && (i.filter = e.filter), 
                e.location) {
                    Utils.locationProcess(e, function(t) {
                        i.location = t.latitude + "," + t.longitude, e.sig && (i.sig = Utils.getSig(i, e.sig, "suggest")), 
                        wx.request(Utils.buildWxRequestConfig(e, {
                            url: URL_SUGGESTION,
                            data: i
                        }, "suggest"));
                    });
                } else e.sig && (i.sig = Utils.getSig(i, e.sig, "suggest")), wx.request(Utils.buildWxRequestConfig(e, {
                    url: URL_SUGGESTION,
                    data: i
                }, "suggest"));
            }
        }
    }, {
        key: "reverseGeocoder",
        value: function(e) {
            e = e || {}, Utils.polyfillParam(e);
            var i = {
                coord_type: e.coord_type || 5,
                get_poi: e.get_poi || 0,
                output: "json",
                key: this.key
            };
            e.poi_options && (i.poi_options = e.poi_options);
            Utils.locationProcess(e, function(t) {
                i.location = t.latitude + "," + t.longitude, e.sig && (i.sig = Utils.getSig(i, e.sig, "reverseGeocoder")), 
                wx.request(Utils.buildWxRequestConfig(e, {
                    url: URL_GET_GEOCODER,
                    data: i
                }, "reverseGeocoder"));
            });
        }
    }, {
        key: "geocoder",
        value: function(t) {
            if (t = t || {}, Utils.polyfillParam(t), !Utils.checkParamKeyEmpty(t, "address")) {
                var e = {
                    address: t.address,
                    output: "json",
                    key: this.key
                };
                t.region && (e.region = t.region), t.sig && (e.sig = Utils.getSig(e, t.sig, "geocoder")), 
                wx.request(Utils.buildWxRequestConfig(t, {
                    url: URL_GET_GEOCODER,
                    data: e
                }, "geocoder"));
            }
        }
    }, {
        key: "getCityList",
        value: function(t) {
            t = t || {}, Utils.polyfillParam(t);
            var e = {
                output: "json",
                key: this.key
            };
            t.sig && (e.sig = Utils.getSig(e, t.sig, "getCityList")), wx.request(Utils.buildWxRequestConfig(t, {
                url: URL_CITY_LIST,
                data: e
            }, "getCityList"));
        }
    }, {
        key: "getDistrictByCityId",
        value: function(t) {
            if (t = t || {}, Utils.polyfillParam(t), !Utils.checkParamKeyEmpty(t, "id")) {
                var e = {
                    id: t.id || "",
                    output: "json",
                    key: this.key
                };
                t.sig && (e.sig = Utils.getSig(e, t.sig, "getDistrictByCityId")), wx.request(Utils.buildWxRequestConfig(t, {
                    url: URL_AREA_LIST,
                    data: e
                }, "getDistrictByCityId"));
            }
        }
    }, {
        key: "calculateDistance",
        value: function(r) {
            if (r = r || {}, Utils.polyfillParam(r), !Utils.checkParamKeyEmpty(r, "to")) {
                var l = {
                    mode: r.mode || "walking",
                    to: Utils.location2query(r.to),
                    output: "json",
                    key: this.key
                };
                if (r.from && (r.location = r.from), "straight" == l.mode) {
                    var t = function(t) {
                        for (var e = Utils.getEndLocation(l.to), i = {
                            message: "query ok",
                            result: {
                                elements: []
                            },
                            status: 0
                        }, s = 0; s < e.length; s++) i.result.elements.push({
                            distance: Utils.getDistance(t.latitude, t.longitude, e[s].lat, e[s].lng),
                            duration: 0,
                            from: {
                                lat: t.latitude,
                                lng: t.longitude
                            },
                            to: {
                                lat: e[s].lat,
                                lng: e[s].lng
                            }
                        });
                        var o = i.result.elements, n = [];
                        for (s = 0; s < o.length; s++) n.push(o[s].distance);
                        return r.success(i, {
                            calculateResult: o,
                            distanceResult: n
                        });
                    };
                    Utils.locationProcess(r, t);
                } else {
                    t = function(t) {
                        l.from = t.latitude + "," + t.longitude, r.sig && (l.sig = Utils.getSig(l, r.sig, "calculateDistance")), 
                        wx.request(Utils.buildWxRequestConfig(r, {
                            url: URL_DISTANCE,
                            data: l
                        }, "calculateDistance"));
                    };
                    Utils.locationProcess(r, t);
                }
            }
        }
    }, {
        key: "direction",
        value: function(e) {
            if (e = e || {}, Utils.polyfillParam(e), !Utils.checkParamKeyEmpty(e, "to")) {
                var i = {
                    output: "json",
                    key: this.key
                };
                "string" == typeof e.to ? i.to = e.to : i.to = e.to.latitude + "," + e.to.longitude;
                var s;
                e.mode = e.mode || MODE.driving, s = URL_DIRECTION + e.mode, e.from && (e.location = e.from), 
                e.mode == MODE.driving && (e.from_poi && (i.from_poi = e.from_poi), e.heading && (i.heading = e.heading), 
                e.speed && (i.speed = e.speed), e.accuracy && (i.accuracy = e.accuracy), e.road_type && (i.road_type = e.road_type), 
                e.to_poi && (i.to_poi = e.to_poi), e.from_track && (i.from_track = e.from_track), 
                e.waypoints && (i.waypoints = e.waypoints), e.policy && (i.policy = e.policy), e.plate_number && (i.plate_number = e.plate_number)), 
                e.mode == MODE.transit && (e.departure_time && (i.departure_time = e.departure_time), 
                e.policy && (i.policy = e.policy));
                Utils.locationProcess(e, function(t) {
                    i.from = t.latitude + "," + t.longitude, e.sig && (i.sig = Utils.getSig(i, e.sig, "direction", e.mode)), 
                    wx.request(Utils.buildWxRequestConfig(e, {
                        url: s,
                        data: i
                    }, "direction"));
                });
            }
        }
    } ]), e;
}();

module.exports = QQMapWX;