var should = require('chai').should();
var expect = require('chai').expect;
//const assert = chai.assert;

const fs = require('fs');

const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {toBech32Address, getAddressFromPrivateKey} = require('@zilliqa-js/crypto');

const {addressEqual} = require ('../lib/addressEqual');
const {TreasuryAPI, myGasPrice} = require('../lib/TreasuryAPI');

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

//console.log({network_parameter});

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
        { vname: 'base_value', type:  'Uint128', value: '5' }
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

    // @todo: need to remove hard coded value of 5
    it('should have correct base price', function() {
      const bn_price = new BN(allState.token_price);
      expect(bn_price).to.deep.equal(units.toQa('5', units.Units.Zil))
    })

    it('should be "paused" on contract creation', function() {
      expect(allState.paused.constructor).to.equal('True')
    })

    it('should not be "under funded" on contract creation', function() {
      expect(allState.under_funded.constructor).to.equal('False')
    })

  });

  // Mangament Functions
  describe('Contract Tests', function() {

    this.timeout(timeout_transition);
    this.slow(timeout_transition / 2);

    it('should get the treasury_api', async function() {
      treasury_api = new TreasuryAPI(treasury, chain_id);
      expect(treasury_api).be.instanceOf(TreasuryAPI);

      //const zilBalance = await treasury_api.getZilBalance();
      //console.log("Zil Balance ", zilBalance._balance);
    })

    describe('Management Functions', function() {
      describe('Pausing Related Transitions', function() {
        it('should allow admin to unpause when paused', async function() {
          const receipt = await treasury_api.unpauseContract();
          expect(receipt.success).to.be.true;
        })

        it('should allow admin to pause when unpaused', async function() {
          const receipt = await treasury_api.pauseContract();
          expect(receipt.success).to.be.true;          
        })

        it.skip('should not allow pausing if not admin', function() {})
        it.skip('should not allow unpausing if not admin', function() {})
      })
      describe('Admin Related Transitions', function() {
        it.skip('should allow admin to change admin', function() {})
        it.skip('should not allow changing admin if not admin', function() {})
        it.skip('should allow admin to change company', function() {})
        it.skip('should not allow changing company if not admin', function() {})
      })
      describe('Internal Functions', function() {
        it.skip('should recalculate exchange rates when receiving ZIL that is not for buying tokens', function() {})
        it.skip('should recalculate exchange rates when receiving TOKENS that is not for paying invoice', function() {})
      })
      describe('Trading Features', function() {
        it.skip('should not allow buying of tokens when paused', function() {})
        it.skip('should not allow selling of tokens when paused', function() {})
        it.skip('should allow buying of tokens when unpaused', function() {})
        it.skip('should allow selling of tokens when unpaused', function() {})
        it.skip('should not allow selling more tokens than you have', function() {})
        it.skip('should issue correct amount of tokens when buying tokens with 1 ZIL', function() {})
        it.skip('should send the correct amount of ZIL to you after selling tokens', function() {})
      })
      describe('Invoicing Features', function() {
       it.skip('should allow creating new invoice', function() {}) 
       it.skip('should only allow admin to cancel an invoice', function() {})
       it.skip('should error when trying to cancel an invoice that does not exist', function() {})
       it.skip('should allow an invoice to be partially paid with tokens', function() {})
       it.skip('should allow an invoice to be paid in full with tokens', function() {})
       it.skip('should allow an invoice to be partially paid with ZIL', function() {})
       it.skip('should allow an invoice to be paid in full with ZIL', function() {})
       it.skip('should allow an invoice to be partially paid with combination of tokens and ZIL', function() {})
       it.skip('should allow an invoice to be paid in full with combination of tokens and ZIL', function() {})
       it.skip('should issue new tokens if invoice is overpaid with ZIL', function() {})
       it.skip('should allow an invoice to be overpaid with combination of tokens and ZIL', function() {})
       it.skip('should allow multiple payments against an invoice', function() {})
       it.skip('should only consume the correct amount of tokens when invoice is overpaid', function() {})
       it.skip('should not allow payments against fully paid invoices', function() {})
       

      })
    });

    

  });
})