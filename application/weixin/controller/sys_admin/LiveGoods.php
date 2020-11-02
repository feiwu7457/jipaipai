<?php
namespace app\weixin\controller\sys_admin;

use think\Db;

use app\AdminController;
use app\weixin\model\LiveGoodsModel;
use app\weixin\model\MiniModel;
/**
 * 直播商品
 * Class Index
 * @package app\store\controller
 */
class LiveGoods extends AdminController
{
	/*------------------------------------------------------ */
	//-- 优先执行
	/*------------------------------------------------------ */
	public function initialize(){
        parent::initialize();
        $this->Model = new LiveGoodsModel();
    }

    /*------------------------------------------------------ */
    //--首页
    /*------------------------------------------------------ */
    public function index()
    {
        $this->Model->getGoodsListToDb();
        $this->getList(true);
        return $this->fetch('index');
    }
    /*------------------------------------------------------ */
    //-- 获取列表
    //-- $runData boolean 是否返回模板
    /*------------------------------------------------------ */
    public function getList($runData = false) {
        $keyword = input('keyword','','trim');
        if (empty($keyword) == false){
            $where[] = ['name','like','%'.$keyword.'%'];
        }
        $data = $this->getPageList($this->Model,$where);
        $this->assign("data", $data);
        $this->assign('auditStatus',$this->Model->auditStatus);
        if ($runData == false){
            $data['content']= $this->fetch('list')->getContent();
            unset($data['list']);
            return $this->success('','',$data);
        }
        return true;
    }
    /*------------------------------------------------------ */
    //--上传商品
    /*------------------------------------------------------ */
    public function add()
    {
        if ($this->request->isPost()) {
            $shop_goods_id = input('shop_goods_id',0,'intval');
            if ($shop_goods_id < 1){
                return $this->error('请选择商品.');
            }
            $count = $this->Model->where('shop_goods_id',$shop_goods_id)->count();
            if ($count > 0){
                return $this->error('当前商品已上传过，请不要重复提交.');
            }
            $shop_goods_img = input('shop_goods_img','','trim');
            if (empty($shop_goods_img)){
                return $this->error('请选择商品图片.');
            }
            $postData['name'] = input('name','','trim');
            if (empty($postData['name'])){
                return $this->error('请输入商品名称.');
            }
            $postData['priceType'] = input('priceType',1,'intval');
            $postData['price'] = input('price',0,'intval');
            $postData['price2'] = input('price2',0,'intval');
            if (empty($postData['price'])){
                return $this->error('price字段必须填写.');
            }
            if ($postData['priceType'] > 1 && empty($postData['price2'])){
                return $this->error('请填写price2字段.');
            }
            $MiniModel = new MiniModel();
            //上传图片临时素材
            $res = $MiniModel->uploadSnapFile($shop_goods_img,'image');
            if (empty($res['errcode']) == false){
                return $this->error('上传图片出错，微信端返回错误：'.$res['errcode'].'-'.$res['errmsg']);
            }
            $postData['coverImgUrl'] = $res['media_id'];
            $postData['url'] = config('config.xcx_goods_path').$shop_goods_id;
            $res = $MiniModel->addLiveGoods($postData);
            if (empty($res['errcode']) == false){
                return $this->error('上传商品出错，微信端返回错误：'.$res['errcode'].'-'.$res['errmsg']);
            }
            $inArr = $postData;
            $inArr['shop_goods_id'] = $shop_goods_id;
            $inArr['shop_goods_img'] = $shop_goods_img;
            $inArr['goodsId'] = $res['goodsId'];
            $inArr['auditId'] = $res['auditId'];
            $inArr['thirdPartyTag'] = 1;
            $inArr['audit_status'] = 1;
            $inArr['add_time'] = time();
            $res = $this->Model->save($inArr);
            if ($res == false){
                return $this->error('写入数据库失败.');
            }
            $this->_log($res->id,'上传小程序直播商品');
            return $this->success('上传成功.');
        }
        return $this->fetch('add');
    }
    /*------------------------------------------------------ */
    //--商品详情
    /*------------------------------------------------------ */
    public function info()
    {
        $id = input('id',0,'intval');
        if ($id < 1){
            return $this->error('ID传参错误.');
        }
        $row = $this->Model->find($id);
        if (empty($row)) {
            return $this->error('没有找到相关数据.');
        }
        $row = $row->toArray();
        $this->assign('row',$row);
        $this->assign('auditStatus',$this->Model->auditStatus[$row['audit_status']]);
        return $this->fetch('info');
    }
    /*------------------------------------------------------ */
    //--商品操作
    /*------------------------------------------------------ */
    public function operate()
    {
        $id = input('id',0,'intval');
        $operate = input('operate','','trim');
        if ($id < 1){
            return $this->error('ID传参出错.');
        }
        if (empty($operate)){
            return $this->error('请选择需要的操作.');
        }
        $row = $this->Model->where('id',$id)->find();
        if (empty($row)){
            return $this->error('没有找到相关数据.');
        }
        $post = input('post.');
        $_opt = '';
        $log = '';
        $upData = $postData =[];
        $MiniModel = new MiniModel();
        if ($operate == 'update'){
            if ($row['audit_status'] != 0){
                return $this->error('商品未审核状态才允许操作.');
            }
            $postData['goodsId'] = $row['goodsId'];
            $postData['priceType'] = $post['priceType'] * 1;
            $postData['price'] = $post['price'] * 1;
            $postData['price2'] = $post['price2'] * 1;
            $postData['name'] = trim($post['name']);
            $postData['url'] = config('config.xcx_goods_path').$row['shop_goods_id'];
            if (empty($postData['name'])){
                return $this->error('商品名称不能为空.');
            }
            if (empty($post['shop_goods_img']) == false && $post['shop_goods_img'] != $row['shop_goods_img']){
                //上传图片临时素材
                $res = $MiniModel->uploadSnapFile($post['shop_goods_img'],'image');
                if (empty($res['errcode']) == false){
                    return $this->error('上传图片出错，微信端返回错误：'.$res['errcode'].'-'.$res['errmsg']);
                }
                $postData['coverImgUrl'] = $res['media_id'];
            }
            $_opt = 'updateLiveGoods';
            $upData = $postData;
            if (empty($post['shop_goods_img']) == false){
                $upData['shop_goods_img'] = $post['shop_goods_img'];
            }
            $log = '更新商品';
        }elseif ($operate == 'update_price'){
            if ($row['audit_status'] == 1){
                return $this->error('商品正在审核中，不能修改.');
            }
            $postData['goodsId'] = $row['goodsId'];
            $postData['priceType'] = $post['priceType'] * 1;
            $postData['price'] = $post['price'] * 1;
            $postData['price2'] = $post['price2'] * 1;
            $_opt = 'updateLiveGoods';
            $upData = $postData;
            $log = '更新价格';
        }elseif ($operate == 'post_check'){
            if ($row['audit_status'] == 0){
                return $this->error('商品未审核状态才允许操作.');
            }
            $postData['goodsId'] = $row['goodsId'];
            $_opt = 'postCheckLiveGoods';
            $upData['audit_status'] = 1;
            $log = '提交审核';
        }elseif ($operate == 'recall_check'){
            if ($row['audit_status'] == 1){
                return $this->error('商品审核中状态才允许操作.');
            }
            $postData['auditId'] = $row['auditId'];
            $postData['goodsId'] = $row['goodsId'];
            $_opt = 'recallCheckLiveGoods';
            $upData['audit_status'] = 0;
            $log = '撤回商品审核';
        }
        if (empty($upData)){
            return $this->error('请求错误，未定义更新数据.');
        }
        Db::startTrans();//启动事务
        $res = $this->Model->where('id',$id)->update($upData);
        if ($res < 1){
            return $this->error('数据无变化，更新失败.');
        }
        $res = $MiniModel->$_opt($postData);
        if (empty($res['errcode']) == false){
            Db::rollback();// 回滚事务
            return $this->error('微信端返回错误：'.$res['errcode'].'-'.$res['errmsg']);
        }
        Db::commit();// 提交事务
        if ($operate == 'post_check'){
            $this->Model->where('id',$id)->update(['auditId'=>$res['auditId']]);
        }
        $this->_log($id,'直播商品：'.$log);
        return $this->success('操作成功.');
    }
    /*------------------------------------------------------ */
    //--商品删除操作
    /*------------------------------------------------------ */
    public function delete()
    {
        $id = input('id',0,'intval');
        if ($id < 1){
            return $this->error('ID传参出错.');
        }
        $row = $this->Model->where('id',$id)->find();
        if (empty($row)){
            return $this->error('没有找到相关数据.');
        }
        $res = $this->Model->where('id',$id)->delete();
        if ($res < 1){
            return $this->error('删除失败.');
        }
        $postData['goodsId'] = $row['goodsId'];
        $res = (new MiniModel)->deleteLiveGoods($postData);
        if (empty($res['errcode']) == false){
            Db::rollback();// 回滚事务
            return $this->error('微信端返回错误：'.$res['errcode'].'-'.$res['errmsg']);
        }
        $this->_log($id,'删除直播商品');
        return $this->success('删除成功.',url('index'));
    }
    /*------------------------------------------------------ */
    //--选择商品
    /*------------------------------------------------------ */
    public function select()
    {
        $list = $this->Model->where('audit_status',2)->select()->toArray();
        $this->assign('list',$list);
        $this->assign('priceType',$this->Model->priceType);
        return $this->fetch('select');
    }
}
