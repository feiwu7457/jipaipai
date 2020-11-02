function handle(e) {
    var a = e.currentTarget.dataset.componentId, n = e.detail.value;
    callback.call(this, a, n);
}

function callback(e, a) {
    var n = {
        componentId: e,
        value: a
    };
    console.info("[zan:Select:change]", n), this.handleZanSelectChange ? this.handleZanSelectChange(n) : console.warn("页面缺少 handleZanSelectChange 回调函数");
}

var Select = {
    _handleZanSelectChange: function(e) {
        handle.call(this, e);
    }
};

module.exports = Select;