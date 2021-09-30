# VIIIDA Gold (AuV)

EightDA-issued phyiscal gold ERC20 token public smart contract repository.

https://www.viiida.com/viiida-gold-whitepaper

## ABI, Address, and Verification

The contract abi is in `AuV.abi`. It is the abi of the implementation contract.
Interaction with AuV is done at the address of the proxy at `0x45804880De22913dAFE09f4980848ECE6EcbAf78`. See
https://etherscan.io/token/0x45804880De22913dAFE09f4980848ECE6EcbAf78 for live on-chain details, and the section on bytecode verification below.

## Contract Specification

VIIIDA Gold (AuV) is an ERC20 token that is Centrally Minted and Burned by Eight S.A. (Eight Digital Assets), which is a corporation headquartered in Geneva, Switzerland, regulated by FINMA (Swiss Code: CHE-181.808.124 OAR-G, Genf.), representing the physical ownership of brazilian gold.

### ERC20 Token

The public interface of AuV Gold is the ERC20 interface
specified by [EIP-20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md).

- `name()`
- `symbol()`
- `decimals()`
- `totalSupply()`
- `balanceOf(address who)`
- `transfer(address to, uint256 value)`
- `approve(address spender, uint256 value)`
- `allowance(address owner, address spender)`
- `transferFrom(address from, address to, uint256 value)`

And the usual events.

- `event Transfer(address indexed from, address indexed to, uint256 value)`
- `event Approval(address indexed owner, address indexed spender, uint256 value)`

Typical interaction with the contract will use `transfer` to move the token as payment.
Additionally, a pattern involving `approve` and `transferFrom` can be used to allow another
address to move tokens from your address to a third party without the need for the middleperson
to custody the tokens, such as in the 0x protocol.

#### Warning about ERC20 approve front-running

There is a well known gotcha involving the ERC20 `approve` method. The problem occurs when the owner decides
to change the allowance of a spender that already has an allowance. If the spender sends a `transferFrom`
transaction at a similar time that the owner sends the new `approve` transaction
and the `transferFrom` by the spender goes through first, then the spender gets to use the
original allowance, and also get approved for the intended new allowance.

The recommended mitigation in cases where the owner does not trust the spender is to
first set the allowance to zero before setting it to a new amount, checking that the
allowance was not spent before sending the new approval transaction. Note, however, that any
allowance change is subject to front-running, which is as simple as watching the
mempool for certain transactions and then offering a higher gas price to get another
transaction mined onto the blockchain more quickly.

### Controlling the token supply

The total supply of AuV is backed by brazilian gold with a deposit with exploration authorized by the brazilian government and consolidated in gold bars for custody in Switzerland, under custody of Eight Digital Assets and authorized partners.

There is a single `supplyController` address that can mint and burn the token
based on the actual movement of gold in and out of the reserve based on
requests for the purchase, conversion and redemption of AuV.

The supply control interface includes methods to get the current address
of the supply controller, and events to monitor the change in supply of AuV.

- `supplyController()`

Supply Control Events

- `SupplyIncreased(address indexed to, uint256 value)`
- `SupplyDecreased(address indexed from, uint256 value)`
- `SupplyControllerSet(address indexed oldSupplyController, address indexed newSupplyController)`

### Pausing the contract

In the event of a critical security threat, EightDA has the ability to pause transfers
and approvals of the AuV token. The ability to pause is controlled by a single `owner` role,
following OpenZeppelin's
[Ownable](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/5daaf60d11ee2075260d0f3adfb22b1c536db983/contracts/ownership/Ownable.sol).
The simple model for pausing transfers following OpenZeppelin's
[Pausable](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/5daaf60d11ee2075260d0f3adfb22b1c536db983/contracts/lifecycle/Pausable.sol).

### Fees

EightDA charges a set fee rate for all on-chain transfers of AuV in order to offset storage fees of gold bars in our deposit or vault.
The fee controller has the ability to set the fee recipient and the fee rate (measured in 1/100th of a basis point).
EightDA will never change the fee rate without prior notice as we take transparency very seriously.

#### Fee Rounding

The `transfer` function takes the debit amount as input, and computes the fee and credit to the recipient as

