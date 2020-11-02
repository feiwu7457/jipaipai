<?php

namespace app\weixin\model;

use think\Db;
use app\member\model\UsersModel;

//*------------------------------------------------------ */
//-- 微信会员
/*------------------------------------------------------ */

class MiniUsersModel extends WeiXinUsersModel
{


    /*------------------------------------------------------ */
    //-- 微信小程序用户查询，不存在则写入数据
    /*------------------------------------------------------ */
    public function login($data)
    {
        if (empty($data)) return '参数不能为空';
        $mini = new MiniModel();
        $minidata = $mini->GetOpenidFromMp($data['code']);

        if (!$minidata['openid']) {
            return 'openid获取失败，请联系管理员';
        }
        $UsersModel = new UsersModel();
        $where['wx_openid'] = $minidata['openid'];
        $where['is_xcx'] = 1;
        $wx_info = $this->where($where)->find();
        if (empty($wx_info) == false) {
            if ($wx_info['user_id'] > 0) {
                return $UsersModel->doLogin($wx_info['user_id'], $data['source']);
            } else {
                if ($wx_info['user_id'] < 1 && settings('register_status') == 2) {//微信自动注册会员
                    $wxuid = $wx_info['wxuid'];
                    $userInArr['nick_name'] = $data['nickName'];
                    $UsersModel->register($userInArr, $wxuid);//注册会员
                    $wx_info = $this->where($where)->find();
                    return $UsersModel->doLogin($wx_info['user_id'], $data['source']);

                }
            }
            if ($data['source']) {
                if ($data['source'] == 'developers') {//小程序
                    $devtoken = session_id() . date('dhi');
                    return [$data['source'], $devtoken];
                } else {
                    return $wx_info->toArray();
                }
            }
        }
        $data['openid'] = $minidata['openid'];
        $wx_info = $this->register($data);
        return $UsersModel->doLogin($wx_info['user_id'], $data['source']);
    }

    /*------------------------------------------------------ */
    //-- 写入微信会员表
    /*------------------------------------------------------ */
    public function register($data)
    {
        //过滤微信名里面的表情特殊符号
        $data['nickName'] = filterEmoji($data['nickName']);
        $sex_arr = ['未知', '男', '女'];

        //没有数据，执行注册会员
        if (empty($data['pid']) == false) {
            $inarr['pid'] = $data['pid'];
        }
        $user_id = 0;
        //查询是否有关联的公众号/小程序已经注册会员
        if (empty($data['unionid']) == false) {
            $unWhere['unionid'] = $data['unionid'];
            $user_id = $this->where($unWhere)->value('user_id');
        }
        $inarr['user_id'] = $user_id;
        $inarr['is_xcx'] = 1;
        $inarr['wx_openid'] = $data['openid'];
        $inarr['add_time'] = $inarr['update_time'] = time();
        $inarr['sex'] = $sex_arr[$data['gender']];
        $inarr['subscribe'] = 0;
        $inarr['wx_nickname'] = $data['nickName'];
        $inarr['wx_headimgurl'] = $data['avatarUrl'];
        $inarr['wx_city'] = $data['city'];
        $inarr['wx_province'] = $data['province'];
        if ($inarr['user_id'] < 1 && settings('register_status') == 2) {//微信自动注册会员
            Db::startTrans();
            $res = $this->insertGetId($inarr);
            if ($res < 1) return '数据入库失败';
            $wxuid = $res;
            $userInArr['sex'] = $data['gender'];
            $userInArr['nick_name'] = $data['nickName'];
            $userInArr['headimgurl'] = $data['avatarUrl'];
            $UsersModel = new UsersModel();
            $res = $UsersModel->register($userInArr, $wxuid);//注册会员
            if ($res != true) return $res;
        } else {
            $res = $this->insert($inarr);
            if ($res < 1) return '数据入库失败';
            $wxuid = $res->wxuid;
        }
        //缓存微信账户数据
        return $this->info($wxuid, 'wx');
    }

}
