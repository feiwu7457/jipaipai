var Tab = {
    _handleZanTabChange: function(a) {
        var e = a.currentTarget.dataset, n = {
            componentId: e.componentId,
            selectedId: e.itemId
        };
        this.handleZanTabChange ? this.handleZanTabChange(n) : console.warn("页面缺少 handleZanTabChange 回调函数");
    }
};

module.exports = Tab;