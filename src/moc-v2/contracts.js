import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import * as dotenv from 'dotenv'

import {readJsonFile, fromContractPrecisionDecimals, formatTimestamp, formatVisibleValue} from '../utils.js'
import {addABIOMoC, addABIv2} from '../transaction.js'

import { contractStatus, userBalance, registryAddresses } from './multicall.js'

dotenv.config()

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN })

const readContracts = async (web3, configProject) => {
  const appProject = configProject.appProject

  const dContracts = {}
  dContracts.json = {}
  dContracts.contracts = {}
  dContracts.contractsAddresses = {}

  dContracts.json.Multicall2 = readJsonFile(`./abis/${appProject}/Multicall2.json`)
  dContracts.json.TokenPegged = readJsonFile(`./abis/${appProject}/TokenPegged.json`)
  dContracts.json.CollateralToken = readJsonFile(`./abis/${appProject}/CollateralToken.json`)
  dContracts.json.IPriceProvider = readJsonFile(`./abis/${appProject}/IPriceProvider.json`)
  dContracts.json.Moc = readJsonFile(`./abis/${appProject}/Moc.json`)
  dContracts.json.MocVendors = readJsonFile(`./abis/${appProject}/MocVendors.json`)
  dContracts.json.MocQueue = readJsonFile(`./abis/${appProject}/MocQueue.json`)
  dContracts.json.FeeToken = readJsonFile(`./abis/${appProject}/FeeToken.json`)
  dContracts.json.CollateralAsset = readJsonFile(`./abis/${appProject}/CollateralAsset.json`)

  // OMOC Contracts
  dContracts.json.IRegistry = readJsonFile('./abis/omoc/IRegistry.json')
  dContracts.json.IStakingMachine = readJsonFile('./abis/omoc/IStakingMachine.json')
  dContracts.json.IDelayMachine = readJsonFile('./abis/omoc/IDelayMachine.json')
  dContracts.json.ISupporters = readJsonFile('./abis/omoc/ISupporters.json')
  dContracts.json.IVestingMachine = readJsonFile('./abis/omoc/IVestingMachine.json')
  dContracts.json.IVotingMachine = readJsonFile('./abis/omoc/IVotingMachine.json')
  dContracts.json.IVestingFactory = readJsonFile('./abis/omoc/IVestingFactory.json')
  dContracts.json.IERC20 = readJsonFile('./abis/omoc/IERC20.json')

  console.log('Reading Multicall2 Contract... address: ', process.env.CONTRACT_MULTICALL2)
  dContracts.contracts.multicall = new web3.eth.Contract(dContracts.json.Multicall2.abi, process.env.CONTRACT_MULTICALL2)

  dContracts.contracts.TP = []
  const contractTP = process.env.CONTRACT_TP.split(",")
  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    console.log(`Reading ${configProject.tokens.TP[i].name} Token Contract... address: `, contractTP[i])
    dContracts.contracts.TP.push(new web3.eth.Contract(dContracts.json.TokenPegged.abi, contractTP[i]))
  }

  dContracts.contracts.CA = []
  const contractCA = process.env.CONTRACT_CA.split(",")
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    console.log(`Reading ${configProject.tokens.CA[i].name} Token Contract... address: `, contractCA[i])
    dContracts.contracts.CA.push(new web3.eth.Contract(dContracts.json.CollateralAsset.abi, contractCA[i]))
  }

  dContracts.contracts.PP_TP = []
  const contractPPTP = process.env.CONTRACT_PRICE_PROVIDER_TP.split(",")
  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    console.log(`Reading Price Provider ${configProject.tokens.TP[i].name} Contract... address: `, contractPPTP[i])
    dContracts.contracts.PP_TP.push(new web3.eth.Contract(dContracts.json.IPriceProvider.abi, contractPPTP[i]))
  }

  dContracts.contracts.PP_CA = []
  const contractPPCA = process.env.CONTRACT_PRICE_PROVIDER_CA.split(",")
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    console.log(`Reading Price Provider ${configProject.tokens.CA[i].name} Tokens Contract... address: `, contractPPCA[i])
    dContracts.contracts.PP_CA.push(new web3.eth.Contract(dContracts.json.IPriceProvider.abi, contractPPCA[i]))
  }

  console.log('Reading Coinbase PP Contract... address: ', process.env.CONTRACT_PRICE_PROVIDER_COINBASE)
  dContracts.contracts.PP_COINBASE = new web3.eth.Contract(dContracts.json.IPriceProvider.abi, process.env.CONTRACT_PRICE_PROVIDER_COINBASE)

  console.log('Reading Moc Contract... address: ', process.env.CONTRACT_MOC)
  dContracts.contracts.Moc = new web3.eth.Contract(dContracts.json.Moc.abi, process.env.CONTRACT_MOC)

  console.log('Reading Collateral Token Contract... address: ', process.env.CONTRACT_TC)
  dContracts.contracts.CollateralToken = new web3.eth.Contract(dContracts.json.CollateralToken.abi, process.env.CONTRACT_TC)

  console.log('Reading MocVendors Contract... address: ', process.env.CONTRACT_MOC_VENDORS)
  dContracts.contracts.MocVendors = new web3.eth.Contract(dContracts.json.MocVendors.abi, process.env.CONTRACT_MOC_VENDORS)

  console.log('Reading MocQueue Contract... address: ', process.env.CONTRACT_MOC_QUEUE)
  dContracts.contracts.MocQueue = new web3.eth.Contract(dContracts.json.MocQueue.abi, process.env.CONTRACT_MOC_QUEUE)

  console.log('Reading Fee Token Contract... address: ', process.env.CONTRACT_FEE_TOKEN)
  dContracts.contracts.FeeToken = new web3.eth.Contract(dContracts.json.FeeToken.abi, process.env.CONTRACT_FEE_TOKEN)

  console.log('Reading Fee Token PP Contract... address: ', process.env.CONTRACT_PRICE_PROVIDER_FEE_TOKEN)
  dContracts.contracts.PP_FeeToken = new web3.eth.Contract(dContracts.json.IPriceProvider.abi, process.env.CONTRACT_PRICE_PROVIDER_FEE_TOKEN)

  console.log('Reading FC_MAX_ABSOLUTE_OP_PROVIDER... address: ', process.env.CONTRACT_FC_MAX_ABSOLUTE_OP_PROVIDER)
  dContracts.contracts.FC_MAX_ABSOLUTE_OP_PROVIDER = new web3.eth.Contract(dContracts.json.IPriceProvider.abi, process.env.CONTRACT_FC_MAX_ABSOLUTE_OP_PROVIDER)

  console.log('Reading FC_MAX_OP_DIFFERENCE_PROVIDER... address: ', process.env.CONTRACT_FC_MAX_OP_DIFFERENCE_PROVIDER)
  dContracts.contracts.FC_MAX_OP_DIFFERENCE_PROVIDER = new web3.eth.Contract(dContracts.json.IPriceProvider.abi, process.env.CONTRACT_FC_MAX_OP_DIFFERENCE_PROVIDER)

  console.log('Reading OMOC: IRegistry Contract... address: ', process.env.CONTRACT_IREGISTRY)
  dContracts.contracts.iregistry = new web3.eth.Contract(dContracts.json.IRegistry.abi, process.env.CONTRACT_IREGISTRY)

  // Read contracts addresses from registry
  const registryAddr = await registryAddresses(web3, dContracts)

  console.log('Reading OMOC: IStakingMachine Contract... address: ', registryAddr['MOC_STAKING_MACHINE'])
  dContracts.contracts.istakingmachine = new web3.eth.Contract(dContracts.json.IStakingMachine.abi, registryAddr['MOC_STAKING_MACHINE'])

  console.log('Reading OMOC: IDelayMachine Contract... address: ', registryAddr['MOC_DELAY_MACHINE'])
  dContracts.contracts.idelaymachine = new web3.eth.Contract(dContracts.json.IDelayMachine.abi, registryAddr['MOC_DELAY_MACHINE'])

  console.log('Reading OMOC: ISupporters Contract... address: ', registryAddr['SUPPORTERS_ADDR'])
  dContracts.contracts.isupporters = new web3.eth.Contract(dContracts.json.ISupporters.abi, registryAddr['SUPPORTERS_ADDR'])

  console.log('Reading OMOC: IVestingFactory Contract... address: ', registryAddr['MOC_VESTING_MACHINE'])
  dContracts.contracts.ivestingfactory = new web3.eth.Contract(dContracts.json.IVestingFactory.abi, registryAddr['MOC_VESTING_MACHINE'])

  // reading vesting machine from environment address
  if (typeof process.env.CONTRACT_OMOC_VESTING_ADDRESS !== 'undefined') {
    console.log('Reading OMOC: IVestingMachine Contract... address: ', process.env.CONTRACT_OMOC_VESTING_ADDRESS)
    dContracts.contracts.ivestingmachine = new web3.eth.Contract(dContracts.json.IVestingMachine.abi, process.env.CONTRACT_OMOC_VESTING_ADDRESS)
  }

  console.log('Reading OMOC: IVotingMachine Contract... address: ', registryAddr['MOC_VOTING_MACHINE'])
  dContracts.contracts.ivotingmachine = new web3.eth.Contract(dContracts.json.IVotingMachine.abi, registryAddr['MOC_VOTING_MACHINE'])

  console.log('Reading OMOC: Token Govern Contract... address: ', registryAddr['MOC_TOKEN'])
  dContracts.contracts.tg = new web3.eth.Contract(dContracts.json.IERC20.abi, registryAddr['MOC_TOKEN'])

  // Add to abi decoder
  addABIv2(dContracts)
  addABIOMoC(dContracts)

  return dContracts
}

