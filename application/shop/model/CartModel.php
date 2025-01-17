<?php

namespace app\shop\model;

use app\BaseModel;
use think\facade\Cache;

//*------------------------------------------------------ */
//-- 购物车
/*------------------------------------------------------ */

class CartModel extends BaseModel
{
    protected $table = 'shop_cart';
    public $pk = 'rec_id';
    public $is_integral = 0;
    /*------------------------------------------------------ */
    //-- 优先自动执行
    /*------------------------------------------------------ */
    public function initialize()
    {
        parent::initialize();
    }
    /*------------------------------------------------------ */
    //-- 清除购物车缓存
    /*------------------------------------------------------ */
    public function cleanMemcache()
    {
        $user_id = $this->userInfo['user_id'] * 1;
        Cache::rm('CartInfo_' . session_id() . '_0' . $this->is_integral);
        Cache::rm('CartInfo_' . session_id() . '_1' . $this->is_integral);
        Cache::rm('CartInfo_' . $user_id . '_0' . $this->is_integral);
        Cache::rm('CartInfo_' . $user_id . '_1' . $this->is_integral);
    }
    /*------------------------------------------------------ */
    //-- 添加购物车处理
    /*------------------------------------------------------ */
    public function addToCart($goods_id, $num, $spec = '', $sku_id = 0, $type = '', $prom_type = 0, $prom_id = 0)
    {
        $GoodsModel = new GoodsModel();
        $use_integral = 0;
        if ($this->is_integral == 1) {
            $IntegralGoodsModel = new \app\integral\model\IntegralGoodsModel();
            $igInfo = $IntegralGoodsModel->info($goods_id, false);
            if ($igInfo['is_on_sale'] == 0) {
                return '当前商品暂不能兑换.';
            }
            if ($igInfo['is_on_sale'] == 9) {
                return '当前商品兑换已结束.';
            }
            if (empty($igInfo['goods'])) return '商品不存在';
            $goods = $igInfo['goods'];
            if ($igInfo['limit_num'] > 0 && $num > $igInfo['limit_num']) {
                return '此积分商品单次只允许兑换【' . $igInfo['limit_num'] . '】件';
            }

            if ($sku_id > 0) {
                $use_integral = $goods['sub_goods'][$spec]['integral'];
            } else {
                $use_integral = $goods['integral'];
            }
            $goods_id = $igInfo['goods_id'];
            $prom_type = 2;
            $prom_id = $igInfo['ig_id'];
            $goods['is_dividend'] = 0;
            $goods['buy_brokerage_amount'] = 0;
            $goods['buy_brokerage'] = 0;
        } else {
            $goods = $GoodsModel->info($goods_id, false);
            if (empty($goods)) return '商品不存在';
            if ($this->userInfo['user_id'] > 0) {
                if ($goods['is_promote'] == 1 && $goods['limit_num'] > 0) {
                    $goods_sn = $spec ? $goods['sub_goods'][$spec] : $goods['goods_sn'];
                    $where[] = ['user_id', '=', $this->userInfo['user_id']];
                    $where[] = ['add_time', 'between', array($goods['promote_start_date'], $goods['promote_end_date'])];
                    $OrderModel = new OrderModel();
                    $orders = $OrderModel->where($where)->field('buy_goods_sn,order_status')->select();
                    foreach ($orders as $o) {
                        if ($o['order_status'] == config('config.OS_CANCELED') || $o['order_status'] == config('config.OS_INVALID')) continue;
                        $gn = explode(',', $o['buy_goods_sn']);
                        if (in_array($goods_sn, $gn)) return '当前商品进行限购每个会员只允许参与一次，你已购买过暂不能购买.';
                    }
                }
            }
            if ($goods['use_integral'] > 0) {
                $use_integral = $goods['use_integral'];
            }
        }
        unset($where);
        /* 检查该商品是否已经存在在购物车中 */
        if ($this->userInfo['user_id'] > 0) {
            $where['user_id'] = $this->userInfo['user_id'] * 1;
        } else {
            $where['session_id'] = session_id();
            $where['user_id'] = 0;
        }
        $where['is_invalid'] = 0;
        $where['goods_id'] = $goods_id;
        $where['sku_val'] = $spec;
        $where['is_integral'] = $this->is_integral;
        $row = $this->field('goods_number,rec_id,use_integral')->where($where)->find();
        unset($where);

        //活动信息相关：1-限时优惠
        $promInfo = [];
        if ($prom_type == 1) {
            $promInfo = (new \app\favour\model\FavourGoodsModel)->getFavourInfo($prom_id, $sku_id);
        }

        if ($row) {// 如果购物车已经有此物品，则更新
            $update['use_integral'] = $use_integral;
            // 判断是商品能否购买或修改
            $res = $this->checkGoodsOrder($goods, $num, $spec, $prom_type, $prom_id, $promInfo);
            if ($res !== true) {
                if ($res['code'] == -1) {//如果返回码为-1，更新商品为无效
                    $this->updateCart($row['rec_id'], ['is_invalid' => 1]);
                }
                return $res['msg'];
            }
            if ($this->is_integral == 0) {//非积分商品执行
                $price = $GoodsModel->evalPrice($goods, $num, $spec, $prom_type, $prom_id, $promInfo);//计算需显示的商品价格
                $update['sale_price'] = $price['min_price'];
                if ($goods['give_integral'] == 0) {//1:1赠送积分
                    $update['give_integral'] = $goods['sale_price'];
                } elseif ($goods['give_integral'] > 0) {//赠送指定积分
                    $update['give_integral'] = $goods['give_integral'];
                }
            }
            $update['add_time'] = time();
            $update['goods_number'] = $num;
            $update['is_select'] = 1;
            $update['settle_price'] = $goods['settle_price'];
            $update['shop_price'] = $goods['shop_price'];
            $update['settle_price'] = $goods['settle_price'];
            $update['buy_brokerage'] = $goods['buy_brokerage_amount'];
            $update['prom_type'] = $prom_type;
            $update['prom_id'] = $prom_id;

            $update['is_dividend'] = $goods['is_dividend'];
            $res = $this->where('rec_id', $row['rec_id'])->update($update);
            if ($res < 1) return '未知错误，操作失败，请尝试重新提交';
            $rec_id = $row['rec_id'];
        } else {// 购物车没有此物品，则插入
            $res = $this->checkGoodsOrder($goods, $num, $spec, $prom_type, $prom_id, $promInfo);// 判断是商品能否购买或修改
            if ($res !== true) return $res['msg'];

            $parent = array(
                'is_buy_now' => $type == 'onbuy' ? 1 : 0,
                'user_id' => $this->userInfo['user_id'] * 1,
                'session_id' => session_id(),
                'brand_id' => $goods['brand_id'],
                'cid' => $goods['cid'],
                'supplyer_id' => $goods['supplyer_id'],
                'prom_type' => $prom_type,
                'prom_id' => $prom_id,
                'goods_id' => $goods_id,
                'goods_number' => $num,
                'is_dividend' => $goods['is_dividend'],
                'goods_sn' => addslashes($goods['goods_sn']),
                'goods_name' => addslashes($goods['goods_name']),
                'market_price' => $goods['market_price'],
                'goods_weight' => $goods['goods_weight'],
                'shop_price' => $goods['shop_price'],
                'settle_price' => $goods['settle_price'],
                'is_integral' => $this->is_integral,
                'pic' => $goods['goods_thumb'],
                'use_integral' => $use_integral,
                'add_time' => time(),
                'buy_brokerage'=>$goods['buy_brokerage_amount'],
            );

            $discont = 0;
            if ($this->is_integral == 0) {//非积分商品执行
                $price = $GoodsModel->evalPrice($goods, $num, $spec, $prom_type, $prom_id, $promInfo);//计算需显示的商品价格
                $parent['sale_price'] = $price['min_price'];
                $discont = $goods['shop_price'] - $price['min_price'];
                if ($goods['give_integral'] == 0) {//1:1赠送积分
                    $parent['give_integral'] = $goods['sale_price'];
                } elseif ($goods['give_integral'] > 0) {//赠送指定积分
                    $parent['give_integral'] = $goods['give_integral'];
                }
            } else {
                $parent['sale_price'] = 0;
            }
            if ($sku_id > 0) {
                $sub_goods = $goods['sub_goods'][$spec];
                $SkuCustomModel = new SkuCustomModel();
                $parent['sku_id'] = $sku_id;
                $parent['sku_name'] = $SkuCustomModel->getSkuName($sub_goods);
                $parent['sku_val'] = $sub_goods['sku_val'];
                $parent['goods_sn'] = addslashes($sub_goods['goods_sn']);
                $parent['market_price'] = $sub_goods['market_price'];
                $parent['shop_price'] = $sub_goods['shop_price'];
                if ($this->is_integral == 0) {//非积分商品执行
                    $price = $GoodsModel->evalPrice($goods, $num, $spec, $prom_type, $promInfo);//计算需显示的商品价格
                    $parent['sale_price'] = $price['min_price'];
                    if ($sub_goods['market_price'] > 0 && $sub_goods['market_price'] > $sub_goods['shop_price']) {
                        $discont = $sub_goods['shop_price'] - $parent['sale_price'];
                    }
                } else {
                    $parent['sale_price'] = 0;
                }
                $parent['goods_weight'] = $sub_goods['goods_weight'];

            }
            $parent['discount'] = $discont;

            $res = $this->save($parent);
            if ($res < 1) return '未知错误，操作失败，请尝试重新提交';
            $rec_id = $this->rec_id;
        }
        $this->cleanMemcache();
        return $rec_id;
    }
    /*------------------------------------------------------ */
    //-- 验证商品能否下单
    /*------------------------------------------------------ */
    public function checkGoodsOrder(&$goods, $num, $spec = '', $prom_type = 0, $prom_id = 0, $promInfo = [])
    {
        if ($this->is_integral == 1) {//积分商品
            $IntegralGoodsModel = new \app\integral\model\IntegralGoodsModel();
            $igInfo = $IntegralGoodsModel->info($prom_id, false);
            if ($igInfo['is_on_sale'] != 1) {
                return ['code' => -1, 'msg' => '当前商品暂不能兑换'];
            }
            if (empty($igInfo['goods'])){
                return ['code' => -1, 'msg' => '商品不存在'];
            }
            /* 是否正在销售 */
            if ($igInfo['goods']['is_on_sale'] == 0) {
                return ['code' => -1, 'msg' => '商品【' . $goods['goods_name'] . '】已下架，暂不支持购买！'];
            }
            if ($igInfo['limit_num'] > 0 && $num > $igInfo['limit_num']) {
                return ['code' => -1, 'msg' => '此积分商品单次只允许兑换【' . $igInfo['limit_num'] . '】件'];
            }
            if ($goods['is_spec'] == 1) {// 多规格商品执行
                $sub_goods = $igInfo['goods']['sub_goods'][$spec];
                $SkuCustomModel = new SkuCustomModel();
                $sku_name = $SkuCustomModel->getSkuName($sub_goods);

                if ($sub_goods['BuyMaxNum'] == 0) {
                    return ['code' => -1, 'msg' => '积分商品【' . $goods['goods_name'] . ' - ' . $sku_name . '】暂无库存.'];
                }
                if ($sub_goods['BuyMaxNum'] - $num < 0) {
                    return ['code' => -1, 'msg' => '积分商品【' . $goods['goods_name'] . ' - ' . $sku_name . '】库存不足，剩余：' . $sub_goods['BuyMaxNum']];
                }
            } else {
                if ($igInfo['goods']['BuyMaxNum'] == 0) {
                    return ['code' => -1, 'msg' => '积分商品【'.$goods['goods_name'].'】暂无库存.'];
                }
                if ($igInfo['goods']['BuyMaxNum'] - $num < 0) {
                    return ['code' => -1, 'msg' => '积分商品【'.$goods['goods_name'].'】库存不足，剩余：' . $igInfo['goods']['BuyMaxNum']];
                }

            }
            return true;
        }
        /* 是否正在销售 */
        if ($goods['is_on_sale'] == 0) {
            return ['code' => -1, 'msg' => '商品【' . $goods['goods_name'] . '】已下架，暂不支持购买！'];
        }
        if ($goods['is_alone_sale'] == 0) return ['code' => -1, 'msg' => '商品【' . $goods['goods_name'] . '】为赠品或配件，不能直接进行购买！'];
        if ($goods['is_spec'] == 1) {// 多规格商品执行
            if (empty($spec)) return ['code' => 0, 'msg' => '当前商品为多规格商品，请前往详情页选择规格后再操作'];
            $sub_goods = $goods['sub_goods'][$spec];
            $SkuCustomModel = new SkuCustomModel();
            $sku_name = $SkuCustomModel->getSkuName($sub_goods);
            if ($sub_goods['BuyMaxNum'] < 1) return ['code' => -1, 'msg' => '商品【' . $goods['goods_name'] . ' - ' . $sku_name . '】<br>库存不足，暂不能购买！'];
            if ($sub_goods['goods_number'] < $num) return ['code' => 0, 'msg' => '商品【' . $goods['goods_name'] . ' - ' . $sku_name . '】<br>库存不够当前定义购买数量，不能直接进行购买！'];
        } else {// 单规格商品执行
            if ($goods['goods_number'] < $num) return ['code' => 0, 'msg' => '商品【' . $goods['goods_name'] . '】<br>库存不够当前定义购买数量，不能直接进行购买！'];
        }

        //活动相关：1-限时优惠
        if ($prom_type == 1) {
            if ($promInfo['code'] == 0) return ['code' => -1, 'msg' => '商品【' . $goods['goods_name'] . '】<br>' . $promInfo['msg']];
            $favourGoods = $promInfo['data']['goods'];
            $favourGoodsInfo = $promInfo['data']['goodsInfo'];
            if ($goods['is_spec'] == 1) {// 多规格商品执行
                $sub_goods = $goods['sub_goods'][$spec];
                $SkuCustomModel = new SkuCustomModel();
                $sku_name = $SkuCustomModel->getSkuName($sub_goods);
                if ($favourGoodsInfo['goods_number'] < 1) return ['code' => -1, 'msg' => '商品【' . $goods['goods_name'] . ' - ' . $sku_name . '】<br>活动库存不足，暂不能购买！'];
                if ($favourGoodsInfo['goods_number'] < $num) return ['code' => 0, 'msg' => '商品【' . $goods['goods_name'] . ' - ' . $sku_name . '】<br>活动库存不够当前定义购买数量，不能直接进行购买！'];

                if ($favourGoods['limit_num'] > 0) {
                    $ogNum = (new \app\favour\model\FavourGoodsModel)->getFavourBuyNum($promInfo);
                    if (($num + $ogNum) > $favourGoods['limit_num']) return ['code' => 0, 'msg' => '商品【' . $goods['goods_name'] . ' - ' . $sku_name . '】<br>当前活动档期只能购买' . $favourGoods['limit_num'] . '件<br>已购买' . $ogNum . '件'];
                }

            } else {// 单规格商品执行
                if ($favourGoodsInfo['goods_number'] < 1) return ['code' => -1, 'msg' => '商品【' . $goods['goods_name'] . '】<br>活动库存不足，暂不能购买！'];
                if ($favourGoodsInfo['goods_number'] < $num) return ['code' => 0, 'msg' => '商品【' . $goods['goods_name'] . '】<br>活动库存不够当前定义购买数量，不能直接进行购买！'];
                if ($favourGoods['limit_num'] > 0) {
                    $ogNum = (new \app\favour\model\FavourGoodsModel)->getFavourBuyNum($promInfo);
                    if (($num + $ogNum) > $favourGoods['limit_num']) return ['code' => 0, 'msg' => '商品【' . $goods['goods_name'] . '】<br>当前活动档期只能购买' . $favourGoods['limit_num'] . '件<br>已购买' . $ogNum . '件'];
                }
            }
            return true;
        }

        //限制等级购买
        if (empty($goods['limit_user_level']) == false) {
            $limit_user_level = explode(',', $goods['limit_user_level']);
            if (in_array($this->userInfo['level']['level_id'], $limit_user_level) == false) {
                return ['code' => -1, 'msg' => langMsg('商品【' . $goods['goods_name'] . '】，您的等级不满足购买条件.','shop.flow.limit_user_level',[$goods[LANG_PRE.'goods_name']])];
            }
        }
        //限制身份购买
        if (empty($goods['limit_user_role']) == false) {
            $limit_user_role = explode(',', $goods['limit_user_role']);
            if (in_array($this->userInfo['role_id'], $limit_user_role) == false) {
                return ['code' => -1, 'msg' => '商品【' . $goods['goods_name'] . '】，您的身份不满足购买条件.'];
            }
        }

        if ($goods['is_spec'] == 1) {// 多规格商品执行
            if (empty($spec)) return ['code' => 0, 'msg' => '当前商品为多规格商品，请前往详情页选择规格后再操作'];
            $sub_goods = $goods['sub_goods'][$spec];
            $SkuCustomModel = new SkuCustomModel();
            $sku_name = $SkuCustomModel->getSkuName($sub_goods);
            if ($sub_goods['BuyMaxNum'] < 1) return ['code' => -1, 'msg' => '商品【' . $goods['goods_name'] . ' - ' . $sku_name . '】<br>库存不足，暂不能购买！'];
            if ($num > $sub_goods['BuyMaxNum']) return ['code' => 0, 'msg' => '商品【' . $goods['goods_name'] . ' - ' . $sku_name . '】<br>只能购买' . $sub_goods['BuyMaxNum'] . '件'];
            if ($sub_goods['goods_number'] < $num) return ['code' => 0, 'msg' => '商品【' . $goods['goods_name'] . ' - ' . $sku_name . '】<br>库存不够当前定义购买数量，不能直接进行购买！'];
        } else {// 单规格商品执行
            if ($goods['goods_number'] < $num) return ['code' => 0, 'msg' => '商品【' . $goods['goods_name'] . '】<br>库存不够当前定义购买数量，不能直接进行购买！'];
            $BuyMaxNum = $goods['goods_number'];
            if ($goods['limit_num'] > 0) $BuyMaxNum = $BuyMaxNum > $goods['limit_num'] ? $goods['limit_num'] : $BuyMaxNum;
            if ($num > $BuyMaxNum) return ['code' => 0, 'msg' => '商品【' . $goods['goods_name'] . '】只能购买' . $BuyMaxNum . '件'];
        }
        return true;
    }
    /*------------------------------------------------------ */
    //-- 购物车信息
    //-- $is_sel int 是否选中
    //-- $no_cache bool 是否不使用缓存
    //-- $recids string 指定购物车中的商品
    //-- $is_collect bool 是否执行判断是否收藏
    //-- $hideSettle bool 是否隐藏供货价，默认隐藏
    /*------------------------------------------------------ */
    public function getCartList($is_sel = 0, $no_cache = false, $recids = '', $is_collect = true, $hideSettle = true)
    {
        $user_id = $this->userInfo['user_id'] * 1;
        if ($user_id < 1) {
            $where[] = ['session_id', '=', session_id()];
        } else {
            $where[] = ['user_id', '=', $this->userInfo['user_id']];
            if (empty($recids) == true) {//非立即购买请求，删除购物车中的立即购买商品
                $delwhere[] = ['user_id', '=', $this->userInfo['user_id']];
                $delwhere[] = ['is_buy_now', '=', 1];
                $this->where($delwhere)->delete();
            }
        }

        $where[] = ['is_integral', '=', $this->is_integral];
        if ($is_sel == 1) $where[] = ['is_select', '=', 1];

        if (empty($recids) == false) {
            $where[] = ['rec_id', 'in', explode(',', $recids)];
        } elseif ($no_cache == false) {
            if ($user_id > 0) {
                $mkey = 'CartInfo_' . $user_id . '_' . $is_sel . $this->is_integral;
            } else {
                $mkey = 'CartInfo_' . session_id() . '_' . $is_sel . $this->is_integral;
            }
            $data = Cache::get($mkey);
        }

        if (empty($data['allGoodsNum'])) {
            $data['isAllSel'] = 1;
            $data['orderTotal'] = 0;
            $data['buyGoodsNum'] = 0;
            $data['buyGoodsWeight'] = 0;
            $data['allGoodsNum'] = 0;
            $data['totalDiscount'] = 0;
            $data['totalGoodsPrice'] = 0;
            $rows = $this->where($where)->order('rec_id ASC')->select();
            foreach ($rows as $key => $row) {
                if ($row['is_invalid'] == 1) {//无效记录到无效列表
                    $data['invalidList'][] = $row;
                    continue;
                }
                if ($row['is_select'] == 0) {
                    $data['isAllSel'] = 0;
                }
                $gid_list[$row['goods_id']] = 1;
                $data['allGoodsNum'] += $row['goods_number'];
                if ($row['is_select'] == 1) {
                    //记录购买的商品品牌，分类，单品ID
                    $cat_list[$row['cid']] = 1;
                    $brand_list[$row['brand_id']] = 1;
                    $data['buyGoodsNum'] += $row['goods_number'];
                    $data['buyGoodsWeight'] += $row['goods_number'] * $row['goods_weight'];
                }
                if ($row['use_integral'] > 0) {
                    if ($row['is_select'] == 1) {
                        $data['integralTotal'] += $row['goods_number'] * $row['use_integral'];
                    }
                }
                if ($this->is_integral == 1) {
                    $row['total'] = $row['goods_number'] * $row['use_integral'];
                } else {
                    $row['total'] = $row['goods_number'] * $row['sale_price'];
                    if ($row['is_select'] == 1) {
                        $data['orderTotal'] += $row['total'];
                        $data['totalGoodsPrice'] += $row['goods_number'] * $row['sale_price'];
                        //当销售价和商城价一致时，计算折扣的总金额
                        if ($row['shop_price'] > $row['sale_price']) {
                            $data['totalDiscount'] += ($row['shop_price'] - $row['sale_price']) * $row['goods_number'];
                        }
                    }
                }
                $row['exp_price'] = explode('.', $row['sale_price']);
                if ($hideSettle == true) {//隐藏供货价
                    unset($row['settle_price']);
                }
                $data['goodsList'][$row['goods_id'] . '_' . $row['sku_val']] = $row;
                $data['supplyerGoods'][$row['supplyer_id']][] = $row['goods_id'] . '_' . $row['sku_val'];
            }
            unset($rows);
            if (empty($brand_list) == false) $data['brand_list'] = array_keys($brand_list);
            if (empty($cat_list) == false) $data['cat_list'] = array_keys($cat_list);
            if (empty($gid_list) == false) $data['gid_list'] = array_keys($gid_list);

            $data['totalDiscount'] = sprintf("%.2f", $data['totalDiscount']);
            $data['totalGoodsPrice'] = sprintf("%.2f", $data['totalGoodsPrice']);
            $data['orderTotal'] = sprintf("%.2f", $data['orderTotal'] );
            $data['exp_total'] = explode('.', $data['orderTotal']);

            Cache::set($mkey, $data, 60);
        }
        //没有指定选和指定商品，执行查询是否收藏
        if ($is_sel == 0 && empty($recids) == true && $is_collect == true) {
            $GoodsCollectModel = new GoodsCollectModel();
            foreach ($data['goodsList'] as $key => $goods) {
                $where = [];
                $where[] = ['user_id', '=', $user_id];
                $where[] = ['goods_id', '=', $goods['goods_id']];
                $where[] = ['status', '=', 1];
                $data['goodsList'][$key]['is_collect'] = $GoodsCollectModel->where($where)->count();
            }
        }
        $shipping_fee_type = settings('shipping_fee_type');
        if ($shipping_fee_type == 1) {//供应商商品独立计算，获取供应商名称
            $SupplyerModel = new \app\supplyer\model\SupplyerModel();
            foreach ($data['supplyerGoods'] as $supplyer_id=>$val){
                if ($supplyer_id > 0){
                    $data['supplyerList'][$supplyer_id] = $SupplyerModel->where('supplyer_id',$supplyer_id)->value('supplyer_name');
                }
            }
        }
        return $data;
    }
    /*------------------------------------------------------ */
    //-- 获取购物车商品数量和金额
    /*------------------------------------------------------ */
    public function getCartInfo()
    {
        $data = $this->getCartList(0, false, '', false);
        $info['num'] = $data['buyGoodsNum'];
        if ($this->is_integral == 1) {
            $info['total'] = $data['integralTotal'];
        } else {
            $info['total'] = $data['orderTotal'];
        }
        return $info;
    }
    /*------------------------------------------------------ */
    //-- 更新购物车数据
    /*------------------------------------------------------ */
    public function updateCart($rec_id, $data)
    {
        if (is_numeric($rec_id)) {
            $where['rec_id'] = $rec_id;
        }
        $where['user_id'] = $this->userInfo['user_id'] * 1;
        if ($where['user_id'] == 0) $where['session_id'] = session_id();
        $res = $this->where($where)->update($data);
        $this->cleanMemcache();
        return $res;
    }
    /*------------------------------------------------------ */
    //-- 更新商品数据
    /*------------------------------------------------------ */
    public function updataGoods($rec_id, $num)
    {
        $cg = $this->where('rec_id', $rec_id)->find();
        $GoodsModel = new GoodsModel();
        $goods = $GoodsModel->info($cg['goods_id'], false);

        //活动信息相关：1-限时优惠
        $promInfo = [];
        if ($cg['prom_type'] == 1) {
            $promInfo = (new \app\favour\model\FavourGoodsModel)->getFavourInfo($cg['prom_id'], $cg['sku_id']);
        }

        // 判断是商品能否购买或修改
        $res = $this->checkGoodsOrder($goods, $num, $cg['sku_val'], $cg['prom_type'], $cg['prom_id'], $promInfo);
        if ($res !== true) {
            if ($res['code'] == -1) {//如果返回码为-1，更新商品为无效
                $this->updateCart($rec_id, ['is_invalid' => 1]);
            }
            return $res['msg'];
        }
        //计算需显示的商品价格
        $price = $GoodsModel->evalPrice($goods, $num, $cg['sku_val'], $cg['prom_type'], $cg['prom_id'], $promInfo);
        $arr['goods_number'] = $num;
        $arr['is_select'] = 1;
        if ($goods['is_spec'] == 1) {
            $arr['settle_price'] = $goods['sub_goods'][$cg['sku_val']]['settle_price'];
        } else {
            $arr['settle_price'] = $goods['settle_price'];
        }
        $arr['sale_price'] = $price['min_price'];
        $arr['sale_price'] = $price['min_price'];
        if ($goods['is_spec'] == 1){
            $arr['market_price'] = $goods['sub_goods'][$cg['sku_val']]['market_price'];
        }else{
            $arr['market_price'] = $goods['market_price'];
        }

        return $this->updateCart($rec_id, $arr, $this->is_integral);
    }
    /*------------------------------------------------------ */
    //-- 删除购物车商品
    /*------------------------------------------------------ */
    public function delGoods($rec_id = 0)
    {
        if ($rec_id > 0) {
            $map['rec_id'] = $rec_id;
        }else{
            $map['is_select'] = 1;
        }
        $map['user_id'] = $this->userInfo['user_id'] * 1;
        if ($map['user_id'] == 0) $map['session_id'] = session_id();
        $map['is_integral'] = $this->is_integral;
        $this->where($map)->delete();
        $this->cleanMemcache();
        return true;
    }
    /*------------------------------------------------------ */
    //-- 清除购物车无效的商品
    /*------------------------------------------------------ */
    public function clearInvalid()
    {
        $map['user_id'] = $this->userInfo['user_id'] * 1;
        if ($map['user_id'] == 0) $map['session_id'] = session_id();
        $map['is_integral'] = $this->is_integral;
        $map['is_invalid'] = 1;
        $this->where($map)->delete();
        $this->cleanMemcache();
        return true;
    }

