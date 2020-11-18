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

// [network, chain_id, adminPrivateKey, adminAddress, timeout_deploy, timeout_transition]
const networks = {
  dev  : ['https://dev-api.zilliqa.com',
          333,
          '447a392d41017c14ec0a1786fc46388f63e7865ec759d07bce0a0c6e2dc41b5c',
          '0x0ba87f4374f7d9fe3ddf75b11439506b491a779a',
          300000,
          300000],
  sim  : ['http://localhost:5555',
         1,
         '447a392d41017c14ec0a1786fc46388f63e7865ec759d07bce0a0c6e2dc41b5c',
         '0x0ba87f4374f7d9fe3ddf75b11439506b491a779a',
         100000,
         100000]
};

network_parameter = networks[network_choice.toLowerCase()]
if (network_parameter == null)
    throw new Error("unknown blockchain network");


//Testing Constants / Variables
const [network, chain_id, adminPrivateKey, adminAddress, timeout_deploy, timeout_transition] = network_parameter;
let network_id = '';
const nodeVersion = 'v10.';
const baseValue = '5'; // In ZIL
const nonAdminPrivateKey = 'db11cfa086b92497c8ed5a4cc6edb3a5bfe3a640c43ffb9fc6aa0873c56f2ee3';
//const nonAdminAddress = getAddressFromPrivateKey(nonAdminPrivateKey).toLowerCase();
const nonAdminAddress = '0x7bb3b0e8a59f3f61d9bff038f4aeb42cae2ecce8';

/**
 * Runs at start of suite
 */
before(async function() {
  zilliqa = new Zilliqa(network);
  network_id = await zilliqa.network.GetNetworkId();

  // Check that we are using correct address
  zilliqa.wallet.addByPrivateKey(adminPrivateKey);
  address = getAddressFromPrivateKey(adminPrivateKey).toLowerCase();
  const addressCheck = addressEqual(address, adminAddress);
  expect(addressCheck).to.be.true;

  // Check address has at least 100 ZIL
  const bal_obj = await zilliqa.blockchain.getBalance(address);
  const balance_BN = new BN(bal_obj.result.balance);
  const min_amount_BN = units.toQa(100, units.Units.Zil);
  let ok = balance_BN.gte(min_amount_BN);
  expect(ok).to.be.true;

  // Read contract address
  ok = false;
  try {
    code = fs.readFileSync('contracts/treasury.scilla', 'utf-8');
    ok = true;
  } catch (err) {
    throw err 
  }
  expect(ok).to.be.true;

  // Deploy the contract
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
    { vname: 'base_value', type:  'Uint128', value: baseValue }
  ];

  const contract = zilliqa.contracts.new(code, init);

  [deployTx, treasury] = await contract.deploy({
    version: VERSION,
    gasPrice: myGasPrice,
    gasLimit: Long.fromNumber(15000),
  });

  console.log("Deployed Contract Address =", treasury.address);
  expect(deployTx.txParams.receipt.success).to.be.true;

  treasury_api = new TreasuryAPI(treasury, chain_id);
  expect(treasury_api).be.instanceOf(TreasuryAPI);

});

/**
 * Runs before each test. Reset back to a known state
 */
beforeEach(async function() {

  //Reset admin
  treasury_api.setSigningAddress(adminPrivateKey); //@todo - we need to read the current admin and do look up for private key
  resp = await treasury_api.changeAdmin(adminAddress);
  expect(resp.success).to.be.true;

});

function logger() {
  console.log("test");
};

function checkException(receipt, exceptionCode) {
  /* This is very 'hacky' - need to extract out to an array walker */
  exceptions = receipt.exceptions[0]['message'];
  expect(exceptions).to.include(exceptionCode);  /* refer to contract for correct codes */
}


