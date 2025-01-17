<?php
/*------------------------------------------------------ */
//-- 支付相关
/*------------------------------------------------------ */

namespace app\publics\controller;
use think\Db;

use app\ClientbaseController;
use app\mainadmin\model\PaymentModel;

use app\member\model\RechargeLogModel;
use app\member\model\AccountLogModel;
use app\member\model\AccountModel;

use app\shop\model\OrderModel;
use app\distribution\model\RoleOrderModel;
use app\weixin\model\WeiXinUsersModel;


class Payment extends ClientbaseController
{
    public $payment; //  具体的支付类
    public $pay_code; //  具体的支付code

    /**
     * 析构流函数
     */
    public function __construct()
    {
        parent::__construct();

        // 获取支付类型
        $this->pay_code = input('pay_code');
        unset($_GET['pay_code']); // 用完之后删除, 以免进入签名判断里面去 导致错误

        // 获取通知的数据
        if (empty($this->pay_code)) {
            exit('pay_code 不能为空');
        }
        if (in_array($this->pay_code,['balance','integral','offline']) == false) {
            define('SITE_URL',config('config.host_path'));
            // 导入具体的支付类文件
            $code = str_replace('/', '\\', "/payment/{$this->pay_code}/{$this->pay_code}");
            $this->payment = new $code();
        }

    }