const totalSupplyTP = (contractStatus, config) => {
  let result = ''
  for (let i = 0; i < config.tokens.TP.length; i++) {
    result += `Total supply of ${config.tokens.TP[i].name}:  ${Web3.utils.fromWei(contractStatus.pegContainer[i])} `
    if (i + 1 < config.tokens.TP.length) {
      result += '\n'
    }
  }
  return result
}

const totalSupplyCA = (contractStatus, config) => {
  let result = ''
  for (let i = 0; i < config.tokens.CA.length; i++) {
    result += `Total supply of ${config.tokens.CA[i].name}:  ${fromContractPrecisionDecimals(contractStatus.getACBalance[i], config.tokens.CA[i].decimals).toString()} `
    if (i + 1 < config.tokens.CA.length) {
      result += '\n'
    }
  }
  return result
}

const pricesTP = (contractStatus, config) => {
  let result = ''
  for (let i = 0; i < config.tokens.TP.length; i++) {
    result += `Price ${config.tokens.TP[i].name}:  ${Web3.utils.fromWei(contractStatus.PP_TP[i])} `
    if (i + 1 < config.tokens.TP.length) {
      result += '\n'
    }
  }
  return result
}

const pricesCA = (contractStatus, config) => {
  let result = ''
  for (let i = 0; i < config.tokens.CA.length; i++) {
    result += `Price ${config.tokens.CA[i].name}:  ${Web3.utils.fromWei(contractStatus.PP_CA[i])} `
    if (i + 1 < config.tokens.CA.length) {
      result += '\n'
    }
  }
  return result
}

