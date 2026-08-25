// It's hard to get full test coverage on SafeMath testing just the Stablecoin contract.
// This is the openzeppelin-solidity test for add and sub as of the time of writing.

const assert = require("assert");
const { BN, constants, expectRevert } = require("@openzeppelin/test-helpers");
const { MAX_UINT256 } = constants;

const SafeMathMock = artifacts.require("SafeMathMock");

contract("SafeMath", function() {
  beforeEach(async function() {
    this.safeMath = await SafeMathMock.new();
  });

  function assertBNEqual(actual, expected) {
    assert.strictEqual(actual.toString(), expected.toString());
  }

  async function testCommutative(fn, lhs, rhs, expected) {
    assertBNEqual(await fn(lhs, rhs), expected);
    assertBNEqual(await fn(rhs, lhs), expected);
  }

  async function testFailsCommutative(fn, lhs, rhs) {
    await expectRevert.unspecified(fn(lhs, rhs));
    await expectRevert.unspecified(fn(rhs, lhs));
  }

  describe("add", function() {
    it("adds correctly", async function() {
      const a = new BN("5678");
      const b = new BN("1234");

      assertBNEqual(await this.safeMath.add(a, b), a.add(b));
    });

    it("reverts on addition overflow", async function() {
      const a = MAX_UINT256;
      const b = new BN("1");

      await expectRevert.unspecified(this.safeMath.add(a, b));
    });
  });

  describe("sub", function() {
    it("subtracts correctly", async function() {
      const a = new BN("5678");
      const b = new BN("1234");

      assertBNEqual(await this.safeMath.sub(a, b), a.sub(b));
    });

    it("reverts if subtraction result would be negative", async function() {
      const a = new BN("1234");
      const b = new BN("5678");

      await expectRevert.unspecified(this.safeMath.sub(a, b));
    });
  });

  describe("mul", function() {
    it("multiplies correctly", async function() {
      const a = new BN("1234");
      const b = new BN("5678");

      await testCommutative(this.safeMath.mul, a, b, a.mul(b));
    });

    it("multiplies by zero correctly", async function() {
      const a = new BN("0");
      const b = new BN("5678");

      await testCommutative(this.safeMath.mul, a, b, new BN("0"));
    });

    it("reverts on multiplication overflow", async function() {
      const a = MAX_UINT256;
      const b = new BN("2");

      await testFailsCommutative(this.safeMath.mul, a, b);
    });
  });

  describe("div", function() {
    it("divides correctly", async function() {
      const a = new BN("5678");
      const b = new BN("5678");

      assertBNEqual(await this.safeMath.div(a, b), a.div(b));
    });

    it("divides zero correctly", async function() {
      const a = new BN("0");
      const b = new BN("5678");

      assertBNEqual(await this.safeMath.div(a, b), new BN("0"));
    });

    it("returns complete number result on non-even division", async function() {
      const a = new BN("7000");
      const b = new BN("5678");

      assertBNEqual(await this.safeMath.div(a, b), new BN("1"));
    });

    it("reverts on divison by zero", async function() {
      const a = new BN("5678");
      const b = new BN("0");

      await expectRevert.unspecified(this.safeMath.div(a, b));
    });
  });
});
