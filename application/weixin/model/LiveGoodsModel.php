<?php
/*------------------------------------------------------ */
//-- 微信直播商品库
//-- @author iqgmy
/*------------------------------------------------------ */

namespace app\weixin\model;

use app\BaseModel;
use think\facade\Cache;

class LiveGoodsModel extends BaseModel
{
    protected $table = 'weixin_live_goods';
    public $pk = 'id';
    public $errorCode = ["-1"=>"系统错误","1003"=>"商品id不存在","47001"=>"入参格式不符合规范","200002"=>"入参错误","300001"=>"禁止创建/更新商品（如：商品创建功能被封禁）","300002"=>"名称长度不符合规则","300003"=>"价格输入不合规（如：现价比原价大、传入价格非数字等）","300004"=>"商品名称存在违规违法内容","300005"=>"商品图片存在违规违法内容","300006"=>"图片上传失败（如：mediaID过期）","300007"=>"线上小程序版本不存在该链接","300008"=>"添加商品失败","300009"=>"商品审核撤回失败","300010"=>"商品审核状态不对（如：商品审核中）","300011"=>"操作非法（API不允许操作非API创建的商品）","300012"=>"没有提审额度（每天500次提审额度）","300013"=>"提审失败","300014"=>"审核中，无法删除（非零代表失败）","300017"=>"商品未提审","300021"=>"商品添加成功，审核失败"];
    public $auditStatus = ['0'=>'未审核','1'=>'审核中','2'=>'审核通过','3'=>'审核失败'];
    public $priceType = ['1'=>'一口价','2'=>'价格区间','3'=>'显示折扣价'];
    /**
     *获取商品库列表写入数据库
     */
    public function getGoodsListToDb()
    {
        $cache = Cache::init();
        $_redis = $cache->handler();
        $mkey = 'xcx_get_livegoods_time';
        $hour = date('H') * 1;
        if ($hour > 2 && $hour < 8) {
            $limitTime = 432;//获取间隔（秒）晚上分配50次，
        }else{
            $limitTime = 144;//获取间隔（秒）
        }
        $lock_time = $_redis->setnx($mkey, time() + $limitTime);
        if ($lock_time == false) {
            $lock_time = $_redis->get($mkey);
            if (time() > $lock_time) {
                $_redis->del($mkey);
                $lock_time = $_redis->setnx($mkey, time() + $limitTime);
                if ($lock_time == false) return false;
            } else {
                return false;
            }
        }
         $this->runGoodsListToDb(1,2);
        $this->runGoodsListToDb(1,3);
    }
    /**
     *获取商品库列表写入数据库
     */
    private function runGoodsListToDb($page,$status)
    {
        $result = (new MiniModel)->getGoodsRoomList($page,$status);
        if (empty($result['goods']) == true) {
            return false;
        }
        foreach ($result['goods'] as $key => $val) {
            $goodsInfo = $this->where('goodsId',$val['goodsId'])->find();
            $goodsData = [];
            $goodsData['goodsId'] = $val['goodsId'];
            $goodsData['coverImgUrl'] = $val['coverImgUrl'];
            $goodsData['name'] = $val['name'];
            $goodsData['price'] = $val['price'];
            $goodsData['url'] = $val['url'];
            $goodsData['priceType'] = $val['priceType'];
            $goodsData['price2'] = $val['price2'];
            $goodsData['thirdPartyTag'] = $val['thirdPartyTag'];
            $goodsData['audit_status'] = $status;
            if (empty($goodsInfo) == false){
                $this->where('goodsId',$val['goodsId'])->update($goodsData);
            }else{
                $goodsData['add_time'] = time();
                $this->create($goodsData);
            }
        }
        $allPage = (int) Math.ceil($result['total'] / 100);
        if ($allPage > $page){
            return $this->runGoodsListToDb($page + 1,$status);
        }
        return true;
    }
}

?>