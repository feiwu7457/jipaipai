<?php
namespace app\weixin\controller\sys_admin;
use think\Db;
use app\AdminController;
use app\member\model\UsersModel;
use app\weixin\model\MiniModel;
use app\weixin\model\LiveRoomModel;
use app\weixin\model\LiveGoodsModel;
use app\shop\model\OrderGoodsModel;
/**
 * 微信设置
 * Class Index
 * @package app\store\controller
 */
class LiveRoom extends AdminController
{
	/*------------------------------------------------------ */
	//-- 优先执行
	/*------------------------------------------------------ */
	public function initialize(){
        parent::initialize();
        $this->Model = new LiveRoomModel();
    }

    /*------------------------------------------------------ */
    //--首页
    /*------------------------------------------------------ */
    public function index()
    {
        $this->Model->getRoomListToDb();
        $this->getList(true);
        return $this->fetch('index');
    }
    /*------------------------------------------------------ */
    //-- 获取列表
    //-- $runData boolean 是否返回模板
    /*------------------------------------------------------ */
    public function getList($runData = false) {
        $this->assign("live_status", $this->Model->live_status);
        $where = [];
        $search['live_status'] = input('live_status','','trim');
        if (empty($search['live_status']) == false){
            $where[] = ['live_status','=',$search['live_status']];
        }
        $search['keyword'] = input('keyword','','trim');
        if (empty($search['keyword']) == false){
            if (is_numeric($search['keyword'])) {
                $where[] = ['anchor_user_id','=',$search['keyword']];
            } else {
                $where[] = ['name','like','%'.$search['keyword'].'%'];
            }
        }
        $this->sqlOrder = "start_time DESC";
        $data = $this->getPageList($this->Model,$where);
        $this->assign("data", $data);
        if ($runData == false){
            $data['content']= $this->fetch('list')->getContent();
            unset($data['list']);
            return $this->success('','',$data);
        }
        return true;
    }
    /*------------------------------------------------------ */
    //-- 添加直播间
    /*------------------------------------------------------ */
    public function add()
    {
        if ($this->request->isPost()) {
            $data = input('post.');
            $data['startTime'] = strtotime($data['startTime']);
            $data['endTime'] = strtotime($data['endTime']);
            $anchor_user_id = $data['select_user'];
            unset($data['select_user']);
            $res = (new MiniModel)->createLiveRoom($data);
            if ($res['errcode'] > 0){
                return $this->error($res['errmsg']);
            }
            $roomData['start_time'] = $data['startTime'];
            $roomData['end_time'] = $data['endTime'];
            $roomData['roomid'] = $res['roomId'];
            $roomData['anchor_user_id'] = $anchor_user_id;
            $res = $this->Model->save($roomData);
            if ($res == false){
                return $this->error('写入数据库失败.');
            }
            return $this->success('添加成功.');
        }
        return $this->fetch('add');
    }
    /*------------------------------------------------------ */
    //-- 绑定主播会员
    /*------------------------------------------------------ */
    public function editAnchor()
    {
        $id = input('id', 0, 'intval');
        $roomInfo = $this->Model->find($id);
        if (empty($roomInfo)){
            return $this->error('没有找到相关房间数据.');
        }
        if ($this->request->isPost()) {
            $select_user_id = input('select_user', 0, 'intval');
            if ($select_user_id < 1){
                return $this->error('请选择绑定会员.');
            }
            if ($select_user_id == $roomInfo['anchor_user_id']){
                return $this->error('没有变化.');
            }
            if ($roomInfo['anchor_user_id'] > 0 && $roomInfo['live_status'] > 102){
                return $this->error('已结束的直播不能修改.');
            }
            $upData['anchor_user_id'] = $select_user_id;
            $res = $this->Model->where('id',$id)->update($upData);
            if ($res < 1) return $this->error();
            (new UsersModel)->upInfo($select_user_id,['is_player'=>1]);
            $this->_log($id, '绑定主播会员：'.userInfo($select_user_id));
            return $this->success('绑定主播会员成功', 'reload');
        }
        $this->assign('roomInfo',$roomInfo);
        return $this->fetch('edit_anchor');
    }
    /*------------------------------------------------------ */
    //-- 管理直播间商品
    /*------------------------------------------------------ */
    public function editGoods()
    {
        $id = input('id', 0, 'intval');
        $roomInfo = $this->Model->find($id);
        if (empty($roomInfo)){
            return $this->error('没有找到相关房间数据.');
        }
        $LiveGoodsModel = new LiveGoodsModel();
        if ($this->request->isPost()) {
            if ($roomInfo['live_status'] > 102){
                return $this->error('已结束的直播不能修改.');
            }
            $goods_ids = input('goods_ids');
            if (empty($goods_ids)){
                return $this->error('请选择直播商品.');
            }
            $lgwhere[] = ['goodsId','in',$goods_ids];
            $shop_goods_id = $LiveGoodsModel->where($lgwhere)->column('shop_goods_id');
            $upData['goods_ids'] = join(',',$shop_goods_id);
            if ($roomInfo['goods_ids'] == $upData['goods_ids']){
                return $this->error('直播商品没有变化，无须修改.');
            }
            Db::startTrans();//启动事务
            $res = $this->Model->where('id',$id)->update($upData);
            if ($res < 1){
                Db::rollback();// 回滚事务
                return $this->error('更新失败.');
            }
            $postData['ids'] = $goods_ids;
            $postData['roomId'] = $roomInfo['roomid'];
            $res = (new MiniModel)->addRoomGoods($postData);
            if (empty($res['errcode']) == false){
                Db::rollback();// 回滚事务
                return $this->error('微信端返回错误：'.$res['errcode'].'-'.$res['errmsg']);
            }
            $this->_log($id,'导入直播间商品：'.$upData['goods_ids']);
            return $this->success('修改直播商品成功', 'reload');
        }
        $roomInfo['goods_list'] = [];
        if (empty($roomInfo['goods_ids']) == false){

            $where[] = ['shop_goods_id','in',$roomInfo['goods_ids']];
            $roomInfo['goods_list'] = $LiveGoodsModel->where($where)->select()->toArray();
            $this->assign('priceType',$LiveGoodsModel->priceType);
        }
        $this->assign('roomInfo',$roomInfo);
        return $this->fetch('edit_goods');
    }
    /*------------------------------------------------------ */
    //-- 显示详情
    /*------------------------------------------------------ */
    public function showInfo()
    {
        $id = input('id', 0, 'intval');
        $roomInfo = $this->Model->find($id);
        if (empty($roomInfo)){
            return $this->error('没有找到相关房间数据.');
        }
        $this->assign('roomInfo',$roomInfo);
        $OrderGoodsModel = new OrderGoodsModel();
        $status = $OrderGoodsModel->where('roomid',$roomInfo['roomid'])->field('SUM(goods_number) as total_goods_number,goods_id,goods_name')->group('goods_id')->select();
        $this->assign('status',$status);
        return $this->fetch('show_info');
    }
    /*------------------------------------------------------ */
    //-- 设置回播
    /*------------------------------------------------------ */
    public function setReplay(){
        $id = input('id', 0, 'intval');
        $toggle = input('toggle', '', 'trim');
        $roomData['is_replay'] = 0;
        if ($toggle == 'true'){
            $roomData['is_replay'] = 1;
        }
        $this->Model->where('id',$id)->update($roomData);
        return $this->success('修改成功.'.$toggle);
    }
    /*------------------------------------------------------ */
    //-- 设置是否显示
    /*------------------------------------------------------ */
    public function setIsShow(){
        $id = input('id', 0, 'intval');
        $toggle = input('toggle', '', 'trim');
        $roomData['is_show'] = 0;
        if ($toggle == 'true'){
            $roomData['is_show'] = 1;
        }
        $this->Model->where('id',$id)->update($roomData);
        return $this->success('修改成功.'.$toggle);
    }
}