const targetCoverageTP = (contractStatus, config) => {
  let result = ''
  for (let i = 0; i < config.tokens.TP.length; i++) {
    result += `${config.tokens.TP[i].name} Target Coverage:  ${Web3.utils.fromWei(contractStatus.tpCtarg[i])} `
    if (i + 1 < config.tokens.TP.length) {
      result += '\n'
    }
  }
  return result
}

const availableToMintTP = (contractStatus, config) => {
  let result = ''
  for (let i = 0; i < config.tokens.TP.length; i++) {

    result += `${config.tokens.TP[i].name} available to mint:  ${ contractStatus.getTPAvailableToMint[i] === 0 ? '--' : Web3.utils.fromWei(contractStatus.getTPAvailableToMint[i])} `

    if (i + 1 < config.tokens.TP.length) {
      result += '\n'
    }
  }
  return result
}

const emaTP = (contractStatus, config) => {
  let result = ''
  for (let i = 0; i < config.tokens.TP.length; i++) {
    result += `${config.tokens.TP[i].name} EMA:  ${Web3.utils.fromWei(contractStatus.tpEma[i])} `
    if (i + 1 < config.tokens.TP.length) {
      result += '\n'
    }
  }
  return result
}

const feeTP = (contractStatus, config) => {
  let result = ''
  for (let i = 0; i < config.tokens.TP.length; i++) {
    result += `Mint ${config.tokens.TP[i].name} Fee:  ${Web3.utils.fromWei(contractStatus.tpMintFees[i])} \n`
    result += `Redeem ${config.tokens.TP[i].name} Fee:  ${Web3.utils.fromWei(contractStatus.tpRedeemFees[i])} `
    if (i + 1 < config.tokens.TP.length) {
      result += '\n'
    }
  }
  return result
}

