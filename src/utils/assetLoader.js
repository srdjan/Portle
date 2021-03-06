import aeLogo from '../../public/img/assets/ae.svg';
import antLogo from '../../public/img/assets/ant.svg';
import astLogo from '../../public/img/assets/ast.svg';
import batLogo from '../../public/img/assets/bat.svg';
import bfLogo from '../../public/img/assets/bf.svg';
import bnbLogo from '../../public/img/assets/bnb.svg';
import bntLogo from '../../public/img/assets/bnt.svg';
import btmLogo from '../../public/img/assets/btm.svg';
import civicLogo from '../../public/img/assets/civic.svg';
import cvcLogo from '../../public/img/assets/cvc.svg';
import daiLogo from '../../public/img/assets/dai.svg';
import dgdLogo from '../../public/img/assets/dgd.svg';
import dgxLogo from '../../public/img/assets/dgx.svg';
import engLogo from '../../public/img/assets/eng.svg';
import enjLogo from '../../public/img/assets/enj.svg';
import ethLogo from '../../public/img/assets/eth.svg';
import gnoLogo from '../../public/img/assets/gno.svg';
import gntLogo from '../../public/img/assets/gnt.svg';
import htLogo from '../../public/img/assets/ht.svg';
import kncLogo from '../../public/img/assets/knc.svg';
import linkLogo from '../../public/img/assets/link.svg';
import loomLogo from '../../public/img/assets/loom.svg';
import lrcLogo from '../../public/img/assets/lrc.svg';
import manaLogo from '../../public/img/assets/mana.svg';
import maticLogo from '../../public/img/assets/matic.svg';
import mcoLogo from '../../public/img/assets/mco.svg';
import mkrLogo from '../../public/img/assets/mkr.svg';
import mlnLogo from '../../public/img/assets/mln.svg';
import nexoLogo from '../../public/img/assets/nexo.svg';
import omgLogo from '../../public/img/assets/omg.svg';
import payLogo from '../../public/img/assets/pay.svg';
import poeLogo from '../../public/img/assets/poe.svg';
import qntLogo from '../../public/img/assets/qnt.svg';
import renLogo from '../../public/img/assets/ren.svg';
import repLogo from '../../public/img/assets/rep.svg';
import reqLogo from '../../public/img/assets/req.svg';
import rlcLogo from '../../public/img/assets/rlc.svg';
import saiLogo from '../../public/img/assets/sai.svg';
import sntLogo from '../../public/img/assets/snt.svg';
import snxLogo from '../../public/img/assets/snx.svg';
import spankLogo from '../../public/img/assets/spank.svg';
import storjLogo from '../../public/img/assets/storj.svg';
import tknLogo from '../../public/img/assets/tkn.svg';
import tntLogo from '../../public/img/assets/tnt.svg';
import tusdLogo from '../../public/img/assets/tusd.svg';
import usdcLogo from '../../public/img/assets/usdc.svg';
import usdtLogo from '../../public/img/assets/usdt.svg';
import wbtcLogo from '../../public/img/assets/wbtc.svg';
import wethLogo from '../../public/img/assets/weth.svg';
import zrxLogo from '../../public/img/assets/zrx.svg';

import melonLogo from '../../public/img/protocols/melon.svg';

