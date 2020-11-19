'use strict';

const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');

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

    /**
     * 
     * @param {*} privateKey 
     */
    async setSigningAddress(privateKey) {
        const zilliqa = new Zilliqa('http://localhost:5555');
        zilliqa.wallet.addByPrivateKey(privateKey);
        this.treasury.signer = zilliqa.wallet;
    }

    /**
     * @dev - get amount of zil in The Treasury
     */
    async getZilBalance() {
        const zilBalance = await this.treasury.getSubState('_balance');
        return zilBalance._balance;
    }

    /**
     * @dev - get amount of tokens held by The treasury
     */
    async getTokenBalance() {
        const tokenBalance = await this.treasury.getSubState('tokenBalance');
        return tokenBalance.tokenBalance;
    }

    async getZilPrice() {
        const zilPrice = await this.treasury.getSubState('zilPrice');
        return zilPrice.zilPrice;
    }

    async getTokenPrice() {
        const tokenPrice = await this.treasury.getSubState('tokenPrice');
        return tokenPrice.tokenPrice;
    }

    async getAdmin() {
        const adminAddress = await this.treasury.getSubState('admin');
        return adminAddress.admin;
    }

    async getCompanyAddress() {
        const companyAddress = await this.treasury.getSubState('company');
        return companyAddress.company;
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
        ).then(callTx => {
            return callTx.txParams.receipt});
    }

    async changeAdmin(newAdminAddress) {
        return this.treasury.call('ChangeAdmin',
            [{
                vname: 'newAdminAddress',
                type : 'ByStr20',
                value: newAdminAddress,
            }],
            this.params_default
        ).then(callTx => {
            return callTx.txParams.receipt});
    }

    async changeCompany(newCompanyAddress) {
        return this.treasury.call('ChangeCompany',
            [{
                vname: 'newCompanyAddress',
                type : 'ByStr20',
                value: newCompanyAddress,
            }],
            this.params_default
        ).then(callTx => {
            return callTx.txParams.receipt});
    }

    async buyTokens(zilAmount) {
        return this.treasury.call('buyTokens',
            [],
            {
                version: this.VERSION,
                amount: new BN(zilAmount),
                gasPrice: myGasPrice,
                gasLimit: Long.fromNumber(8000),
            }
        ).then(callTx => {
            return callTx.txParams.receipt});
    }

}

module.exports = {TreasuryAPI, myGasPrice};