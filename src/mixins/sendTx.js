export const sendTx = {
	data() {
		return {
			txStatus: 'none',
		};
	},
	methods: {
		async _sendTx(provider, txPromise) {
			try {
				this.txStatus = 'pending';
				const tx = await txPromise;
				this.txStatus = 'mining';
				const txReceipt = await provider.waitForTransaction(tx.hash);
				if (txReceipt.status == 1) {
					this.txStatus = 'success';
					return true;
				} else {
					this.txStatus = 'failure';
					return false;
				}
			} catch(e) {
				this.txStatus = 'rejected';
				return false;
			}
		},
	},
};
