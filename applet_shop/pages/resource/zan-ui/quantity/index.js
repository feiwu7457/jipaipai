function handle(a, n) {
    var t = a.currentTarget.dataset, l = t.componentId, e = t.disabled, i = +t.quantity;
    if (e) return null;
    callback.call(this, l, i + n);
}

function callback(a, n) {
    var t = {
        componentId: a,
        quantity: n = +n
    };
    this.handleZanQuantityChange ? this.handleZanQuantityChange(t) : console.warn("页面缺少 handleZanQuantityChange 回调函数");
}

var Quantity = {
    _handleZanQuantityMinus: function(a) {
        handle.call(this, a, -1);
    },
    _handleZanQuantityPlus: function(a) {
        handle.call(this, a, 1);
    },
    _handleZanQuantityBlur: function(a) {
        var n = this, t = a.currentTarget.dataset, l = t.componentId, e = +t.max, i = +t.min, u = a.detail.value;
        return u ? e < (u = +u) ? u = e : u < i && (u = i) : setTimeout(function() {
            callback.call(n, l, i);
        }, 16), callback.call(this, l, u), "" + u;
    }
};

module.exports = Quantity;