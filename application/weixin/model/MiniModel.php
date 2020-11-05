<?php
/*------------------------------------------------------ */
//-- 微信API核心调用
//-- @author iqgmy
/*------------------------------------------------------ */
namespace app\weixin\model;
use app\BaseModel;
use think\facade\Cache;
class MiniModel extends BaseModel {
	public $fromUsername,$toUsername,$keyword,$SetConfig;
    public $roomErrorCode = ["-1" => "系统错误", "1" => "未创建直播间", "1003" => "商品id不存在", "47001" => "入参格式不符合规范", "200002" => "入参错误", "300001" => "禁止创建/更新商品 或 禁止编辑&更新房间", "300002" => "名称长度不符合规则", "300006" => "图片上传失败（如：mediaID过期）","300022"=>"此房间号不存在","300023"=>"房间状态 拦截（当前房间状态不允许此操作）","300024"=>"商品不存在","300025"=>"商品审核未通过","300026"=>"房间商品数量已经满额","300027"=>"导入商品失败","300028"=>"房间名称违规","300029"=>"主播昵称违规","300030"=>"主播微信号不合法","300031"=>"直播间封面图不合规","300032"=>"直播间分享图违规","300033"=>"添加商品超过直播间上限","300034"=>"主播微信昵称长度不符合要求","300035"=>"主播微信号不存在","300036"=>"主播微信号未实名认证"];
    public $goodsErrorCode = ["-1"=>"系统错误","1003"=>"商品id不存在","47001"=>"入参格式不符合规范","200002"=>"入参错误","300001"=>"禁止创建/更新商品（如：商品创建功能被封禁）","300002"=>"名称长度不符合规则","300003"=>"价格输入不合规（如：现价比原价大、传入价格非数字等）","300004"=>"商品名称存在违规违法内容","300005"=>"商品图片存在违规违法内容","300006"=>"图片上传失败（如：mediaID过期）","300007"=>"线上小程序版本不存在该链接","300008"=>"添加商品失败","300009"=>"商品审核撤回失败","300010"=>"商品审核状态不对（如：商品审核中）","300011"=>"操作非法（API不允许操作非API创建的商品）","300012"=>"没有提审额度（每天500次提审额度）","300013"=>"提审失败","300014"=>"审核中，无法删除（非零代表失败）","300017"=>"商品未提审","300021"=>"商品添加成功，审核失败"];
    /*------------------------------------------------------ */
    //-- 优先自动执行
    /*------------------------------------------------------ */
    public function initialize(){
        parent::initialize();
        $this->setting = settings();
    }
	/*------------------------------------------------------ */
	//-- 验证是否微信请求
	/*------------------------------------------------------ */
	public function valid($echoStr = ''){
        //valid signature , option
        if($this->checkSignature()){
        	echo $echoStr;
        	exit;
        }
    }
	/*------------------------------------------------------ */
	//-- 验证是否是微信请求
	/*------------------------------------------------------ */
	public function checkSignature(){       
        /*$fp = @fopen("1.txt","a+");
		@fwrite($fp,$this->SetConfig['token'].json_encode($_GET)); 
		fclose($fp);*/
		$tmpArr = array($this->SetConfig['weixin_token'], $_GET["timestamp"], $_GET["nonce"]);
		sort($tmpArr, SORT_STRING);
		$tmpStr = implode( $tmpArr );
		$tmpStr = sha1( $tmpStr );		
		return  $tmpStr == $_GET["signature"] ? true : false;		
	}