const renderContractStatus = (contractStatus, config) => {
  let render = `
Contract Status
===============

Total amount of Collateral Asset held in the Collateral Bag (nACcb): ${Web3.utils.fromWei(contractStatus.nACcb)}
Collateral Token in the Collateral Bag (nTCcb): ${Web3.utils.fromWei(contractStatus.nTCcb)} 
${totalSupplyTP(contractStatus, config)}
${totalSupplyCA(contractStatus, config)}

Prices
======

${pricesTP(contractStatus, config)} 
${pricesCA(contractStatus, config)} 
Price Tec ${config.tokens.TC.name}:  ${Web3.utils.fromWei(contractStatus.getPTCac)}
Price ${config.tokens.FeeToken.name}:  ${Web3.utils.fromWei(contractStatus.PP_FeeToken)}
Price Wrapped Token:  ${contractStatus.getTokenPrice}


Coverage & Leverage
===================

Bucket global coverage: ${Web3.utils.fromWei(contractStatus.getCglb)}
Target coverage adjusted by all Pegged Token's to Collateral Asset rate moving average (CtargemaCA): ${Web3.utils.fromWei(contractStatus.calcCtargemaCA)}
${targetCoverageTP(contractStatus, config)} 
${config.tokens.TC.name} Leverage:  ${new BigNumber(contractStatus.getLeverageTC).gt(10000000000000000000000) ? '+Inf' : Web3.utils.fromWei(contractStatus.getLeverageTC)}


Available
=========

${config.tokens.TC.name} available to redeem:  ${Web3.utils.fromWei(contractStatus.getTCAvailableToRedeem)}
${availableToMintTP(contractStatus, config)} 
Total Collateral available:  ${Web3.utils.fromWei(contractStatus.getTotalACavailable)}


EMA
====

${emaTP(contractStatus, config)}
Block next calculation: ${contractStatus.nextEmaCalculation}
EMA Block Span: ${contractStatus.emaCalculationBlockSpan}
Should Calculate EMA: ${contractStatus.shouldCalculateEma}


Contract Params
===============
 
Contract Protected threshold <: ${Web3.utils.fromWei(contractStatus.protThrld)}
Contract Liquidation threshold <: ${Web3.utils.fromWei(contractStatus.liqThrld)}
Contract Liquidation enabled: ${contractStatus.liqEnabled}
Contract Liquidated: ${contractStatus.liquidated}
Contract is Liquidation Reached: ${contractStatus.isLiquidationReached}


Settlement
==========

Nº of blocks between settlements: ${contractStatus.bes}
Next settlement block: ${contractStatus.bns}
Nº of blocks remaining for settlement: ${contractStatus.getBts}


Fees
====

Fee Flow Address: ${contractStatus.mocFeeFlowAddress}
Success Fee: ${Web3.utils.fromWei(contractStatus.successFee)}
Appreciation Factor: ${Web3.utils.fromWei(contractStatus.appreciationFactor)}
Fee Retainer: ${Web3.utils.fromWei(contractStatus.feeRetainer)}
Token Collateral Mint Fee: ${Web3.utils.fromWei(contractStatus.tcMintFee)}
Token Collateral Redeem Fee: ${Web3.utils.fromWei(contractStatus.tcRedeemFee)}
Swap TP x TP Fee: ${Web3.utils.fromWei(contractStatus.swapTPforTPFee)}
Swap TP x TC Fee: ${Web3.utils.fromWei(contractStatus.swapTPforTCFee)}
Redeem TC & TP Fee: ${Web3.utils.fromWei(contractStatus.redeemTCandTPFee)}
Mint TC & TP Fee: ${Web3.utils.fromWei(contractStatus.mintTCandTPFee)}
${feeTP(contractStatus, config)}
Blockheight: ${contractStatus.blockHeight} 


Vendors
=======

Guardian Address: ${contractStatus.vendorGuardianAddress}
Vendor Markup: ${Web3.utils.fromWei(contractStatus.vendorMarkup)}


Fee Token
=========

Fee Token Name: ${config.tokens.FeeToken.name}
Fee Token %: ${Web3.utils.fromWei(contractStatus.feeTokenPct)}
Fee Token Address: ${contractStatus.feeToken}
Fee Token Price Provider: ${contractStatus.feeTokenPriceProvider}
       

Token Collateral Interest
=========================

Collector Address: ${contractStatus.tcInterestCollectorAddress}
Interest Rate: ${Web3.utils.fromWei(contractStatus.tcInterestRate)}
Block Span: ${contractStatus.tcInterestPaymentBlockSpan}
Next Payment Block: ${contractStatus.nextTCInterestPayment}


Flux Capacitor
==============

Max Absolute Op Provider: ${contractStatus.maxAbsoluteOpProvider}
Max Absolute Op: ${Web3.utils.fromWei(contractStatus.FC_MAX_ABSOLUTE_OP)}
Max Op Diff Provider: ${contractStatus.maxOpDiffProvider}
Max Op Diff: ${Web3.utils.fromWei(contractStatus.FC_MAX_OP_DIFFERENCE)}
Decay Block Span: ${contractStatus.decayBlockSpan}
Absolute Accumulator: ${Web3.utils.fromWei(contractStatus.absoluteAccumulator)}
Differential Accumulator: ${Web3.utils.fromWei(contractStatus.differentialAccumulator)}
Last operational Block Number: ${contractStatus.lastOperationBlockNumber}
maxQACToMintTP: ${Web3.utils.fromWei(contractStatus.maxQACToMintTP)}
maxQACToRedeemTP: ${Web3.utils.fromWei(contractStatus.maxQACToRedeemTP)}


Queue
=====

Locked in pending: ${Web3.utils.fromWei(contractStatus.qACLockedInPending)}
Operation Id Count: ${contractStatus.operIdCount}
First Operation ID: ${contractStatus.firstOperId}
Min Operation Waiting Blk: ${contractStatus.minOperWaitingBlk}


Queue Fees
==========

tcMintExecFee: ${Web3.utils.fromWei(contractStatus.tcMintExecFee)}
tcRedeemExecFee: ${Web3.utils.fromWei(contractStatus.tcRedeemExecFee)}
tpMintExecFee: ${Web3.utils.fromWei(contractStatus.tpMintExecFee)}
tpRedeemExecFee: ${Web3.utils.fromWei(contractStatus.tpRedeemExecFee)}
swapTPforTPExecFee: ${Web3.utils.fromWei(contractStatus.swapTPforTPExecFee)}
swapTPforTCExecFee: ${Web3.utils.fromWei(contractStatus.swapTPforTCExecFee)}
swapTCforTPExecFee: ${Web3.utils.fromWei(contractStatus.swapTCforTPExecFee)}
redeemTCandTPExecFee: ${Web3.utils.fromWei(contractStatus.redeemTCandTPExecFee)}
mintTCandTPExecFee: ${Web3.utils.fromWei(contractStatus.mintTCandTPExecFee)}


OMOC Staking Machine
====================
 
Withdraw Lock Time: ${contractStatus.stakingmachine.getWithdrawLockTime} 
Supporters: ${contractStatus.stakingmachine.getSupporters} 
Oracle Manager: ${contractStatus.stakingmachine.getOracleManager} 
Delay Machine: ${contractStatus.stakingmachine.getDelayMachine} 


OMOC Delay Machine
==================
 
Last Id: ${contractStatus.delaymachine.getLastId} 
Source: ${contractStatus.delaymachine.getSource}


OMOC Supporters
===============

Ready to distribuite: ${contractStatus.supporters.isReadyToDistribute} 
Moc Token: ${contractStatus.supporters.mocToken} 
Period: ${contractStatus.supporters.period} 
Total MoC: ${Web3.utils.fromWei(contractStatus.supporters.totalMoc)} 
Total Token: ${Web3.utils.fromWei(contractStatus.supporters.totalToken)}


OMOC VESTING FACTORY
====================

Is TGE configured: ${contractStatus.vestingfactory.isTGEConfigured} 
Get TGE Timestamp: ${contractStatus.vestingfactory.getTGETimestamp}

          `
  if (typeof process.env.CONTRACT_OMOC_VESTING_ADDRESS !== 'undefined') {
    render += `
VESTING MACHINE
===============

Get Holder: ${contractStatus.vestingmachine.getHolder}
Get Locked: ${Web3.utils.fromWei(contractStatus.vestingmachine.getLocked)}
Get Available: ${Web3.utils.fromWei(contractStatus.vestingmachine.getAvailable)}
Is Verified: ${contractStatus.vestingmachine.isVerified}
Get Total: ${Web3.utils.fromWei(contractStatus.vestingmachine.getTotal)}
Balance: ${Web3.utils.fromWei(contractStatus.vestingmachine.tgBalance)}

VESTING PARAMETERS
==================
    `
    render += renderVestingParameters(contractStatus)
  }



  return render
}


