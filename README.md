# Money on Chain Integration v2

## Warning: This is only for version 2 of the main contracts.

Money on chain token operations (backend to contracts)

* Mint / Redeem Pegged Token (TP): Ex.: USDRIF, GOARS, GOCOP (depends on the project)
* Mint / Redeem Collateral Token (TC): Ex.: RIFP, GoTurbo
* Allowance to use Collateral Asset
* Status of Main MoC Contracts
* Admin operations: Ex. Execute settlement, calculate EMA, Vendor, etc.


**Tokens**

| Token     | Name             | Ex.                  |                   |
|-----------|------------------|----------------------|-------------------|
| TP        | Token Pegged     | USDRIF, GOARS, GOCOP | Pegged token      |
| TC        | Collateral Token | RIFP, GoTurbo        | HODL + Earn Token |
| Fee Token | Fee Token        | MOC, FLIP            | Pay w/ Fee Token  |


### Setup

1. `nvm use`
2. `npm install`
3. Clone `.env.flipagoRskTestnet` and save it as `.env` ... use environment you want to use please refer environment table
4. Fill in wallet address and private key (it needs some testnet RBTC) in that file.



#### Money on Chain projects and tokens 

| Token      | Token name       | Project       | Token Name    | Collateral |
|------------|------------------|---------------|---------------|------------|
| TP         | Pegged Token 1:1 | ROC           | USDRIF        | RIF        |
| TC         | Collateral Token | ROC           | RIFP          | RIF        |
| Fee Token  | Fee Token        | ROC           | MOC           | -          |
| TP         | Pegged Token 1:1 | Flipago RC20  | GOARS, GOCOP  | BPRO       |
| TC         | Collateral Token | Flipago RC20  | GoTurbo       | BPRO       |
| Fee Token  | Fee Token        | Flipago RC20  | FLIP          | -          |


#### Money on Chain projects and Collateral types


| Project   | Name           | Collateral Type | Collateral |
|-----------|----------------|-----------------|------------|
| Flipago   | Flipago RC20   | RC20            | BPRO       |
| ROC       | RoC            | RC20            | RIF        |



#### Environment table

Environment is our already deployed contracts. 

| Network Name                   | Project | Environment                          | Network    |
|--------------------------------|---------|--------------------------------------|------------|
| flipagoRskTestnet              | Flipago | Flipago Testnet RSK                  | Testnet    |
| rocRskTestnet                  | ROC     | Rif on Chain Testnet RSK             | Testnet    |


### Faucets

In testnet you may need some test tRIF o tRBTC

* **Faucet tRBTC**: https://faucet.rsk.co/
* **Faucet tRIF**: https://faucet.rifos.org/


### How to run scripts

Example Contract status:

`node scripts/contract-status.js`

Result:

```
 node scripts/contract-status.js

Contract Status
===============

Total amount of Collateral Asset held in the Collateral Bag (nACcb): 52.06436453972232587
Collateral Token in the Collateral Bag (nTCcb): 50.993851282756313852
Total supply of GoARS:  59
Total supply of GoMXN:  18.0394335
Total supply of DOC:  47.153295591823618332
Total supply of USDRIF:  5.004989999999999997
....

```

Note before mint or redeem you need to make an allowance to contract like this

`node scripts/rc20/allowance-ca.js`

Example Mint TC in ROC project:

`node scripts/rc20/tc-mint.js`

Example Mint TC in Flipago RC20 project:

`node scripts/rc20/tc-mint.js`