```
fee = debit.mul(feeRate).div(feeParts)
credit = debit.sub(fee)
```

Note that div truncates to an integer (and therefore 18 decimal effective precision).

#### Inverse Fee Rounding

The "inverse fee problem" is the problem of figuring out the amount to send (the debit), and the corresponding fee,
given that you know how much you want the recipient to receive (the credit).

The following is a solution for the fee given the credit

```
denominator = feeParts.sub(feeRate)
fee = credit.mul(feeRate).div(denominator)
debit = credit.add(fee)
```

One can prove this is always a solution by expressing the truncate rounding as a set of inequalities.
Note that there is a necessary truncate operation in the `div` step. The key here is that the rounding
is done in the computation of the expected fee rather than trying to compute the debit directly
from the credit. There are other orders of operations that lead to inconsistent rounding such that
the transfer function will compute a different fee and credit than you intended.

#### Saving On Inverse Fees

It is sometimes the case that `smallerFee = fee.sub(1)` is also a solution. It is likely only worth the extra compute
to save 10^-18 AuV if doing the math off-chain. One checks that

```
smallerFee = fee.sub(1)
debit = credit.add(smallerFee)
debitFee = debit.mul(feeRate).div(feeParts)
if debitFee == smallerFee { // this is a solution!
    return smallerFee
} else {
    return fee
}
```

### Token Price

The price of gold will be in accordance with the price charged by LBMA London.

### Asset Protection Role

As required by our regulators, we have introduced a role for asset protection to freeze or seize the assets of a criminal party when required to do so by law, including by court order or other legal process.

The `assetProtectionRole` can freeze and unfreeze the AuV balance of any address on chain.
It can also wipe the balance of an address after it is frozen
to allow the appropriate authorities to seize the backing assets.

Freezing is something that EightDA will not do on its own accord,
and as such we expect to happen extremely rarely. The list of frozen addresses is available
in `isFrozen(address who)`.

### BetaDelegateTransfer

In order to allow for gas-less transactions we have implemented a variation of [EIP-865](https://github.com/ethereum/EIPs/issues/865).
The public function betaDelegatedTransfer and betaDelegatedTransferBatch allow an approved party to transfer AuV
on the end user's behalf given a signed message from said user. Because EIP-865 is not finalized,
all methods related to delegated transfers are prefixed by Beta. Only approved parties are allowed to transfer
AuV on a user's behalf because of potential attacks associated with signing messages.
To mitigate some attacks, [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md)
is implemented which provides a structured message to be displayed for verification when signing.

```
function betaDelegatedTransfer(
   bytes sig, address to, uint256 value, uint256 serviceFee, uint256 seq, uint256 deadline
) public returns (bool) {
```

### Upgradeability Proxy

To facilitate upgradeability on the immutable blockchain we follow a standard
two-contract delegation pattern: a proxy contract represents the token,
while all calls not involving upgrading the contract are delegated to an
implementation contract.

The delegation uses `delegatecall`, which runs the code of the implementation contract
_in the context of the proxy storage_. This way the implementation pointer can
be changed to a different implementation contract while still keeping the same
data and AuV contract address, which are really for the proxy contract.

The proxy used here is AdminUpgradeabilityProxy from ZeppelinOS.

## Upgrade Process

The implementation contract is only used for the logic of the non-admin methods.
A new implementation contract can be set by calling `upgradeTo()` or `upgradeToAndCall()` on the proxy,
where the latter is used for upgrades requiring a new initialization or data migration so that
it can all be done in one transaction. You must first deploy a copy of the new implementation
contract, which is automatically paused by its constructor to help avoid accidental calls directly
to the proxy contract.

## Bytecode verification

The proxy contract and implementation contracts are verified on etherscan at the following links:
_etherscan token link_

Because the implementation address in the proxy is a private variable,
verifying that this is the proxy being used requires reading contract
storage directly. This can be done using a mainnet node, such as infura,
by pasting the network address in `truffle-config.js` and running

`truffle exec ./getImplementationAddress.js --network mainnet`

## Contract Tests

To run smart contract tests first start

`ganache-cli`

in another terminal

Then run

`make test-contracts`

You can also run `make test-contracts-coverage` to see a coverage report.
