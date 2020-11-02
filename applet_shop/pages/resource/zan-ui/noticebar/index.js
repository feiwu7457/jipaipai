function _defineProperty(t, e, i) {
    return e in t ? Object.defineProperty(t, e, {
        value: i,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : t[e] = i, t;
}

var ZanNoticeBar = {
    initZanNoticeBarScroll: function(i, n) {
        this.zanNoticeBarNode = this.zanNoticeBarNode || {}, this.zanNoticeBarNode["" + i] = {
            width: void 0,
            wrapWidth: void 0,
            animation: null,
            resetAnimation: null
        };
        var a = this.zanNoticeBarNode["" + i], o = this;
        wx.createSelectorQuery().select("#" + i + "__content").boundingClientRect(function(t) {
            t && t.width ? (a.width = t.width, wx.createSelectorQuery().select("#" + i + "__content-wrap").boundingClientRect(function(t) {
                if (a.wrapWidth = t.width, a.wrapWidth < a.width) {
                    var e = a.width / 40 * 1e3;
                    a.animation = wx.createAnimation({
                        duration: e,
                        timingFunction: "linear"
                    }), a.resetAnimation = wx.createAnimation({
                        duration: 0,
                        timingFunction: "linear"
                    }), o.scrollZanNoticeBar(i, e, n);
                }
            }).exec()) : console.warn("页面缺少 noticebar 元素");
        }).exec();
    },
    scrollZanNoticeBar: function(t, e, i) {
        var n = this.zanNoticeBarNode["" + t], a = n.resetAnimation.translateX(n.wrapWidth).step();
        this.setData(_defineProperty({}, i + ".animationData", a.export()));
        var o = n.animation.translateX(40 * -e / 1e3).step(), r = this;
        setTimeout(function() {
            r.setData(_defineProperty({}, i + ".animationData", o.export()));
        }, 100), setTimeout(function() {
            r.scrollZanNoticeBar(t, e, i);
        }, e);
    }
};

module.exports = ZanNoticeBar;