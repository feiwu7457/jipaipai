<?php
namespace app\weixin\controller\api;
use app\ApiController;
use app\weixin\model\LiveRoomModel;

/*------------------------------------------------------ */
//-- 直播相关
/*------------------------------------------------------ */
class LiveRoom extends ApiController
{
	
 	 /*------------------------------------------------------ */
    //-- 获取列表
    /*------------------------------------------------------ */
    public function getList(){
    	$page = input('page',0,'intval');
    	$return['code'] = 1;
        $return['data'] = (new LiveRoomModel)->getList($page);
        return $this->ajaxReturn($return);
	}
    /*------------------------------------------------------ */
    //-- 回播获取房间相关信息
    /*------------------------------------------------------ */
    public function getRoomReplay(){
        $roomid = input('roomid',0,'intval');
        if ($roomid < 1){
            return $this->error('房间ID传参失败.');
        }
        $roomInfo = (new LiveRoomModel)->info($roomid);
        if (empty($roomInfo)){
            return $this->error('没有找到相关房间信息.');
        }
        if ($roomInfo['is_replay'] == 0){
            return $this->error('此房间暂未开放回放.');
        }
        $return['code'] = 1;
        $return['data'] = $roomInfo;
        return $this->ajaxReturn($return);
    }

}
