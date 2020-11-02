# CARBON Treasury

## Smart Contract Specifications

The Treasury consists of two contracts:
- [token holding contract] (https://github.com/GenesysLabs/Treasury/blob/main/contracts/treasury.scilla)
- proxy contract (https://github.com/GenesysLabs/Treasury/blob/main/contracts/proxy.scilla)

The token holding contract is a simple smart contract that can accept and send multiple ZRC-2 tokens. The proxy contract is a typical relay contract that redirects all calls to the token holding contract. This allows upgrading the contract, as the original proxy can point to a newly deployed token contract.