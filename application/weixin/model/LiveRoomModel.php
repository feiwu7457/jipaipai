<?php
/*------------------------------------------------------ */
//-- 微信直播间
//-- @author iqgmy
/*------------------------------------------------------ */

namespace app\weixin\model;

use app\BaseModel;
use think\facade\Cache;
use app\weixin\model\MiniModel;

class LiveRoomModel extends BaseModel
{
    protected $table = 'weixin_live_room';
    public $pk = 'id';
    public $live_status = ['101' => '直播中', '102' => '未开始', '103' => '已结束', '104' => '禁播', '105' => '暂停中', '106' => '异常', '107' => '已过期'];

    /**
     *获取列表
     */
    public function getList($page,$limit = 10)
    {
        $this->getRoomListToDb();
        $mkey = 'xcx_liveroom_list_'.$page;
        $list = Cache::get($mkey);
        if (empty($list) == false) return $list;
        if ($page > 0){
            $page = $page - 1;
        }else{
            $page = 0;
        }
        $start = $page * $limit;
        $rows = $this->where('is_show',1)->order('start_time DESC')->limit($start,$limit)->select()->toArray();
        if (empty($rows)) return [];
        foreach ($rows as $key=>$row){
            $row['end_time_data'] = date('Y-m-d H:i',$row['end_time']);
            $row['start_time_data'] = date('Y-m-d H:i',$row['start_time']);
            $row['goods'] = json_decode($row['goods'],true);
            $row['live_status_txt'] = $this->live_status[$row['live_status']];
            $row['replay_status'] = 0;
            if ($row['live_status'] == 103 && $row['is_replay'] == 1){
                if (empty($row['live_replay']) == false){
                    $row['replay_status'] = 1;
                }
            }
            unset($row['anchor_user_id'],$row['live_replay']);
            $rows[$key] = $row;
        }
        Cache::set($mkey,$rows,30);
        return $rows;
    }

    /**
     *获取直播间写入数据库
     */
    public function getRoomListToDb()
    {
        $cache = Cache::init();
        $_redis = $cache->handler();
        $mkey = 'xcx_get_liveroom_time';
        $hour = date('H') * 1;
        if ($hour > 2 && $hour < 8) {
            $limitTime = 432;//获取间隔（秒）晚上分配50次，
        }else{
            $limitTime = 144;//获取间隔（秒）
        }
        $lock_time = $_redis->setnx($mkey, time() + $limitTime);
        if ($lock_time == false) {
            $lock_time = $_redis->get($mkey);
            if (time() > $lock_time) {
                $_redis->del($mkey);
                $lock_time = $_redis->setnx($mkey, time() + $limitTime);
                if ($lock_time == false) return false;
            } else {
                return false;
            }
        }
        $result = (new MiniModel)->getLiveRoomList();
        if (empty($result['room_info']) == true) {
            return false;
        }
        foreach ($result['room_info'] as $key => $val) {
            $roomInfo = $this->where('roomid',$val['roomid'])->find();
            $roomData = [];
            $roomData['roomid'] = $val['roomid'];
            $roomData['name'] = $val['name'];
            $roomData['cover_img'] = $val['cover_img'];
            $roomData['live_status'] = $val['live_status'];
            $roomData['start_time'] = $val['start_time'];
            $roomData['end_time'] = $val['end_time'];
            $roomData['anchor_name'] = $val['anchor_name'];
            $roomData['anchor_img'] = $val['anchor_img']?$val['anchor_img']:$val['share_img'];
            $roomData['goods'] = json_encode($val['goods'],JSON_UNESCAPED_UNICODE);
            $roomData['goods_num'] = count($val['goods']);
            $roomData['goods_ids'] = [];
            foreach ($val['goods'] as $goods){
                preg_match('/goods_id=(.*?)/U', $goods['url'], $match);
                if (empty($match[1]) == false){
                    $roomData['goods_ids'][] = $match[1];
                }
            }
            $roomData['goods_ids'] = join(',',$roomData['goods_ids']);
            if (empty($roomInfo) == false){
                if ($roomInfo['live_status'] == 103 && $roomInfo['end_time'] < time() - 600 && empty($roomInfo['live_replay'])){
                    $replay = $this->getReplayToDb($val['roomid']);
                    if (empty($replay['live_replay']) == false){
                        $roomData['live_replay'] = json_encode($replay['live_replay'],JSON_UNESCAPED_UNICODE);
                    }
                }
                $this->where('roomid',$val['roomid'])->update($roomData);
            }else{
                if ($roomData['live_status'] == 103 && $roomData['end_time'] < time() - 600 && empty($roomData['live_replay'])){
                    $replay = $this->getReplayToDb($val['roomid']);
                    if (empty($replay['live_replay']) == false){
                        $roomData['live_replay'] = json_encode($replay['live_replay'],JSON_UNESCAPED_UNICODE);
                    }
                }
                $this->create($roomData);
            }
        }
    }
    /**
     *获取直播间回播写入数据库
     */
    public function getReplayToDb($roomid)
    {
        $cache = Cache::init();
        $_redis = $cache->handler();
        $mkey = 'xcx_get_livereplay_time_'.$roomid;
        $limitTime = 60;
        $lock_time = $_redis->setnx($mkey, time() + $limitTime);
        if ($lock_time == false) {
            $lock_time = $_redis->get($mkey);
            if (time() > $lock_time) {
                $_redis->del($mkey);
                $lock_time = $_redis->setnx($mkey, time() + $limitTime);
                if ($lock_time == false) return false;
            } else {
                return false;
            }
        }
        return (new MiniModel)->getLiveReplay($roomid);
    }
    /**
     *获取房间数据
     */
    public function info($roomid)
    {
        $mkey = 'xcx_liveroom_info_'.$roomid;
        $roomInfo = Cache::get($mkey);
        if (empty($roomInfo) == false) return $roomInfo;
        $roomInfo = (new LiveRoomModel)->where('roomid',$roomid)->find();
        if (empty($roomInfo)){
            return false;
        }
        $roomInfo = $roomInfo->toArray();
        $roomInfo['goods'] = str_replace('.html','',$roomInfo['goods']);
        $roomInfo['goods'] = json_decode($roomInfo['goods'],true);
        $roomInfo['live_replay'] = json_decode($roomInfo['live_replay'],true);
        Cache::set($mkey,$roomInfo,30);
        return $roomInfo;
    }
}

?>