export const sendTx = {
	data() {
		return {
			txStatus: 'none',
		}
	},
	methods: {
		async _sendTx(provider, txPromise) {
			try {
				this.txStatus = 'mining';
				const tx = await txPromise;
				const txReceipt = await provider.getTransactionReceipt(tx.hash);
				if (txReceipt.status == 1) {
					this.txStatus = 'success';
				} else {
					this.txStatus = 'failure';
				}
			} catch(e) {
				this.txStatus = 'rejected';
			}
		},
	},
}