	/**
     *
     * 通过code从工作平台获取openid机器access_token
     * @param string $code 微信跳转回来带上的code
     *
     * @return openid
     */
    public function GetOpenidFromMp($code)
    {
        $url = $this->__CreateOauthUrlForOpenid($code);
        $ch = curl_init();//初始化curl
        curl_setopt($ch, CURLOPT_TIMEOUT, 300);//设置超时
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER,FALSE);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST,FALSE);
        curl_setopt($ch, CURLOPT_HEADER, FALSE);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        $res = curl_exec($ch);//运行curl，结果以jason形式返回
        $data = json_decode($res,true);
        curl_close($ch);
        return $data;
    }

    /**
     *
     * 构造获取open和access_toke的url地址
     * @param string $code，微信跳转带回的code
     *
     * @return 请求的url
     */
    public function __CreateOauthUrlForOpenid($code)
    {
        $urlObj["appid"] = $this->setting['xcx_appid'];
        $urlObj["secret"] = $this->setting['xcx_appsecret'];
        $urlObj["js_code"] = $code;
        $urlObj["grant_type"] = "authorization_code";
        $bizString = $this->ToUrlParams($urlObj);
        return "https://api.weixin.qq.com/sns/jscode2session?".$bizString;
    }


    /**
     *
     * 拼接签名字符串
     * @param array $urlObj
     *
     * @return 返回已经拼接好的字符串
     */
    public function ToUrlParams($urlObj)
    {
        $buff = "";
        foreach ($urlObj as $k => $v)
        {
            if($k != "sign"){
                $buff .= $k . "=" . $v . "&";
            }
        }

        $buff = trim($buff, "&");
        return $buff;
    }

    /*------------------------------------------------------ */
	//-- 小程序获取access_token
	/*------------------------------------------------------ */
	function getAccessToken($curlagain = false){
		$access_token = Cache::get('xcx_access_token');
		if (empty($access_token) || $curlagain == true){			
			$ch = curl_init();
			curl_setopt($ch, CURLOPT_URL, "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=".$this->setting['xcx_appid']."&secret=".$this->setting['xcx_appsecret']);
			curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
			curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
			curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; MSIE 5.01; Windows NT 5.0)');
			curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
			curl_setopt($ch, CURLOPT_AUTOREFERER, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $par['data']);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			$tmpInfo = curl_exec($ch);
			if (curl_errno($ch)) {
				return curl_error($ch);
			}
			curl_close($ch);

			$josn = json_decode($tmpInfo,true);
			$access_token = $josn['access_token'];	
			Cache::set('xcx_access_token',$access_token,3600);		
		}
		return $access_token;
	}
    /*------------------------------------------------------ */
    //-- 获取微信用户信息关注才能调用
    /*------------------------------------------------------ */
    function getWxUserInfoSubscribe($openid){
        $access_token = $this->getAccessToken();
        $userinfo = file_get_contents("https://api.weixin.qq.com/cgi-bin/user/info?access_token=".$access_token."&openid=".$openid."&lang=zh_CN");
        $userinfo = json_decode($userinfo,true);
        return $userinfo;
    }
	/*------------------------------------------------------ */
	//-- 小程序生成二维码
	//-- $page  	跳转的页面
	//-- $scene 	场景值
	/*------------------------------------------------------ */
	public function get_qrcode($page = '',$scene = '',$method='POST'){

		$ACCESS_TOKEN = $this->getAccessToken(true);
		$url ="https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=$ACCESS_TOKEN";
		$qrcode = array(
			'width'			=> 400,
			'page'			=> $page,
			'scene' 		=> $scene
		);

		$data = json_encode($qrcode);
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
		curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; MSIE 5.01; Windows NT 5.0)');
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
		curl_setopt($ch, CURLOPT_AUTOREFERER, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$result = curl_exec($ch);
		if (curl_errno($ch)) {
			return curl_error($ch);
		}
		curl_close($ch);
	    $base64_image ="data:image/jpeg;base64,".base64_encode($result);

	    return $base64_image;
	}
    /*------------------------------------------------------ */
    //-- 上传临时素材
    /*------------------------------------------------------ */
    function uploadSnapFile($file, $type)
    {
        $access_token = $this->getAccessToken();
        $url = 'https://api.weixin.qq.com/cgi-bin/media/upload?access_token=' . $access_token . '&type=' . $type;
        $media = $_SERVER['DOCUMENT_ROOT'].$file;
        $data = array(
            "media"=> new \CURLFile(realpath($media))
        );
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_SAFE_UPLOAD, true);
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($curl, CURLOPT_USERAGENT, "TEST");
        $result = curl_exec($curl);
        curl_close($curl);
        return json_decode($result, true);
    }
    /*------------------------------------------------------ */
    //-- 创建直播间
    /*------------------------------------------------------ */
    function createLiveRoom($data)
    {
        $jsonStr = json_encode($data,JSON_UNESCAPED_UNICODE);
        $access_token = $this->getAccessToken();
        $url = 'https://api.weixin.qq.com/wxaapi/broadcast/room/create?access_token=' . $access_token;
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json; charset=utf-8',
                'Content-Length: ' . strlen($jsonStr)
            )
        );
        curl_setopt($curl, CURLOPT_SAFE_UPLOAD, true);
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $jsonStr);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($curl, CURLOPT_USERAGENT, "TEST");
        $result = curl_exec($curl);
        curl_close($curl);
        $result = json_decode($result, true);
        if ($result['errcode'] > 0) {
            if (empty($this->roomErrorCode[$result['errcode']]) == false){
                $result['errmsg'] = $this->roomErrorCode[$result['errcode']];
            }
        }
        return $result;
    }
    /*------------------------------------------------------ */
    //-- 小程序直播间列表

    /*------------------------------------------------------ */
    public function getLiveRoomList()
    {
        $ACCESS_TOKEN = $this->getAccessToken(true);
        $url = "https://api.weixin.qq.com/wxa/business/getliveinfo?access_token=$ACCESS_TOKEN";
        $param = array(
            "start" => 0, // 起始拉取房间，start = 0 表示从第 1 个房间开始拉取
            "limit" => 200 // 每次拉取的个数上限，不要设置过大，建议 100 以内
        );

        $data = json_encode($param);
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; MSIE 5.01; Windows NT 5.0)');
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_AUTOREFERER, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $result = curl_exec($ch);
        if (curl_errno($ch)) {
            return curl_error($ch);
        }
        curl_close($ch);
        return $result = json_decode($result, true);


    }
    /*------------------------------------------------------ */
    //-- 小程序直播间回播信息
    //-- $roomid  	房间ID
    /*------------------------------------------------------ */
    public function getLiveReplay($roomid)
    {
        $ACCESS_TOKEN = $this->getAccessToken(true);
        $url = "http://api.weixin.qq.com/wxa/business/getliveinfo?access_token=$ACCESS_TOKEN";
        $param = array(
            "action"=>"get_replay", // 获取回放
            "room_id"=> $roomid, // 直播间   id
            "start"=> 0, // 起始拉取视频，start =   0   表示从第    1   个视频片段开始拉取
            "limit"=> 100 // 每次拉取的个数上限，不要设置过大，建议  100 以内
        );
        $data = json_encode($param);
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; MSIE 5.01; Windows NT 5.0)');
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_AUTOREFERER, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $result = curl_exec($ch);
        if (curl_errno($ch)) {
            return curl_error($ch);
        }
        curl_close($ch);
        return $result = json_decode($result, true);
    }
    /*------------------------------------------------------ */
    //-- 小程序商品库列表
    //-- $page  int	跳转的页面
    //-- $status int 查询状态
    /*------------------------------------------------------ */
    public function getGoodsRoomList($page = 1,$status=0)
    {
        $ACCESS_TOKEN = $this->getAccessToken(true);
        $param = array(
            "offset" => ($page - 1) * 100, // 分页条数起点
            "limit" => 100, // 分页大小，默认30，不超过100
            "status"=>$status
        );
        $url = "https://api.weixin.qq.com/wxaapi/broadcast/goods/getapproved?access_token=$ACCESS_TOKEN&".http_build_query( $param );
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; MSIE 5.01; Windows NT 5.0)');
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_AUTOREFERER, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $result = curl_exec($ch);
        if (curl_errno($ch)) {
            return curl_error($ch);
        }
        curl_close($ch);
        return $result = json_decode($result, true);

    }


    /*------------------------------------------------------ */
    //-- 直播商品管理接口
    /*------------------------------------------------------ */
    private function liveGoodsCurl($data,$url)
    {
        $jsonStr = json_encode($data,JSON_UNESCAPED_UNICODE);
        $access_token = $this->getAccessToken();
        $url .= $access_token;
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json; charset=utf-8',
                'Content-Length: ' . strlen($jsonStr)
            )
        );
        curl_setopt($curl, CURLOPT_SAFE_UPLOAD, true);
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $jsonStr);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($curl, CURLOPT_USERAGENT, "TEST");
        $result = curl_exec($curl);
        curl_close($curl);

        $result = json_decode($result, true);
        if ($result['errcode'] > 0) {
            if (empty($this->goodsErrorCode[$result['errcode']]) == false){
                $result['errmsg'] = $this->goodsErrorCode[$result['errcode']];
            }
        }
        return $result;
    }
    /*------------------------------------------------------ */
    //-- 上传直播商品到库
    /*------------------------------------------------------ */
    function addLiveGoods($data)
    {
        $postData['goodsInfo'] = $data;
        return $this->liveGoodsCurl($postData,'https://api.weixin.qq.com/wxaapi/broadcast/goods/add?access_token=');
    }
    /*------------------------------------------------------ */
    //-- 修改直播商品
    /*------------------------------------------------------ */
    function updateLiveGoods($data)
    {
        $postData['goodsInfo'] = $data;
        return $this->liveGoodsCurl($postData,'https://api.weixin.qq.com/wxaapi/broadcast/goods/update?access_token=');
    }
    /*------------------------------------------------------ */
    //-- 重新提交审核
    /*------------------------------------------------------ */
    function postCheckLiveGoods($data)
    {
        return $this->liveGoodsCurl($data,'https://api.weixin.qq.com/wxaapi/broadcast/goods/audit?access_token=');
    }
    /*------------------------------------------------------ */
    //-- 删除商品
    /*------------------------------------------------------ */
    function deleteLiveGoods($data)
    {
        return $this->liveGoodsCurl($data,'https://api.weixin.qq.com/wxaapi/broadcast/goods/delete?access_token=');
    }
    /*------------------------------------------------------ */
    //-- 直播间导入商品
    /*------------------------------------------------------ */
    function addRoomGoods($data)
    {
        return $this->liveGoodsCurl($data,'https://api.weixin.qq.com/wxaapi/broadcast/room/addgoods?access_token=');
    }
}

?>