import btcdaiLogo from '../../public/img/sets/btcdai.svg';
import btceth2575Logo from '../../public/img/sets/btceth2575.svg';
import btceth5050Logo from '../../public/img/sets/btceth5050.svg';
import btceth7525Logo from '../../public/img/sets/btceth7525.svg';
import btcminvolLogo from '../../public/img/sets/btcminvol.svg';
import eth12emacoLogo from '../../public/img/sets/eth12emaco.svg';
import eth20smacoLogo from '../../public/img/sets/eth20smaco.svg';
import eth26emacoLogo from '../../public/img/sets/eth26emaco.svg';
import eth50smacoLogo from '../../public/img/sets/eth50smaco.svg';
import ethbtc26emacoLogo from '../../public/img/sets/ethbtc26emaco.svg';
import ethbtcrsi7030Logo from '../../public/img/sets/ethbtcrsi7030.svg';
import ethdaiLogo from '../../public/img/sets/ethdai.svg';
import ethemaapyLogo from '../../public/img/sets/ethemaapy.svg';
import ethmacoapyLogo from '../../public/img/sets/ethmacoapy.svg';
import ethminvolLogo from '../../public/img/sets/ethminvol.svg';
import ethrsi6040Logo from '../../public/img/sets/ethrsi6040.svg';
import ethrsiapyLogo from '../../public/img/sets/ethrsiapy.svg';
import ieth20smacoLogo from '../../public/img/sets/ieth20smaco.svg';
import ieth50smacoLogo from '../../public/img/sets/ieth50smaco.svg';
import stbtcdaiLogo from '../../public/img/sets/stbtcdai.svg';
import stethdaiLogo from '../../public/img/sets/stethdai.svg';

class AssetLoader {
	static loadAssetLogo(assetId) {
		const logoMap = {
			'ae': aeLogo,
			'ant': antLogo,
			'ast': astLogo,
			'bat': batLogo,
			'bf': bfLogo,
			'bnb': bnbLogo,
			'bnt': bntLogo,
			'btm': btmLogo,
			'civic': civicLogo,
			'cvc': cvcLogo,
			'dai': daiLogo,
			'dgd': dgdLogo,
			'dgx': dgxLogo,
			'eng': engLogo,
			'enj': enjLogo,
			'eth': ethLogo,
			'gno': gnoLogo,
			'gnt': gntLogo,
			'ht': htLogo,
			'knc': kncLogo,
			'link': linkLogo,
			'loom': loomLogo,
			'lrc': lrcLogo,
			'mana': manaLogo,
			'matic': maticLogo,
			'mco': mcoLogo,
			'mkr': mkrLogo,
			'mln': mlnLogo,
			'nexo': nexoLogo,
			'omg': omgLogo,
			'pay': payLogo,
			'poe': poeLogo,
			'qnt': qntLogo,
			'ren': renLogo,
			'rep': repLogo,
			'req': reqLogo,
			'rlc': rlcLogo,
			'sai': saiLogo,
			'snt': sntLogo,
			'snx': snxLogo,
			'spank': spankLogo,
			'storj': storjLogo,
			'tkn': tknLogo,
			'tnt': tntLogo,
			'tusd': tusdLogo,
			'usdc': usdcLogo,
			'usdt': usdtLogo,
			'wbtc': wbtcLogo,
			'weth': wethLogo,
			'zrx': zrxLogo,
		};
		return logoMap[assetId];
	}

	static loadProtocolLogo(protocolId) {
		const logoMap = {
			'melon': melonLogo,
		};
		return logoMap[protocolId];
	}

	static loadSetLogo(setId) {
		const logoMap = {
			'btcdai': btcdaiLogo,
			'btceth2575': btceth2575Logo,
			'btceth5050': btceth5050Logo,
			'btceth7525': btceth7525Logo,
			'btcminvol': btcminvolLogo,
			'eth12emaco': eth12emacoLogo,
			'eth20smaco': eth20smacoLogo,
			'eth26emaco': eth26emacoLogo,
			'eth50smaco': eth50smacoLogo,
			'ethbtc26emaco': ethbtc26emacoLogo,
			'ethbtcrsi7030': ethbtcrsi7030Logo,
			'ethdai': ethdaiLogo,
			'ethemaapy': ethemaapyLogo,
			'ethmacoapy': ethmacoapyLogo,
			'ethminvol': ethminvolLogo,
			'ethrsi6040': ethrsi6040Logo,
			'ethrsiapy': ethrsiapyLogo,
			'ieth20smaco': ieth20smacoLogo,
			'ieth50smaco': ieth50smacoLogo,
			'stbtcdai': stbtcdaiLogo,
			'stethdai': stethdaiLogo,
		};
		return logoMap[setId];
	}
}

export default AssetLoader;
