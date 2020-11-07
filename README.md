# CARBON Treasury

## Smart Contract Specifications

The Treasury consists of two contracts:
- [token holding contract](https://github.com/GenesysLabs/Treasury/blob/main/contracts/treasury.scilla)
- [proxy contract](https://github.com/GenesysLabs/Treasury/blob/main/contracts/proxy.scilla)

The token holding contract (The Treasury) is a smart contract that has 2 primary functions. The proxy contract is a typical relay contract that redirects all calls to the token holding contract. This allows upgrading the contract, as the original proxy can point to a newly deployed token holding contract.

The primary functions of the The Treasury are:
- To provide an always available market for the buying and selling of its master token (see below)
- Acepting payment for goods and services provided by The Treasurys associated entity.

The Treasury will have a master token - that is the token that users can trade directly with the contract itself. The Treasury will always maintain price parity between ZIL and the master token. It does so, by adjusting the price based on the number of ZIL held and master tokens distributed. 

The Treasury can also accept payment for goods and services for the entity that the Treasury represents. When payment for goods and servies are made, the price for the master token increases. Payment can be made in either ZIL or the master token. 

Payment made in the master token, effectively takes that amount out of circulation and so increases the value of all remaining master tokens in circulation.

Payment made in ZIL increases the amount of ZIL held by the Treasury and as such also incraeses the value of all master tokens in circulation.