const renderVestingParameters = (contractStatus) => {
  const getParameters = contractStatus.vestingmachine.getParameters
  const tgeTimestamp = contractStatus.vestingfactory.getTGETimestamp
  const total = contractStatus.vestingmachine.getTotal
  const percentMultiplier = 10000

  const percentages = getParameters.percentages
  const timeDeltas = getParameters.timeDeltas
  const deltas = [...timeDeltas]
  if (timeDeltas && !new BigNumber(timeDeltas[0]).isZero()) {
    deltas.unshift(new BigNumber(0))
  }
  const percents = percentages.map((x) => new BigNumber(percentMultiplier).minus(x))
  if (percentages && !new BigNumber(percentages[percentages.length - 1]).isZero()) {
    percents.push(new BigNumber(percentMultiplier))
  }

  let dates = []
  if (deltas) {
    if (tgeTimestamp) {
      // Convert timestamp to date.
      dates = deltas.map(x => formatTimestamp(new BigNumber(tgeTimestamp).plus(x).times(1000).toNumber()))
    } else {
      dates = deltas.map(x => x / 60 / 60 / 24)
    }
  }

  let table = ''
  if (getParameters) {
    let itemIndex = 0
    for (const percent of percents) {
      let strTotal = ''
      if (total && !new BigNumber(total).isZero()) {
        strTotal = new BigNumber(percent).times(total).div(percentMultiplier)
      }
      table += `
${dates[itemIndex]} | ${(percent.toNumber() / percentMultiplier * 100).toFixed(2)} % | ${formatVisibleValue(strTotal, 2)} `
      itemIndex += 1
    }
  }

  return `
${table} 
    `
}


