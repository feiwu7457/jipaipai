<?php
/*------------------------------------------------------ */
//-- 我的团队
//-- Author: iqgmy
/*------------------------------------------------------ */
namespace app\member\controller;
use app\ClientbaseController;


class MyTeam  extends ClientbaseController{	
	/*------------------------------------------------------ */
	//-- 首页
	/*------------------------------------------------------ */
	public function index(){
        $this->assign('title', '会员中心');
		return $this->fetch('index');
	}
	
   /*------------------------------------------------------ */
	//-- 成员详细页
	/*------------------------------------------------------ */
	public function info(){
        $this->assign('title', '成员详细');
		return $this->fetch('info');
	}
    /*------------------------------------------------------ */
    //-- 会员社群页
    /*------------------------------------------------------ */
    public function community(){
        $this->assign('title', '我的社群');
        return $this->fetch('community');
    }
    /*------------------------------------------------------ */
    //-- 成长之路
    /*------------------------------------------------------ */
    public function upgrade(){
        $this->assign('title', '拍拍之路');
        return $this->fetch('upgrade');
    }
}?>