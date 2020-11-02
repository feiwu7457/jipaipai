<?php
namespace app\integral\model;
use app\BaseModel;
use think\facade\Cache;
use app\shop\model\GoodsModel;
use app\shop\model\SkuCustomModel;

//*------------------------------------------------------ */
//-- 积分商品
/*------------------------------------------------------ */
class IntegralGoodsModel extends BaseModel
{

    protected $table = 'integral_goods';
    public $pk = 'ig_id';
    protected $mkey = 'integral_goods_mkey';
    /*------------------------------------------------------ */
    //-- 清除缓存
    /*------------------------------------------------------ */
    public function cleanMemcache($fg_id = 0)
    {
        Cache::rm($this->mkey . $fg_id);
    }
    /*------------------------------------------------------ */
    //-- 获取积分商品信息
    //-- $ig_id int 积分商品id
    //-- $hideSettle bool 是否隐藏供货价
    /*------------------------------------------------------ */
    public function info($ig_id,$hideSettle = true)
    {
        $igInfo = Cache::get($this->mkey . $ig_id);
        if (empty($igInfo)) {
            $igInfo = $this->where('ig_id', $ig_id)->find();
            if (empty($igInfo) == true) return array();
            $igInfo = $igInfo->toArray();
            Cache::set($this->mkey . $ig_id, $igInfo, 30);
        }
        $GoodsModel = new GoodsModel();
        $goods = $GoodsModel->info($igInfo['goods_id'],$hideSettle);
        $goods['imgsList'] = $GoodsModel->getImgsList($goods['goods_id']);//获取图片
        if ($goods['is_spec'] == 1) {//多规格处理
            $igInfo['goods'] = (new IntegralGoodsListModel)->where('ig_id', $ig_id)->select()->toArray();
            $this->getGoodsSku($goods, $igInfo);
            $goods['skuImgs'] = $GoodsModel->getImgsList($goods['goods_id'], true, true);//获取sku图片
        } else {
            $igGoods = (new IntegralGoodsListModel)->where('ig_id', $ig_id)->find()->toArray();
            $lastNum = $igGoods['ig_number'] - $igGoods['sale_num'];
            if ($lastNum > $goods['goods_number']){
                $lastNum = $goods['goods_number'];
            }
            $goods['BuyMaxNum'] = $lastNum;
            $goods['sale_num'] = $igGoods['sale_num'];
            $goods['integral'] = $igGoods['integral'];
        }
        $igInfo['goods'] = $goods;
        $time = time();
        $igInfo['is_on_sale'] = $goods['is_on_sale'];//判断是否可以进行兑换
        unset($goods);
        if ($igInfo['start_date'] > $time) {
            $igInfo['is_on_sale'] = 0;//未开始
        } elseif ($igInfo['end_date'] < $time) {
            $igInfo['is_on_sale'] = 9;//已结束
        }
        return $igInfo;
    }

    /*------------------------------------------------------ */
    //-- 获取商品规格及子商品信息
    //-- $goods array 商品信息
    //-- $igInfo array 积分相关
    /*------------------------------------------------------ */
    public function getGoodsSku(&$goods, &$igInfo)
    {
        if ($goods['is_spec'] == 0) return $goods;
        $sub_goods = [];
        foreach ($goods['sub_goods'] as $row) {
            $sub_goods[$row['sku_id']] = $row;
        }
        unset($goods['sub_goods']);
        $skuIdList = [];
        foreach ($igInfo['goods'] as $row) {
            if ($row['is_select'] == 0){
                continue;//未选择的sku，跳过
            }
            $sgRow = $sub_goods[$row['sku_id']];
            $lastNum = $row['ig_number'] - $row['sale_num'];
            if ($lastNum > $sgRow['goods_number']){
                $lastNum = $sgRow['goods_number'];
            }
            $sgRow['BuyMaxNum'] = $lastNum;
            $sgRow['integral'] = $row['integral'];
            $sgRow['sale_num'] = $row['sale_num'];
            $goods['sub_goods'][$sgRow['sku_val']] = $sgRow;

            $skuValArr = explode(':',$sgRow['sku_val']);
            $_sku = [];
            foreach ($skuValArr as $svkey=>$skuVal){
                $_sku[] = $skuVal;
                $skuIdList[] = join(':',$_sku);
            }
        }
        $goods['skuIdList'] = $skuIdList;
        print_r($skuList);
        return true;
    }}
