<?php

namespace app\integral\controller\sys_admin;

use think\Db;
use app\AdminController;
use app\integral\model\IntegralGoodsModel;
use app\integral\model\IntegralGoodsListModel;
use app\shop\model\GoodsModel;


/**
 * 积分商品相关
 * Class Index
 * @package app\store\controller
 */
class IntegralGoods extends AdminController
{
    //*------------------------------------------------------ */
    //-- 初始化
    /*------------------------------------------------------ */
    public function initialize()
    {
        parent::initialize();
        $this->Model = new IntegralGoodsModel();
    }
    //*------------------------------------------------------ */
    //-- 首页
    /*------------------------------------------------------ */
    public function index()
    {
        $this->getList(true);
        return $this->fetch('index');
    }
    /*------------------------------------------------------ */
    //-- 获取列表
    //-- $runData boolean 是否返回模板
    /*------------------------------------------------------ */
    public function getList($runData = false) {
        $where = [];
        $status = input('status',0,'intval');
        $time = time();
        switch ($status)
        {
            case 1:
                $where[] = ['ig.start_date', '>', $time];
            break;
            case 2:
                $where[] = ['ig.start_date', '<', $time];
                $where[] = ['ig.end_date', '>', $time];
            break;
            case 3:
                $where[] = ['ig.end_date', '<', $time];
            break;
            default:
            break;
        }
        $viewObj = $this->Model->alias('ig')->join("shop_goods g", 'ig.goods_id=g.goods_id', 'left');
        $viewObj->where($where)->field('ig.*,g.goods_name,g.goods_sn,g.is_spec')->order('ig_id DESC');
        $this->data = $this->getPageList($this->Model, $viewObj);
        $this->assign("data", $this->data);
        $this->assign("time", $time);
        if ($runData == false){
            $this->data['content'] = $this->fetch('list')->getContent();
            unset($this->data['list']);
            return $this->success('','',$this->data);
        }
        return true;
    }