    /**
     *  提交支付方式
     */
    public function getCode()
    {
        header("Content-type:text/html;charset=utf-8");
        // 修改订单的支付方式
        $order_id = input('order_id/d'); // 订单id
        $actype = input('actype','','trim'); // 请求类型
        $OrderModel = new OrderModel();
        $order = $OrderModel->where("order_id", $order_id)->find();

        if ($order['order_type'] == 1) {//积分订单
            $returnDoneUrl = 'integral/flow/done';
            $returnErrorUrl = 'shop/order/info';
        }elseif ($order['order_type'] == 2) {//拼团订单
            $returnDoneUrl = 'fightgroup/index/done';
            $returnErrorUrl = 'fightgroup/order/info';
        }else{
            $returnDoneUrl = 'shop/flow/done';
            $returnErrorUrl = 'shop/order/info';
        }

        if ($actype == 'getPayStatus'){
            $return['pay_status'] = 0;
            if ($order['pay_status'] == 1) {
                $return['pay_status'] = $order['pay_status'];
            }
            return $this->ajaxReturn($return);
        }

        if ($order['pay_status'] == 1) {
            return $this->error('此订单，已完成支付', url($returnDoneUrl, ['order_id' => $order_id]));
        }
        if ($order['order_status'] == 2) {
            return $this->error('此订单，已取消不能执行支付', url($returnErrorUrl, ['order_id' => $order_id]));
        }

        $payment = (new PaymentModel)->where('pay_code', $this->pay_code)->find();
        if ($this->pay_code == 'balance') {//如果使用余额，判断用户余额是否足够
            Db::startTrans();//启动事务
            if ($order['user_id'] != $this->userInfo['user_id']){
                return $this->error('此订单你无权操作');
            }
            if ($order['order_amount'] > $this->userInfo['account']['balance_money']) {
                return $this->error('余额不足，请使用其它支付方式', url($returnDoneUrl, ['order_id' => $order_id]));
            }
            $upData['money_paid'] = $order['order_amount'];
            $upData['pay_time'] = time();
            $changedata['change_desc'] = '订单余额支付';
            $changedata['change_type'] = 3;
            $changedata['by_id'] = $order_id;
            $changedata['balance_money'] = $order['order_amount'] * -1;
            $res = (new AccountLogModel)->change($changedata, $order['user_id'], false);
            if ($res !== true) {
                Db::rollback();// 回滚事务
                return $this->error('支付失败，扣减余额失败');
            }
            $balance_money = (new AccountModel)->where('user_id',$order['user_id'])->value('balance_money');
            if ($balance_money < 0){
                Db::rollback();// 回滚事务
                return $this->error('支付失败，扣减余额失败');
            }
            //余额完成支付
            $upArr['order_id'] = $order_id;
            $upArr['pay_code'] = $this->pay_code;
            $upArr['pay_id'] = $payment['pay_id'];
            $upArr['pay_name'] = $payment['pay_name'];
            $upArr['money_paid'] = $order['order_amount'];
            $res = $OrderModel->updatePay($upArr, '余额支付成功');
            if ($res !== true) {
                Db::rollback();// 回滚事务
                return $this->error($res);
            }
            Db::commit();// 提交事务
            return $this->redirect($returnDoneUrl, ['order_id' => $order_id]);
        }
        if ($order['use_integral'] > 0 && $order['order_amount'] == 0) {//积分支付，订单金额为零时直接支付成功
            $upArr['order_id'] = $order_id;
            $upArr['pay_code'] = 'use_integral';
            $upArr['pay_id'] = 0;
            $upArr['pay_name'] = '积分支付';
            $res = $OrderModel->updatePay($upArr, '积分支付成功');
            if ($res !== true) {
                return $this->error($res);
            }
            return $this->redirect($returnDoneUrl, ['order_id' => $order_id]);
        }

        $OrderModel->where("order_id", $order_id)->update(['is_pay' => $payment['is_pay'], 'pay_code' => $this->pay_code, 'pay_id' => $payment['pay_id'], 'pay_name' => $payment['pay_name']]);

        // 订单支付提交
        $config = parseUrlParam($this->pay_code); // 类似于 pay_code=alipay&bank_code=CCB-DEBIT 参数
        $config['body'] = $OrderModel->getPayBody($order_id);
        $wxInfo = session('wxInfo');
        if ($this->pay_code == 'weixin') {
            if (strstr($_SERVER['HTTP_USER_AGENT'], 'MicroMessenger')){
                //微信JS支付
                $jsApiParameters = $this->payment->getJSAPI($order);
                if(stripos($order['order_sn'],'recharge') !== false) {
                    $go_url = url('member/wallet/index', array('type' => 'recharge'));
                    $back_url = url('member/wallet/recharge', array('order_id' => $order['order_id']));
                }elseif(stripos($order['order_sn'],'role') !== false){
                    $go_url = url('distribution/role_goods/done',array('order_id'=>$order['order_id']));
                    $back_url = $go_url;
                }else{
                    $go_url = url('shop/order/info',array('order_id'=>$order['order_id']));
                    $back_url = url('shop/flow/done',array('order_id'=>$order['order_id']));
                }
                $html = <<<EOF
	<script type="text/javascript">
	//调用微信JS api 支付
	function jsApiCall()
	{
		WeixinJSBridge.invoke(
			'getBrandWCPayRequest',$jsApiParameters,
			function(res){
				//WeixinJSBridge.log(res.err_msg);
				 if(res.err_msg == "get_brand_wcpay_request:ok") {
				    location.href='$go_url';
				 }else{				   
				    if (res.err_msg == 'get_brand_wcpay_request:cancel'){
				        alert('支付过程中用户取消');
				    }else{
				        alert(res.err_code+' - '+res.err_desc+' - '+res.err_msg);
				    }
				 	
				    location.href='$back_url';
				 }
			}
		);
	}

	function callpay()
	{
		if (typeof WeixinJSBridge == "undefined"){
		    if( document.addEventListener ){
		        document.addEventListener('WeixinJSBridgeReady', jsApiCall, false);
		    }else if (document.attachEvent){
		        document.attachEvent('WeixinJSBridgeReady', jsApiCall);
		        document.attachEvent('onWeixinJSBridgeReady', jsApiCall);
		    }
		}else{
		    jsApiCall();
		}
	}
	callpay();
	</script>
EOF;
                exit($html);
            }else{
                //微信H5支付
                $return = $this->payment->get_H5code($order, $config);
                if ($return['status'] != 1) {
                    $this->error($return['msg'], url($returnDoneUrl, ['order_id' => $order_id]));
                }
                $this->assign('deeplink', $return['result']);
            }
        }elseif($this->pay_code == 'miniAppPay') {
            if (isXcxWebView() == 1){
                $jsApiParameters = $this->payment->getJSAPI($order,session('xcx_openid'));
                $code_arr = json_decode($jsApiParameters,true);
                if($code_arr['return_code'] == 'FAIL'){
                    return $this->error($code_arr['return_msg']);
                }
                $code_str = <<<EOF
                <script type="text/javascript" src="https://res.wx.qq.com/open/js/jweixin-1.3.2.js"></script>
<script type="text/javascript">
    wx.miniProgram.getEnv(function (res) {
        if (res.miniprogram) {
            var jsApiParameters = $jsApiParameters;
            var prepay_id = jsApiParameters.package;
            prepay_id = prepay_id.replace('prepay_id=', '');
            var params = '?timestamp=' + jsApiParameters.timeStamp + '&nonceStr=' + jsApiParameters.nonceStr + '&prepay_id=' + prepay_id + '&signType=' + jsApiParameters.signType + '&paySign=' + jsApiParameters.paySign;
            wx.miniProgram.navigateTo({
                url: '/pages/wxpay/wxpay' + params
            })
        }
    })
 </script>
EOF;

            }else{
                $open_id = (new WeiXinUsersModel())->where('user_id',$this->userInfo['user_id'])->value('wx_openid');
                //微信JS支付
                $code_arr = $this->payment->getJSAPI($order,$open_id);
                $code_arr = json_decode($code_arr,true);
                if($code_arr['err_code']){
                    $return['code'] = 0;
                    $return['msg'] = $code_arr['err_code_des'];
                    return $this->ajaxReturn($return);
                };
                $return['code'] = 1;
                $return['data'] = $code_arr;
                return $this->ajaxReturn($return);
            }

            // return $this->success('获取成功',$code_str);
        }elseif($this->pay_code == 'offline'){//线下支付
            $payment['pay_config'] = json_decode(urldecode($payment['pay_config']),true);
            $this->assign('payment', $payment);
            $this->assign('order_id', $order_id);
            return $this->fetch('offline');
        } else {
            //其他支付（支付宝、银联...）
            $code_str = $this->payment->get_code($order, $config);
            if ($code_str === false){
                return $this->error('暂不能使用当前支付方式，请使用其它支付方式',url($returnErrorUrl, ['order_id' => $order_id]));
            }
        }
        $this->assign('pay_code', $this->pay_code);
        $this->assign('code_str', $code_str);
        $this->assign('order_id', $order_id);
        return $this->fetch('payment');  // 分跳转 和不 跳转
    }
    /**
     * 充值
     * @return mixed|void
     */
    public function getPay()
    {
        //手机端在线充值
        //C('TOKEN_ON',false); // 关闭 TOKEN_ON 
        header("Content-type:text/html;charset=utf-8");
        $order_id = input('order_id/d'); //订单id
        $RechargeLogModel = new RechargeLogModel();

        $order = $RechargeLogModel->where("order_id", $order_id)->find();
        if (empty($order)) {
            return $this->error('提交失败,参数有误!');
        }
        if ($order['status'] != 0) {
            return $this->error('此充值订单，状态非待支付，不能完成操作');
        }

        $pay_radio = $_REQUEST['pay_radio'];
        $config_value = parseUrlParam($pay_radio); // 类似于 pay_code=alipay&bank_code=CCB-DEBIT 参数
        $wxInfo = session('wxInfo');
        //微信JS支付
        if ($this->pay_code == 'weixin'  && $wxInfo['wx_openid'] && strstr($_SERVER['HTTP_USER_AGENT'], 'MicroMessenger')) {
            $code_str = $this->payment->getJSAPI($order);
            exit($code_str);
        } else {
            $code_str = $this->payment->get_code($order, $config_value);
        }

        $this->assign('code_str', $code_str);
        $this->assign('order_id', $order_id);
        return $this->fetch('recharge'); //分跳转 和不 跳转
    }


