'use strict';

const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const MSG_VERSION = 1;
const myGasPrice = units.toQa('1000', units.Units.Li); // Gas Price that will be used by all transactions 

class TreasuryAPI {

    constructor(deployed_contract, chain_id) {
        this.treasury = deployed_contract;
        this.chain_id = chain_id;
        this.VERSION = bytes.pack(chain_id, MSG_VERSION);

        // amount, gasPrice and gasLimit must be explicitly provided
        this.params_default = {
            version: this.VERSION,
            amount: new BN(0),
            gasPrice: myGasPrice,
            gasLimit: Long.fromNumber(8000),
        }    
    }

    async getZilBalance() {
        const zilBalance = await this.treasury.getSubState('_balance');
        return zilBalance;
    }

    async pauseContract() {
        return this.treasury.call(
            'Pause',
            [], 
            this.params_default
        ).then(callTx => {return callTx.txParams.receipt});
    }

    async unpauseContract() {
        return this.treasury.call(
            'Unpause',
            [], 
            this.params_default
        ).then(callTx => {return callTx.txParams.receipt});
    }

    async changeAdmin(newAdminAddress) {
        return this.treasury.call(
            'ChangeAdmin',
            [{
                vname: 'admin',
                type : 'String',
                value: newAdminAddress,
            },],
            this.params_default
        ).then(callTx => {return callTx.txParams.receipt});
    }

}

module.exports = {TreasuryAPI, myGasPrice};