    /*------------------------------------------------------ */
    //-- 信息页调用
    //-- $data array 自动读取对应的数据
    /*------------------------------------------------------ */
    public function asInfo($data)
    {
        if ($data['ig_id'] > 0){
            $goods = (new GoodsModel)->info($data['goods_id']);
            $this->assign('goods',$goods);
            if ($goods['is_spec'] == 1){
                $fg_rows = (new IntegralGoodsListModel)->where('ig_id',$data['ig_id'])->select();
                $ig_goods = [];
                foreach ($fg_rows as $fg){
                    $ig_goods[$fg['sku_id']] = $fg;
                }
            }else{
                $ig_goods = (new IntegralGoodsListModel)->where('ig_id',$data['ig_id'])->find();
            }

            $this->assign('ig_goods',$ig_goods);
        }
        return $data;
    }
    /*------------------------------------------------------ */
    //-- 添加前调用
    /*------------------------------------------------------ */
    public function beforeAdd($row)
    {
        $row = $this->checkData($row);
        $count = $this->Model->where('goods_id',$row['goods_id'])->count();
        if ($count > 0){
            return $this->error('此积分商品已设置，不能重复设置.');
        }
        Db::startTrans();//启动事务
        $row['add_time'] = $row['update_time'] = time();
        return $row;
    }
    /*------------------------------------------------------ */
    //-- 添加后调用
    /*------------------------------------------------------ */
    public function afterAdd($row)
    {
        $sku_ids = input('sku_ids');
        $ig_number= input('ig_number');
        $integral = input('integral');
        $IntegralGoodsListModel = new IntegralGoodsListModel();
        $inData['ig_id'] = $row['ig_id'];
        $inData['update_time'] = time();
        if (empty($sku_ids)) {
            $inData['goods_id'] = $row['goods_id'];
            $inData['ig_number'] = $ig_number * 1;
            $inData['integral'] = $integral * 1;
            if ($inData['integral'] < 0) {
                Db::rollback();// 回滚事务
                return $this->error('兑换积分不能小于0.');
            }

            $res = $IntegralGoodsListModel->create($inData);
            if ($res->gid < 1) {
                Db::rollback();// 回滚事务
                return $this->error('写入积分兑换商品失败.');
            }
        }else{
            foreach ($sku_ids as $key => $sku_id) {
                $inData['sku_id'] = $sku_id;
                $inData['goods_id'] = $row['goods_id'] * 1;
                $inData['ig_number'] = $ig_number[$sku_id] * 1;
                $inData['integral'] = $integral[$sku_id] * 1;
                if ($inData['integral'] < 0) {
                    Db::rollback();// 回滚事务
                    return $this->error('兑换积分不能小于0.');
                }
                $res = $IntegralGoodsListModel->create($inData);
                if ($res->gid < 1) {
                    Db::rollback();// 回滚事务
                    return $this->error('写入积分兑换商品失败.');
                }
            }
        }
        Db::commit();// 提交事务
        return $this->success('添加成功', url('index'));
    }
    /*------------------------------------------------------ */
    //-- 修改前处理
    /*------------------------------------------------------ */
    public function beforeEdit($row)
    {
        $row = $this->checkData($row);
        Db::startTrans();//启动事务
        $row['update_time'] = time();
        return $row;
    }
    /*------------------------------------------------------ */
    //-- 修改后调用
    /*------------------------------------------------------ */
    public function afterEdit($row)
    {
        $sku_ids = input('sku_ids');
        $ig_number = input('ig_number');
        $integral = input('integral');
        $IntegralGoodsListModel = new IntegralGoodsListModel();
        $inData['ig_id'] = $row['ig_id'];
        $time = time();
        $inData['update_time'] = $time;
        if (empty($sku_ids)) {
            $inData['is_select'] = 1;
            $inData['ig_number'] = $ig_number * 1;
            $inData['integral'] = $integral * 1;
            if ($inData['integral'] < 0) {
                Db::rollback();// 回滚事务
                return $this->error('兑换积分不能小于0.');
            }

            $where = [];
            $where[] = ['ig_id','=',$row['ig_id']];
            $where[] = ['goods_id','=',$row['goods_id']];
            $count = $IntegralGoodsListModel->where($where)->count();
            if ($count > 0){
                $res = $IntegralGoodsListModel->where($where)->update($inData);
            }else{
                $inData['goods_id'] = $row['goods_id'];
                $res = $IntegralGoodsListModel->save($inData);
            }

            if ($res < 1) {
                Db::rollback();// 回滚事务
                return $this->error('处理积分兑换商品失败-1.');
            }
        }else{
            foreach ($sku_ids as $key => $sku_id) {
                $inData['is_select'] = 1;
                $inData['sku_id'] = $sku_id;
                $inData['goods_id'] = $row['goods_id'];
                $inData['ig_number'] = $ig_number[$sku_id] * 1;
                $inData['integral'] = $integral[$sku_id] * 1;
                if ($inData['integral'] < 0) {
                    Db::rollback();// 回滚事务
                    return $this->error('兑换积分不能小于0.');
                }
                $where = [];
                $where[] = ['ig_id','=',$row['ig_id']];
                $where[] = ['goods_id','=',$row['goods_id']];
                $where[] = ['sku_id','=',$sku_id];
                $count = $IntegralGoodsListModel->where($where)->count();
                if ($count > 0){
                    $res = $IntegralGoodsListModel->where($where)->update($inData);
                }else{
                    $res = $IntegralGoodsListModel->create($inData);
                    $res = $res->gid;
                }
                if ($res < 1) {
                    Db::rollback();// 回滚事务
                    return $this->error('处理积分兑换商品失败-2.');
                }
            }
            unset($delwhere);
            $noselwhere[] = ['ig_id','=',$row['ig_id']];
            $noselwhere[] = ['update_time','<',$time];
            $IntegralGoodsListModel->where($noselwhere)->update(['is_select'=>0,'update_time'=>$time]);
        }

        Db::commit();// 提交事务
        $this->Model->cleanMemcache($row['ig_id']);
        return $this->success('修改成功', url('index'));
    }
    /*------------------------------------------------------ */
    //-- 验证相关数据
    /*------------------------------------------------------ */
    public function checkData($row)
    {
        if ($row['goods_id'] < 1) {
            return $this->error('请选择用于积分兑换的商品.');
        }
        $sku_ids = input('sku_ids');
        $integral = input('integral');
        $ig_number = input('ig_number');
        $goods = (new GoodsModel)->info($row['goods_id']);
        if ($goods['is_spec'] == 1) {
            if (empty($sku_ids) == true) {
                return $this->error('请选择用于积分兑换的商品.');
            }
            foreach ($sku_ids as $key => $sku_id) {
                if ($ig_number[$sku_id] <= 0){
                    return $this->error('勾选的sku没有设置兑换库存.');
                }
                if ($integral[$sku_id] <= 0){
                    return $this->error('勾选的sku没有设置兑换积分.');
                }
                $_integral[] = $integral[$sku_id];
            }
        } else {
            if ($ig_number <= 0){
                return $this->error('没有设置兑换库存.');
            }
            if ($integral <= 0){
                return $this->error('没有设置兑换积分.');
            }
            $_integral[] = $integral * 1;
        }
        $row['show_integral'] = min($_integral);
        if (empty($row['start_date']) || empty($row['end_date'])) return $this->error('操作失败:请选择兑换时间.');
        if (!checkDateIsValid($row['start_date'])) return $this->error('操作失败:开始时间格式不合法.');
        if (!checkDateIsValid($row['end_date'])) return $this->error('操作失败:结束时间格式不合法.');
        $row['start_date'] = strtotime($row['start_date']);
        $row['end_date'] = strtotime($row['end_date']);
        if ($row['start_date'] >= $row['end_date']) return $this->error('操作失败::开始时间必须大于结束时间.');
        return $row;
    }
    /*------------------------------------------------------ */
    //-- 获取商品详情
    /*------------------------------------------------------ */
    public function getGoodsInfo()
    {
        $goods_id = input('goods_id',0,'intval');
        if ($goods_id < 1) return $this->error('传参错误.');
        $goods = (new GoodsModel)->info($goods_id);
        if (empty($goods)){
            return $this->error('商品不存在.');
        }
        $return['code'] = 1;
        $return['goods'] = $goods;
        return $this->ajaxReturn($return);
    }
}