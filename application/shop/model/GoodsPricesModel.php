<?php
namespace app\shop\model;
use app\BaseModel;
use think\facade\Cache;
//*------------------------------------------------------ */
//-- 商品价格
/*------------------------------------------------------ */
class GoodsPricesModel extends BaseModel
{
	protected $table = 'shop_goods_prices';
    protected $mkey = 'shop_goods_prices_';
	
	/*------------------------------------------------------ */
	//-- 获取列表
	/*------------------------------------------------------ */
    public function getRows($goods_id = 0){
		$list = Cache::get($this->mkey.$goods_id);
		if (empty($list) == false) return $list;
		$rows = $this->where('goods_id',$goods_id)->select()->toArray();
		$list = array();
		foreach ($rows as $row){
			$list[$row['type']][$row['by_id']] = $row['price'];
		}
		Cache::set($this->mkey.$goods_id,$list,3600);
		return $list;
	}
}
