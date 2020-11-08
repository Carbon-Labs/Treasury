var should = require('chai').should();
var expect = require('chai').expect;
//const assert = chai.assert;

const fs = require('fs');

const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {toBech32Address, getAddressFromPrivateKey} = require('@zilliqa-js/crypto');

const {addressEqual} = require ('../lib/addressEqual');

network_choice = process.env.npm_config_network || 'dev';

// [network, chain_id, privateKey, account_address, timeout_deploy, timeout_transition]
const networks = {
  dev  : ['https://dev-api.zilliqa.com',
          333,
          '447a392d41017c14ec0a1786fc46388f63e7865ec759d07bce0a0c6e2dc41b5c',
          'zil1pw587sm57lvlu0wlwkc3gw2sddy35au6esw589',
          300000,
          300000]
};

network_parameter = networks[network_choice.toLowerCase()]
if (network_parameter == null)
    throw new Error("unknown blockchain network");

console.log({network_parameter});

const [network, chain_id, privateKey, account_address, timeout_deploy, timeout_transition] = network_parameter;


// Base Contract Tests
describe('Base Contract Tests', function() {

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
            console.log(code);
    })
    it.skip('should deploy the contract', async function() {})
    it.skip('should have an address', function() {})
    it.skip('should have correct admin address', function() {})
    it.skip('should have correct company address', function() {})
    it.skip('should have correct base price', function() {})
    it.skip('should be "paused" on contract creation', function() {})
    it.skip('should not be "under funded" on contract creation', function() {})
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