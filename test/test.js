var should = require('chai').should();
var numbers = [1, 2, 3, 4, 5];

describe('Example', function() {
  describe('Just an Example', function() {
    it('numbers', function() {
      numbers.should.be.an('array').that.includes(2);
      numbers.should.have.lengthOf(5);
    });
    it('numbers', function() {
      numbers.should.be.an('array').that.includes(2);
      numbers.should.have.lengthOf(5);
    });
  });
  describe('Just an Example', function() {
    it('numbers', function() {
      numbers.should.be.an('array').that.includes(2);
      numbers.should.have.lengthOf(5);
    });
  });
});