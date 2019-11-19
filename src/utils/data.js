import addresses from '../data/addresses.json';

class Data {
	static getAddressMap() {
		const addressMap = {};
		for (const assetId in addresses) {
			const assetAddress = addresses[assetId].toLowerCase();
			addressMap[assetAddress] = assetId;
		}
		return addressMap;
	}
}

export default Data;