const userBalanceAllowanceCA = (userBalance, config) => {
  let result = ''
  for (let i = 0; i < config.tokens.CA.length; i++) {
    result += `${config.tokens.CA[i].name} Balance: ${fromContractPrecisionDecimals(userBalance.CA[i].balance, config.tokens.CA[i].decimals).toString()} ${config.tokens.CA[i].name} \n`
    result += `${config.tokens.CA[i].name} Allowance: ${fromContractPrecisionDecimals(userBalance.CA[i].allowance, config.tokens.CA[i].decimals).toString()} ${config.tokens.CA[i].name} `

    if (i + 1 < config.tokens.CA.length) {
      result += '\n'
    }
  }
  return result
}

const userBalanceAllowanceTP = (userBalance, config) => {
  let result = ''
  for (let i = 0; i < config.tokens.TP.length; i++) {
    result += `${config.tokens.TP[i].name} Balance: ${fromContractPrecisionDecimals(userBalance.TP[i].balance, config.tokens.TP[i].decimals).toString()} ${config.tokens.TP[i].name} `
    if (i + 1 < config.tokens.TP.length) {
      result += '\n'
    }
    // result += `${config.tokens.TP[i].name} Allowance: ${fromContractPrecisionDecimals(userBalance.TP[i].allowance, config.tokens.TP[i].decimals).toString()} ${config.tokens.TP[i].name} \n`
  }
  return result
}