    /**计算运费
     * @param array $userAddress 收货地址信息
     * @param array $cartList 购物车商品
     * @return int
     */
    public function evalShippingFee(&$userAddress = [], &$cartList = [])
    {
        if ($cartList['buyGoodsNum'] < 1) return 0;
        $GoodsModel = new GoodsModel();
        $CategoryModel = new CategoryModel();
        $Category = $CategoryModel->getRows();
        $sf_id = array();
        $shipping_fee_plus = settings('shipping_fee_plus');//运费累加计算方式
        $sfCartList = [];
        $shipping_tmp_supplyer = settings('shipping_tmp_supplyer');//运费模板是否调用供应商
        $ShippingTplModel = new \app\shop\model\ShippingTplModel();
        $defSf = [];
        foreach ($cartList['goodsList'] as $goods) {
            $goods_sfid = $GoodsModel->where('goods_id',$goods['goods_id'])->value('freight_template');
            $supplyer_id = $goods['supplyer_id'];
            if ($shipping_tmp_supplyer == 0 && $supplyer_id > 0){//统一调用平台运费模板
                $tpl_supplyer_id = $ShippingTplModel->where('sf_id',$goods_sfid)->value('supplyer_id');
                if ($tpl_supplyer_id > 0){//非平台运费模板，强制调用平台默认模板
                    $goods_sfid = -1;
                }
                $supplyer_id = 0;//排除供应商相关运费模板
            }

            if ($goods_sfid == -1) {
                if (empty($defSf[$supplyer_id]) == true){
                    //获取对应平台/供应商默认模板
                    $defSf[$supplyer_id] = $ShippingTplModel->where('supplyer_id',$supplyer_id)->order('is_default DESC')->value('sf_id');
                }
                $goods_sfid = $defSf[$supplyer_id];
                if($supplyer_id == 0) {//判断平台商品分类运费模板
                    $class = $Category[$goods['cid']];
                    if ($class['freight_template'] > 0) {
                        $goods_sfid = $class['freight_template'];
                    }
                }
                $sf_id[$goods_sfid] = $supplyer_id;
            }elseif ($goods_sfid > 0) {//设置商品运模板
                $sf_id[$goods_sfid] = $goods['supplyer_id'];
            }

            if (empty($sfCartList[$goods_sfid]) == true){
                $sfCartList[$goods_sfid]['totalGoodsPrice'] = 0;
                $sfCartList[$goods_sfid]['buyGoodsNum'] = 0;
                $sfCartList[$goods_sfid]['buyGoodsWeight'] = 0;
            }
            $sfCartList[$goods_sfid]['totalGoodsPrice'] += $goods['goods_number'] * $goods['sale_price'];
            $sfCartList[$goods_sfid]['buyGoodsNum'] += $goods['goods_number'];
            $sfCartList[$goods_sfid]['buyGoodsWeight'] += $goods['goods_number'] * $goods['goods_weight'];
        }
        if (empty($sf_id)) {
            return 0;
        }
        $ShippingModel = new \app\shop\model\ShippingModel();
        $shippingList = $ShippingModel->getToSTRows();

        $sfList = array();
        //获取最贵的运费模板，根据起步价判断
        foreach ($sf_id as $key => $val) {
            $ssTpl = $ShippingTplModel->find($key);
            if (empty($ssTpl)) continue;
            $sf_info = json_decode($ssTpl['sf_info'],true);
            if ($shipping_fee_plus == 0){//不累加运费
                $setSfId = 0;
            }else{
                $setSfId = $ssTpl['sf_id'];
            }
            foreach ($shippingList as $code => $shipping) {
                if ($shipping['status'] == 0 || empty($sf_info[$code])) continue;
                foreach ($sf_info[$code] as $rowb) {
                    $region_id = empty($rowb['region_id']) ? array() : explode(',', $rowb['region_id']);
                    if (empty($rowb['area']) && empty($rowb['region_id'])) continue;//区域定义为空跳出

                    if (empty($rowb['area']) == false) {//如果是全国
                        if (empty($sfList[$setSfId][$code]) == false){//已有区域定义，跳出
                            continue;
                        }
                    }elseif (in_array($userAddress['city'], $region_id) == false) {
                        //如果不存在区域，跳出
                        continue;
                    }

                    if (empty($sfList[$setSfId][$code]) == true) {//如果已存在相关运费的模板，按初始运费对比，不论计件或计重
                        if ($sfList[$setSfId][$code]['postage'] > $rowb['postage']) {
                            continue;
                        }
                    }
                    $rowb['sf_id'] = $ssTpl['sf_id'];
                    $rowb['consume'] = $ssTpl['consume'];
                    $rowb['sf_name'] = $ssTpl['sf_name'];
                    $rowb['valuation'] = $ssTpl['valuation'];
                    $sfList[$setSfId][$code] = $rowb;
                }
            }
        }
        foreach ($sfList as $sf){
            foreach ($sf as $code => $row) {
                if (empty($n_info[$code]['shipping_fee']) == true){
                    $n_info[$code]['shipping_fee'] = 0;
                }

                $n_info[$code]['name'] = $shippingList[$code]['shipping_name'];
                $n_info[$code]['code'] = $code;
                $n_info[$code]['sf_id'] = $row['sf_id'];
                $sf_id = $row['sf_id'];

                if ($row['consume'] > 0 && $sfCartList[$sf_id]['totalGoodsPrice'] >= $row['consume']) {
                    $n_info[$code]['shipping_fee'] += 0;
                } else {
                    if ($row['valuation'] == 1){//根据商品数量计算
                        if ($sfCartList[$sf_id]['buyGoodsNum'] > $row['start']) {
                            $d_num = $sfCartList[$sf_id]['buyGoodsNum'] - $row['start'];
                            $d_num = ceil($d_num / $row['plus']);
                            $n_info[$code]['shipping_fee'] += $row['postage'] + ($d_num * $row['postageplus']);
                        } else {
                            $n_info[$code]['shipping_fee'] += $row['postage'];
                        }
                    }else{//根据商品重量计算
                        $buyGoodsWeight = $sfCartList[$sf_id]['buyGoodsWeight'] / 1000;
                        if ($buyGoodsWeight > $row['start']) {
                            $d_num = $buyGoodsWeight - $row['start'];
                            $d_num = ceil($d_num / $row['plus']);
                            $n_info[$code]['shipping_fee'] += $row['postage'] + ($d_num * $row['postageplus']);
                        } else {
                            $n_info[$code]['shipping_fee'] += $row['postage'];
                        }
                    }
                }
            }
        }
        return $n_info;
    }
    /*------------------------------------------------------ */
    //-- 登陆更新购物车的中商品信息
    /*------------------------------------------------------ */
    public function loginUpCart($user_id)
    {
        //更新老的购物车数据
        $where['user_id'] = 0;
        $where['session_id'] = session_id();
        $nRows = $this->where($where)->select();
        unset($where);
        $newGoods = array();
        foreach ($nRows as $row) {
            $newGoods[$row['goods_id'] . '_' . $row['sku_val']] = $row;
        }

        $oldRows = $this->where('user_id', $user_id)->select();
        if (empty($oldRows) == false) {
            $GoodsModel = new GoodsModel();
            foreach ($oldRows as $row) {
                $nrow = $newGoods[$row['goods_id'] . '_' . $row['sku_val']];
                if (empty($nrow) == false) {//如果存在新的，删除
                    $this->where('rec_id', $row['rec_id'])->delete();
                    continue;
                }
                $goods = $GoodsModel->info($row['goods_id']);
                $checkGoods = $this->checkGoodsOrder($goods, $row['goods_number'], $row['sku_val']);
                $upDate = array();
                if ($checkGoods !== true) {
                    $upDate['is_invalid'] = 1;
                }
                $price = $GoodsModel->evalPrice($goods, $row['goods_number'], $row['sku_val']);//计算需显示的商品价格
                $upDate['sale_price'] = $price['min_price'];
                $this->where('rec_id', $row['rec_id'])->update($upDate);
            }
        }
        $where['session_id'] = session_id();
        $where['user_id'] = 0;
        $this->where($where)->update(['user_id' => $user_id]);
        unset($where);
        return true;
    }
}
