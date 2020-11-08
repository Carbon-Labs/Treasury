var should = require('chai').should();
var expect = require('chai').expect;

//const C = require("../contracts/treasury.scilla");


// Base Contract Tests
describe('Base Contract Tests', function() {

  describe('Connect to Zilliqa Blockchain', function() {

    it('should run on node version v14', function() {
        const node_version = process.version;
        const ok = (node_version.substring(0,4) == 'v14.');
        expect(ok).to.be.true;
    })
    it.skip('should connect to the blockchain and get the right chain_id', async function() {})
    it.skip('should have the right test account', async function() {})
    it.skip('should have at least 10 ZIL in the account', async function () {})

  });

  describe('Deployment Checks', function() {
    it.skip('should read contract source', function() {})
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
describe('Management Functions', function() {
  describe('Pausing Related Transitions', function() {
    it.skip('should only allow admin to pause when unpaused', function() {})
    it.skip('should only allow admin to unpause when paused', function() {})
    it.skip('should allow admin to change admin', function() {})
    it.skip('should not allow changing admin if not admin', function() {})
    it.skip('should allow admin to change company', function() {})
    it.skip('should not allow changing company if not admin', function() {})
  });
});