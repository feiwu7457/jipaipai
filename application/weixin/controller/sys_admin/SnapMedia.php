<?php
namespace app\weixin\controller\sys_admin;

use app\AdminController;
use app\weixin\model\SnapMediaModel;
use app\weixin\model\WeiXinModel;
use app\weixin\model\MiniModel;
/**
 * 微信临时素材
 * Class Index
 */
class SnapMedia extends AdminController
{
    public $is_xcx = 0;
	/*------------------------------------------------------ */
	//-- 优先执行
	/*------------------------------------------------------ */
	public function initialize(){
        parent::initialize();
        $this->Model = new SnapMediaModel();
    }

    /*------------------------------------------------------ */
    //--首页
    /*------------------------------------------------------ */
    public function index()
    {
        $this->getList(true);
        return $this->fetch('sys_admin/snap_media/index');
    }
    /*------------------------------------------------------ */
    //-- 获取列表
    //-- $runData boolean 是否返回模板
    /*------------------------------------------------------ */
    public function getList($runData = false) {
        $where[] = ['is_xcx','=',$this->is_xcx];
        $data = $this->getPageList($this->Model,$where);
        $this->assign("data", $data);
        if ($runData == false){
            $data['content']= $this->fetch('sys_admin/snap_media/list')->getContent();
            unset($data['list']);
            return $this->success('','',$data);
        }
        return true;
    }
    /*------------------------------------------------------ */
    //--添加素材
    /*------------------------------------------------------ */
    public function add()
    {
        if ($this->request->isPost()){
            $file = $_FILES['file']['name'];
            $extend = strtolower(end(explode('.',$file)));
            if (in_array($extend,['jpg','jpeg','png','gif'])){
                $type = 'image';
                if ($_FILES['file']['size'] / 1024 > 2 * 1024){
                    return $this->error('上传图片不能大于2M.');
                }
            }elseif (in_array($extend,['amr','mp3'])){
                $type = 'voice';
                if ($_FILES['file']['size'] / 1024 > 2 * 1024){
                    return $this->error('上传语音不能大于2M.');
                }
            }elseif (in_array($extend,['mp4'])){
                $type = 'video';
                if ($_FILES['file']['size'] / 1024 > 10 * 1024){
                    return $this->error('上传语音不能大于10M.');
                }
            }else{
                 return $this->error('上传文件类型错误.');
            }
            $file = config('config._upload_').'public_snap/'.(time().rand(10,99)).'.'.$extend;
            $res = move_uploaded_file($_FILES['file']['tmp_name'], $file) ;

            if($res == false) {
                return $this->error('上传文件失败.');
            }
            if ($this->is_xcx == 1){
                $res = (new MiniModel)->uploadSnapFile(trim($file,'.'),$type);
            }else{
                $res = (new WeiXinModel)->uploadSnapFile(trim($file,'.'),$type);
            }
            if (empty($res['errcode']) == false){
                return $this->error('微信端返回错误：'.$res['errcode'].'-'.$res['errmsg']);
            }
            $inArr['is_xcx'] = $this->is_xcx;
            $inArr['type'] = $res['type'];
            $inArr['media_id'] = $res['media_id'];
            $inArr['add_time'] = $res['created_at'];
            $inArr['expire_time'] = $res['created_at'] + 259200;
            $inArr['remark'] = input('remark','','trim');
            $inArr['file'] = trim($file,'.');
            $inArr['original_file_name'] = $_FILES['file']['name'];
            $res = $this->Model->save($inArr);
            if ($res == false){
                return $this->error('写入数据失败.');
            }
            return $this->success('添加成功.','',['file'=>$inArr['file'],'media_id'=>$inArr['media_id']]);
        }
        $this->assign('back_dom',input('back_dom'));
        return $this->fetch('sys_admin/snap_media/add');
    }
    /*------------------------------------------------------ */
    //--选择素材
    /*------------------------------------------------------ */
    public function select()
    {
        $type = input('type','','trim');
        $back_dom = input('back_dom','','trim');
        $where = [];
        if (empty($type) == false){
            $where[] = ['type','=',$type];
        }
        $where[] = ['is_xcx','=',$this->is_xcx];
        $where[] = ['expire_time','>',time()];
        $list = $this->Model->where($where)->order('id DESC')->select()->toArray();
        $this->assign('list',$list);
        $this->assign('back_dom',$back_dom);
        return $this->fetch('sys_admin/snap_media//select');
    }

}