const renderUserBalance = (userBalance, config) => {
  const render = `
User: ${userBalance.userAddress}

${config.tokens.COINBASE.name} Balance: ${fromContractPrecisionDecimals(userBalance.coinbase, config.tokens.COINBASE.decimals).toString()} ${config.tokens.COINBASE.name}
${userBalanceAllowanceCA(userBalance, config)}
${userBalanceAllowanceTP(userBalance, config)}
${config.tokens.TC.name} Balance: ${fromContractPrecisionDecimals(userBalance.TC.balance, config.tokens.TC.decimals).toString()} ${config.tokens.TC.name}
${config.tokens.TC.name} Allowance: ${fromContractPrecisionDecimals(userBalance.TC.allowance, config.tokens.TC.decimals).toString()} ${config.tokens.TC.name}
${config.tokens.FeeToken.name} Balance: ${fromContractPrecisionDecimals(userBalance.FeeToken.balance, config.tokens.FeeToken.decimals).toString()} ${config.tokens.FeeToken.name}
${config.tokens.FeeToken.name} Allowance: ${fromContractPrecisionDecimals(userBalance.FeeToken.allowance, config.tokens.FeeToken.decimals).toString()} ${config.tokens.FeeToken.name}

OMOC
====

Staking Machine Balance: ${fromContractPrecisionDecimals(userBalance.stakingmachine.getBalance, config.tokens.FeeToken.decimals).toString()} ${config.tokens.FeeToken.name}
Staking Machine Locked Balance: ${fromContractPrecisionDecimals(userBalance.stakingmachine.getLockedBalance, config.tokens.FeeToken.decimals).toString()} ${config.tokens.FeeToken.name}
Delay Machine Balance: ${fromContractPrecisionDecimals(userBalance.delaymachine.getBalance, config.tokens.FeeToken.decimals).toString()} ${config.tokens.FeeToken.name}
${config.tokens.FeeToken.name} Balance: ${fromContractPrecisionDecimals(userBalance.tgBalance, config.tokens.FeeToken.decimals).toString()} ${config.tokens.FeeToken.name}
${config.tokens.FeeToken.name} Staking Machine Allowance: ${fromContractPrecisionDecimals(userBalance.stakingmachine.tgAllowance, config.tokens.FeeToken.decimals).toString()} ${config.tokens.FeeToken.name}

    `

  return render
}

const statusFromContracts = async (web3, dContracts, configProject) => {
  // Read current status info from different
  const dataContractStatus = await contractStatus(web3, dContracts, configProject)

  console.log('\x1b[35m%s\x1b[0m', 'Contract Status')
  console.log()
  console.log('\x1b[32m%s\x1b[0m', renderContractStatus(dataContractStatus, configProject))

  return dataContractStatus
}

const userBalanceFromContracts = async (web3, dContracts, configProject, userAddress) => {
  // Get user token and allowances balance
  const userBalanceStats = await userBalance(web3, dContracts, userAddress, configProject)
  console.log()
  console.log('\x1b[32m%s\x1b[0m', renderUserBalance(userBalanceStats, configProject))

  return userBalanceStats
}

export {
  contractStatus,
  userBalance,
  readContracts,
  renderUserBalance,
  renderContractStatus,
  statusFromContracts,
  userBalanceFromContracts
}
