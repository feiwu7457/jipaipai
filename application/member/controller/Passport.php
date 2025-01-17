<?php
/*------------------------------------------------------ */
//-- 会员登陆注册
//-- Author: iqgmy
/*------------------------------------------------------ */
namespace app\member\controller;
use app\ClientbaseController;
use think\captcha\Captcha;

class Passport  extends ClientbaseController{
	/*------------------------------------------------------ */
    //-- 优先执行
    /*------------------------------------------------------ */
    public function initialize(){
        parent::initialize();
		$this->assign('sms_fun', settings('sms_fun'));//获取短信配置
        if (empty($this->userInfo) == false){
            return $this->redirect('member/center/index');//已登陆，跳回会员中心
        }
    }
    //验证码
    public function verify()
    {
        $captcha = new Captcha();
        return $captcha->entry();
    }
	/*------------------------------------------------------ */
	//-- 登陆
	/*------------------------------------------------------ */
	public function login(){
        $this->assign('sign_logo',settings('logo'));
        $this->assign('title', '会员登录');
		$this->assign('register_status',settings('register_status'));		
		return $this->fetch('login');
	}
    /*------------------------------------------------------ */
    //-- 微信登陆
    /*------------------------------------------------------ */
    public function wxLogin(){
        if ($this->is_wx != 1) {//微信网页访问执行
            return $this->error('请使用微信访问.');
        }
        $WeiXinModel = new \app\weixin\model\WeiXinModel();
        $access_token = $WeiXinModel->getWxOpenId();// 获取微信用户WxOpenId
        $wxInfo = $this->wxAutologin($access_token,true);
        if ($wxInfo['user_id'] < 1){
            return $this->error('微信未绑定会员，请登陆已注册的帐号进行绑定，再使用此功能.');
        }
        if (empty($this->userInfo) == true){
            return $this->error('登陆失败，请联系客服审核帐号是否被封禁.');
        }
        return $this->success('登陆成功.',session('REQUEST_URI'));
    }
	/*------------------------------------------------------ */
    //-- 注册
    /*------------------------------------------------------ */
    public function register(){  
        $this->assign('sign_logo',settings('logo'));     
		$register_status = settings('register_status');
		if ($register_status != 1){
			return $this->error('暂不开放注册.');
		}
		$this->assign('title', '会员注册');
        $this->assign('register_invite_code', settings('register_invite_code'));
        $this->assign('lang_register_invite_code', config('config.register_invite_code'));
        $register_must_invite = settings('register_must_invite');
        $this->assign('register_must_invite', $register_must_invite);
        $share_token = '';
        if ($register_must_invite == 1){
            $wxInfo = session('wxInfo');
            if (empty($wxInfo) == false) {//微信访问根据微信分享来源记录，执行
                $bind_share_rule = settings('bind_share_rule');
                if ($bind_share_rule == 0) {//按最先分享绑定
                    $sort = 'id ASC';
                } else {//按最后分享绑定
                    $sort = 'id DESC';
                }
                $share_token = (new \app\weixin\model\WeiXinInviteLogModel)->where('wxuid', $wxInfo['wxuid'])->order($sort)->value('share_token');
            }else{
                $share_token = session('share_token');
            }
        }
        $this->assign('share_token', $share_token);
        return $this->fetch('register');
    }
    /*------------------------------------------------------ */
    //-- 找回密码
    /*------------------------------------------------------ */
    public function forgetpwd(){
        $this->assign('title', '忘记密码');
        return $this->fetch('forgetpwd');
    }


}?>