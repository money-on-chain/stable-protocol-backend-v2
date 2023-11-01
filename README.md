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

Contract Status
===============

Total amount of Collateral Asset held in the Collateral Bag (nACcb): 52.06436453972232587
Collateral Token in the Collateral Bag (nTCcb): 50.993851282756313852
Total supply of GoARS:  59
Total supply of GoMXN:  18.0394335
Total supply of DOC:  47.153295591823618332
Total supply of USDRIF:  5.004989999999999997


Prices
======

Price GoARS:  864.33
Price GoMXN:  18.22165
Price DOC:  1
Price USDRIF:  1
Price GoTURBO:  1.000240269983874036
Price FLIP:  0.5
Price Wrapped Token:  1


Coverage & Leverage
===================

Bucket global coverage: 49.198039287789139117
Target coverage adjusted by all Pegged Token's to Collateral Asset rate moving average (CtargemaCA): 1.442024021067767829
GoARS Target Coverage:  1.3
GoMXN Target Coverage:  1.3
GoTURBO Leverage:  1.020747731957082902


Available
=========

GoTURBO available to redeem:  50.52618688132398669
GoARS available to mint:  36571.102019555765053732
GoMXN available to mint:  2360.383478316282790692
Total Collateral available:  52.06436453972232587


EMA
====

GoARS EMA:  506.114447
GoMXN EMA:  17.0201938745
Block next calculation: 4446253
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
Next settlement block: 4432296
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
Blockheight: 4447461 


Vendors
=======

Guardian Address: 0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3


Fee Token
=========

Fee Token Name: FLIP
Fee Token %: 0.5
Fee Token Address: 0x45a97b54021a3F99827641AFe1BFAE574431e6ab
Fee Token Price Provider: 0x8DCE78BbD4D757EF7777Be113277cf5A35283b1E
       

Token Collateral Interest
=========================

Collector Address: 0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3
Interest Rate: 0.00005
Block Span: 20160
Next Payment Block: 4449576

          
Reading user balance ... account: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
User Balance: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3


User: undefined

RBTC Balance: 0.737351150982014835 RBTC
DOC Balance: 4414.056850735010043528 DOC
DOC Allowance: 9958.441015319228749012 DOC
USDRIF Balance: 588.785510128343550596 USDRIF
USDRIF Allowance: 0.99 USDRIF
GoARS Balance: 49 GoARS
GoMXN Balance: 18.0394335 GoMXN
GoTURBO Balance: 40.993851282756313852 GoTURBO
GoTURBO Allowance: 9996 GoTURBO
FLIP Balance: 29901.034356213713643989 FLIP
FLIP Allowance: 0 FLIP

```