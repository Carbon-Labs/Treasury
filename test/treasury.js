var should = require('chai').should();
var expect = require('chai').expect;
//const assert = chai.assert;

const fs = require('fs');

const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {toBech32Address, getAddressFromPrivateKey} = require('@zilliqa-js/crypto');

const {addressEqual} = require ('../lib/addressEqual');

network_choice = process.env.npm_config_network || 'sim';

//contract fields
allState = "";

// [network, chain_id, privateKey, account_address, timeout_deploy, timeout_transition]
const networks = {
  dev  : ['https://dev-api.zilliqa.com',
          333,
          '447a392d41017c14ec0a1786fc46388f63e7865ec759d07bce0a0c6e2dc41b5c',
          'zil1pw587sm57lvlu0wlwkc3gw2sddy35au6esw589',
          300000,
          300000],
  sim  : ['http://localhost:5555',
         1,
         'db11cfa086b92497c8ed5a4cc6edb3a5bfe3a640c43ffb9fc6aa0873c56f2ee3',
         'zil10wemp699nulkrkdl7qu0ft459jhzan8g6r5lh7',
         300000,
         300000]
};

network_parameter = networks[network_choice.toLowerCase()]
if (network_parameter == null)
    throw new Error("unknown blockchain network");

console.log({network_parameter});

const [network, chain_id, privateKey, account_address, timeout_deploy, timeout_transition] = network_parameter;


// Base Contract Tests
describe('Treasury Smart Contract Tests', function() {

  describe('Connect to Zilliqa Blockchain', function() {

    it('should run on node version v10', function() {
        const node_version = process.version;
        const ok = (node_version.substring(0,4) == 'v10.');
        expect(ok).to.be.true;
    })

    it('should connect to the blockchain and get the right chain_id', async function() {
      zilliqa = new Zilliqa(network);
      const network_id = await zilliqa.network.GetNetworkId();
      const id = parseInt(network_id.result)
      expect(id).to.equal(chain_id)
    })

    it('should have the right test account', async function() {
      zilliqa.wallet.addByPrivateKey(privateKey);
      address = getAddressFromPrivateKey(privateKey).toLowerCase();
      const ok = addressEqual(address, account_address);
      expect(ok).to.be.true;
    })

    it('should have at least 10 ZIL in the account', async function () {
      const bal_obj = await zilliqa.blockchain.getBalance(address);
      const balance_BN = new BN(bal_obj.result.balance);
      const min_amount_BN = units.toQa(10, units.Units.Zil);
      const ok = balance_BN.gte(min_amount_BN);
      expect(ok).to.be.true;
    })

  });

  describe('Deployment Checks', function() {
    it('should read contract source', function() {
      let ok = false;
            try {
                code = fs.readFileSync('contracts/treasury.scilla', 'utf-8');
                ok = true;
            } catch (err) {
              throw err 
            }
            expect(ok).to.be.true;
    })
    it('should deploy the contract', async function() {
      this.timeout(timeout_deploy);
      this.slow(timeout_deploy / 2);
      const MSG_VERSION = 1;
      const VERSION = bytes.pack(chain_id, MSG_VERSION);
      const myGasPrice = units.toQa('1000', units.Units.Li);

      const init = [
        { vname: '_scilla_version', type: 'Uint32', value: '0'},
        { vname: 'init_admin', type:  'ByStr20', value: address },
        { vname: 'init_company', type:  'ByStr20', value: address },
        { vname: 'proxy_address', type:  'ByStr20', value: address },
        { vname: 'token_address', type:  'ByStr20', value: address },
        { vname: 'base_value', type:  'Uint256', value: '1000' }
      ];

      const contract = zilliqa.contracts.new(code, init);

      [deployTx, treasury] = await contract.deploy({
        version: VERSION,
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(15000),
      });
      //console.log(deployTx);
      console.log("        contract address =", treasury.address);
      expect(deployTx.txParams.receipt.success).to.be.true;
    })
    it('should have correct admin address', async function() {
      
      allState = await treasury.getState();
      expect(allState.admin).to.equal(address)

    })

    it('should have correct company address', function() {
      expect(allState.company).to.equal(address)
    })

    // @todo: need to remove hard coded value of 1000
    it('should have correct base price', function() {
      expect(allState.token_price).to.equal('1000')
    })

    it('should be "paused" on contract creation', function() {
      expect(allState.paused.constructor).to.equal('True')
    })

    it('should not be "under funded" on contract creation', function() {
      expect(allState.under_funded.constructor).to.equal('False')
    })

  });
}),

// Mangament Functions
describe('Contract Tests', function() {
  describe('Management Functions', function() {
    describe('Pausing Related Transitions', function() {
      it.skip('should only allow admin to pause when unpaused', function() {})
      it.skip('should only allow admin to unpause when paused', function() {})
      it.skip('should not only pausing if not admin', function() {})
      it.skip('should not only unpausing if not admin', function() {})
    })
    describe('Admin Related Transitions', function() {
      it.skip('should allow admin to change admin', function() {})
      it.skip('should not allow changing admin if not admin', function() {})
      it.skip('should allow admin to change company', function() {})
      it.skip('should not allow changing company if not admin', function() {})
    })
  })
});