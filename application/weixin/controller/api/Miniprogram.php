<?php
/*------------------------------------------------------ */
//-- 微信小程序
//-- Author: wemk
/*------------------------------------------------------ */
namespace app\weixin\controller\api;
use app\ApiController;
use think\facade\Cache;
use app\weixin\model\MiniUsersModel;
use app\weixin\model\MiniModel;

class Miniprogram  extends ApiController{

	public function initialize(){
        parent::initialize();
    }
    /*------------------------------------------------------ */
    //--  获取getConfig,并返回openid、请求密钥、默认打开页面
    /*------------------------------------------------------ */
    public function getConfig()
    {
        $code = input('code', '', 'trim');
        $data = [];
        if (empty($code) == false){
            $res = file_get_contents('https://api.weixin.qq.com/sns/jscode2session?appid=' . settings('xcx_appid') . '&secret=' . settings('xcx_appsecret') . '&js_code=' . $code . '&grant_type=authorization_co');
            $data = json_decode($res, true);
            if (empty($data['openid']) == false){
                $data['apiKey'] = md5($data['openid'].'|'.$data['session_key']);
                Cache::set('xcx_apikey_'.$data['openid'],$data['apiKey'],86400);//保留一天时间
            }
        }
        $data['defWebUrl'] = 'shop/index/index';
        $data['siteName'] = settings('shop_title');
        $data['siteLogo'] = settings('logo');
        return $this->ajaxReturn($data);
    }
    /*------------------------------------------------------ */
    //--  获取微信小程序openId
    /*------------------------------------------------------ */
    public function getOpenId(){
        $code = input('code','','trim');
        $res = file_get_contents('https://api.weixin.qq.com/sns/jscode2session?appid='.settings('xcx_appid').'&secret='.settings('xcx_appsecret').'&js_code='.$code.'&grant_type=authorization_co');
        $data = json_decode($res,true);

        $data['defWebUrl'] = 'activity/index/index';
        $data['siteName'] = settings('site_name');
        return $this->ajaxReturn($data);
    }
    /*------------------------------------------------------ */
	//-- 小程序登录
	/*------------------------------------------------------ */
	public function do_login(){
        $post = input('post.');
        if(!$post['code']){
            $this->error('参数错误!');
        }
        if($post['share_token']){
            session('share_token',$post['share_token']);
        }
        $MiniUsersModel = new MiniUsersModel();
        $post['source'] = 'developers';
        $res = $MiniUsersModel->login($post);
        if (is_array($res) == false) return $this->error($res);
        $data['code'] = 1;
        $data['msg'] = '登录成功.';
        if ($res[0] == 'developers'){
            $data['developers'] = $res[1];
        }
        return $this->ajaxReturn($data);
    }

    /*------------------------------------------------------ */
    //-- 小程序访问直播页时调用，用于身份识别、创建帐号、绑定上级
    /*------------------------------------------------------ */
    public function liveLogin(){
        $openid = input('openid','','trim');
        $share_openid = input('share_openid','','trim');
        $MiniUsersModel= new MiniUsersModel();
        $where[] = ['wx_openid','=',$openid];
        $where[] = ['is_xcx','=',1];
        $wxInfo = $MiniUsersModel->where($where)->find();
        if (empty($wxInfo)){
            $wxArr = (new MiniModel)->getWxUserInfoSubscribe($openid);
            $wxArr['openid'] = $openid;
            if (empty($share_openid) == false){
                $spwhere[] = ['wx_openid','=',$share_openid];
                $spwhere[] = ['is_xcx','=',1];
                $wxArr['pid'] = $MiniUsersModel->where($spwhere)->value('user_id');
            }
            $MiniUsersModel->register($wxArr);
        }
        $data['code'] = 1;
        return $this->ajaxReturn($data);
    }


}?>