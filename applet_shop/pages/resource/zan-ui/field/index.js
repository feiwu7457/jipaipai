module.exports = {
    _handleZanFieldChange: function(e) {
        var n = e.currentTarget.dataset.componentId;
        e.componentId = n, this.handleZanFieldChange ? this.handleZanFieldChange(e) : console.warn("页面缺少 handleZanFieldChange 回调函数");
    }
};