    /**
     * 支付异步回调处理
     */
    public function notifyUrl()
    {
        trace('notifyUrl:' . json_encode($_POST), 'debug');
        $this->payment->response();
        exit();
    }




    /**
     * 支付同步回调地址
     * @return mixed
     */
    public function returnUrl()
    {
        trace('returnUrl:' . json_encode($_POST), 'debug');
        $result = $this->payment->respond2(); // $result['order_sn'] = '201512241425288593';
        trace('$result:' . json_encode($result), 'debug');
        if (stripos($result['order_sn'], 'recharge') !== false) {
            $RechargeLogModel = new RechargeLogModel();
            $orderInfo = $RechargeLogModel->where("order_sn", $result['order_sn'])->find();
            trace('$result$orderInfo:' . json_encode($orderInfo), 'debug');
            $this->assign('orderInfo', $orderInfo);
            if ($orderInfo['status'] == 9)
                return $this->fetch('recharge_success');
            else
                return $this->fetch('recharge_error');
        }
        $this->assign('title','支付结果');
        $OrderModel = new OrderModel();
        $orderInfo = $OrderModel->where("order_sn", $result['order_sn'])->find();
        $this->assign('orderInfo', $orderInfo);
        if ($result['status'] == 1)
            return $this->fetch('success');
        else
            return $this->fetch('error');
    }

}