// Base Contract Tests
describe('Treasury Smart Contract Tests', function() {

  describe('Connect to Zilliqa Blockchain', function() {

    it('should run on node version v10', function() {
        const node_version = process.version;
        const nodeVersionCheck = (node_version.substring(0,4) == nodeVersion);
        expect(nodeVersionCheck).to.be.true;
    })

    it('should connect to the blockchain and get the right chain_id', async function() {    
      const id = parseInt(network_id.result)
      expect(id).to.equal(chain_id)
    })

  });

  describe('Deployment Checks', function() {

    it('should have correct admin address', async function() {
      allState = await treasury.getState();
      expect(allState.admin).to.equal(address)
    })

    it('should have correct company address', function() {
      expect(allState.company).to.equal(address)
    })

    it('should have correct base price', function() {
      const bn_price = new BN(allState.token_price);
      expect(bn_price).to.deep.equal(units.toQa(baseValue, units.Units.Zil))
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

        it('should not allow unpausing if not admin', async function() {

          exceptionCode = 'Int32 -1';

          const receipt = await treasury_api.pauseContract();         //make sure it is paused first
          expect(receipt.success).to.be.true;
          
          await treasury_api.setSigningAddress(nonAdminPrivateKey)    // change txn signer to non adming...
          const receipt2 = await treasury_api.unpauseContract();      // ...and attempt to unpause
          
          checkException(receipt2, exceptionCode);

          expect(receipt2.success).to.be.false;                       // txn should have failed
          
        })

        it('should not allow pausing if not admin', async function() {
          
          exceptionCode = 'Int32 -1';

          const receipt = await treasury_api.unpauseContract();       //make sure it is unpaused first
          expect(receipt.success).to.be.true;
          
          await treasury_api.setSigningAddress(nonAdminPrivateKey)    // change txn signer to non adming...
          const receipt2 = await treasury_api.pauseContract();        // ...and attempt to unpause
          
          checkException(receipt2, exceptionCode);

          expect(receipt2.success).to.be.false;                       // txn should have failed
        })
        
      })
      describe('Admin Related Transitions', function() {
        it('should allow admin to change admin', async function() {

          // test invalid address fails
          const receipt1 = await treasury_api.changeAdmin("InvalidAddress");
          expect(receipt1.success).to.be.false;

          // test valid address succeeds
          const receipt2 = await treasury_api.changeAdmin(nonAdminAddress);
          expect(receipt2.success).to.be.true; 

          //reset back to original admin
          await treasury_api.setSigningAddress(nonAdminPrivateKey)          
          const receipt3 = await treasury_api.changeAdmin(adminAddress);

          expect(receipt3.success).to.be.true;
        })
        
        it('should not allow changing admin if not admin', async function() {

          exceptionCode = 'Int32 -1';          

          await treasury_api.setSigningAddress(nonAdminPrivateKey)          // change txn signer to non admin...
          const receipt2 = await treasury_api.changeAdmin(nonAdminAddress); // ...and attempt to change admin

          //console.log(receipt2);

          checkException(receipt2, exceptionCode);
          
          expect(receipt2.success).to.be.false;                             // txn should have failed
        })

        it('should allow admin to change company', async function() {
          const receipt = await treasury_api.changeCompany(nonAdminAddress);
          //console.log(receipt);
          expect(receipt.success).to.be.true;

          //need to confirm that company address has been set correctly.
          const contractCompanyAddress = await treasury_api.getCompanyAddress();
          //console.log(contractCompanyAddress);

          expect(contractCompanyAddress).to.equal(nonAdminAddress);

        })
        it('should not allow changing company if not admin', async function() {
          exceptionCode = 'Int32 -1';          

          await treasury_api.setSigningAddress(nonAdminPrivateKey)          // change txn signer to non admin...
          const receipt = await treasury_api.changeCompany(nonAdminAddress); // ...and attempt to change admin

          checkException(receipt, exceptionCode);
          
          expect(receipt.success).to.be.false;                             // txn should have failed
        })
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