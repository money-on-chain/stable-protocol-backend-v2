# Money on Chain Integration v2

## Warning: This is only for version 2 of the main contracts.

Money on chain token operations (backend to contracts)

* Mint / Redeem Pegged Token (TP): Ex.: DoC, USDRIF, FARS, FMXN (depends on the project)
* Mint / Redeem Collateral Token (TC): Ex.: BPro, RIFP, GoTurbo
* Allowance to use Collateral Asset
* Status of Main MoC Contracts
* "Governanza" operations

**Tokens**

| Token     | Name             | Ex.                     |                   |
|-----------|------------------|-------------------------|-------------------|
| TP        | Token Pegged     | DOC, USDRIF, FARS, FMXN | Pegged token      |
| TC        | Collateral Token | BPRO, RIFP, GoTurbo     | HODL + Earn Token |
| Fee Token | Fee Token        | MOC                     | Fee Token         |


### Setup

1. `nvm use`
2. `npm install`
3. Clone `.env.flipagoRskTestnet` and save it as `.env` ... use environment you want to use please refer environment table
4. Fill in wallet address and private key (it needs some testnet RBTC) in that file.



#### Money on Chain projects and tokens 

| Token      | Token name       | Project  | Token Name | Collateral   |
|------------|------------------|----------|------------|--------------|
| TP         | Pegged Token 1:1 | MOC      | DOC        | RBTC         |
| TC         | Collateral Token | MOC      | BPRO       | RBTC         |
| Fee Token  | Fee Token        | MOC      | MOC        | -            |
| TP         | Pegged Token 1:1 | ROC      | USDRIF     | RIF          |
| TC         | Collateral Token | ROC      | RIFP       | RIF          |
| Fee Token  | Fee Token        | ROC      | MOC        | -            |
| TP         | Pegged Token 1:1 | Flipago  | FARS, FMXN | DOC, USDRIF  |
| TC         | Collateral Token | Flipago  | GoTurbo    | DOC, USDRIF  |
| Fee Token  | Fee Token        | Flipago  | MOC        | -            |

#### Environment table

Environment is our already deployed contracts. 

| Network Name      | Project | Environment          | Network    |
|-------------------|---------|----------------------|------------|
| flipagoRskTestnet | Flipago | Flipago Testnet RSK  | Testnet    |


### Faucets

In testnet you may need some test tRIF o tRBTC

* **Faucet tRBTC**: https://faucet.rsk.co/
* **Faucet tRIF**: https://faucet.rifos.org/



### How to run scripts


| Command                      | Action                                        | Obs | 
|------------------------------|-----------------------------------------------|-----|
| node scripts/allowance-ca.js | Allowance to use Collateral Asset in Contract |     |
| node scripts/tp-mint.js      | Mint TP depend of the environment             |     |
| node scripts/tp-redeem.js    | Redeem TP depend of the environment           |     |
| node scripts/tc-mint.js      | Mint TC depend of the environment             |     |
| node scripts/tc-redeem.js    | Redeem TC depend of the environment           |     |


Example Contract status:

`node scripts/contract-status.js`

Result:

```
 node scripts/contract-status.js
Reading Multicall2 Contract... address:  0xaf7be1ef9537018feda5397d9e3bb9a1e4e27ac8
Reading GoARS Token Contract... address:  0x1C25c283e47F2d9d3238a72991B7b7da014aC73e
Reading GoMXN Token Contract... address:  0x8Cd0aBB6C73A3374FCEacDB5C1Fa125bb5E08c32
Reading DOC Token Contract... address:  0xCB46c0ddc60D18eFEB0E586C17Af6ea36452Dae0
Reading USDRIF Token Contract... address:  0xC3De9F38581f83e281f260d0DdbaAc0e102ff9F8
Reading Price Provider GoARS Contract... address:  0xD1AFe67986523447b3426Ac2Fb8be2EE4aF5dad7
Reading Price Provider GoMXN Contract... address:  0x6951020041bFA2565877BF0eaF7f5DF039b490dC
Reading Price Provider DOC Tokens Contract... address:  0x0e8E63721E49dbde105a4085b3D548D292Edf38A
Reading Price Provider USDRIF Tokens Contract... address:  0x0e8E63721E49dbde105a4085b3D548D292Edf38A
Reading MocCABag Contract... address:  0x2781df266eE4A5A678074227027d945a6c53BdB6
Reading MocCAWrapper Contract... address:  0x01efe9D03982cEBFaB1ca85E6c8f78380cfDc41f
Reading CollateralTokenCABag Contract... address:  0x1f5106C6Fcf9Cc83204B3fd330B340f2718DA11D
Reading contract status ...
Contract Status

Contract Status
===============

Total amount of Collateral Asset held in the Collateral Bag (nACcb): 430.57477547079609387
Collateral Token in the Collateral Bag (nTCcb): 377.856725850890766725
Total supply of GoARS:  21253.27845
Total supply of GoMXN:  105
Total supply of DOC:  221.163205955924558144
Total supply of USDRIF:  210.347190242937401722


Prices
======

Price GoARS:  972.15
Price GoMXN:  18.253418
Price DOC:  1
Price USDRIF:  1
Price GoTURBO:  1.053329260427303511
Price Wrapped Token:  1


Coverage & Leverage
===================

Bucket global coverage: 15.412998335424735914
Target coverage adjusted by all Pegged Token's to Collateral Asset rate moving average (CtargemaCA): 3.021643451365846932
GoARS Target Coverage:  1.3
GoMXN Target Coverage:  1.3
GoTURBO Leverage:  1.069381816102910904


Available
=========

GoTURBO available to redeem:  324.856541045937595296
GoARS available to mint:  134424.018881108232673372
GoMXN available to mint:  20819.903338652862247469
Total Collateral available:  425.62203192355877138


EMA
====

GoARS EMA:  353.493213948690459564
GoMXN EMA:  19.451499198587908075
Block next calculation: 4378278
EMA Block Span: 2880
Should Calculate EMA: true


Contract Params
===============
 
Contract Protected threshold <: 1.5
Contract Liquidation threshold <: 1.04
Contract Liquidation enabled: false
Contract Liquidated: false
Contract is Liquidation Reached: false


Settlement
==========

Nº of blocks between settlements: 2880
Next settlement block: 3475719
Nº of blocks remaining for settlement: 0


Fees
====

Success Fee: 0.2
Appreciation Factor: 0
Fee Retainer: 0.1
Token Collateral Mint Fee: 0.001
Token Collateral Redeem Fee: 0.001
Swap TP x TP Fee: 0.001
Swap TP x TC Fee: 0.001
Redeem TC & TP Fee: 0.001
Mint TC & TP Fee: 0.001
Mint GoARS Fee:  0.01
Mint GoMXN Fee:  0.01
Redeem GoARS Fee:  0.01
Redeem GoMXN Fee:  0.01
Blockheight: 4399130  
    
Reading user balance ... account: 0xb5e2bed9235b6366fa0254c2e6754e167e0a2383
User Balance: 0xb5e2bed9235b6366fa0254c2e6754e167e0a2383


User: undefined

RBTC Balance: 0.082309577214112371 RBTC
DOC Balance: 793.425634215325640154 DOC
DOC Allowance: 997.34418662628384594 DOC
USDRIF Balance: 12706.160701352026791452 USDRIF
USDRIF Allowance: 997.993179648404697811 USDRIF
GoARS Balance: 610 GoARS
GoMXN Balance: 55 GoMXN
GoTURBO Balance: 17.999407759344045756 GoTURBO
GoTURBO Allowance: 998.999407759344045756 GoTURBO

```