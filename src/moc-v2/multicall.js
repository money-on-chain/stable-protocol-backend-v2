import BigNumber from 'bignumber.js'
import { fromContractPrecisionDecimals } from '../utils.js'

const contractStatus = async (web3, dContracts, configProject) => {
  const collateral = configProject.collateral
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  const multicall = dContracts.contracts.multicall
  const Moc = dContracts.contracts.Moc
  const MocVendors = dContracts.contracts.MocVendors
  const PP_FeeToken = dContracts.contracts.PP_FeeToken
  const PP_COINBASE = dContracts.contracts.PP_COINBASE
  const MocQueue = dContracts.contracts.MocQueue
  const FC_MAX_ABSOLUTE_OP_PROVIDER = dContracts.contracts.FC_MAX_ABSOLUTE_OP_PROVIDER
  const FC_MAX_OP_DIFFERENCE_PROVIDER = dContracts.contracts.FC_MAX_OP_DIFFERENCE_PROVIDER


  console.log('Reading contract status ...')

  let listMethods = []
  listMethods.push([Moc.options.address, Moc.methods.protThrld().encodeABI(), 'uint256']) // 0
  listMethods.push([Moc.options.address, Moc.methods.liqThrld().encodeABI(), 'uint256']) // 1
  listMethods.push([Moc.options.address, Moc.methods.liqEnabled().encodeABI(), 'bool']) // 2
  listMethods.push([Moc.options.address, Moc.methods.liquidated().encodeABI(), 'bool']) // 3
  listMethods.push([Moc.options.address, Moc.methods.nACcb().encodeABI(), 'uint256']) // 4
  listMethods.push([Moc.options.address, Moc.methods.tcToken().encodeABI(), 'address']) // 5
  listMethods.push([Moc.options.address, Moc.methods.nTCcb().encodeABI(), 'uint256']) // 6
  listMethods.push([Moc.options.address, Moc.methods.successFee().encodeABI(), 'uint256']) // 7
  listMethods.push([Moc.options.address, Moc.methods.appreciationFactor().encodeABI(), 'uint256']) // 8
  listMethods.push([Moc.options.address, Moc.methods.feeRetainer().encodeABI(), 'uint256']) // 9
  listMethods.push([Moc.options.address, Moc.methods.tcMintFee().encodeABI(), 'uint256']) // 10
  listMethods.push([Moc.options.address, Moc.methods.tcRedeemFee().encodeABI(), 'uint256']) // 11
  listMethods.push([Moc.options.address, Moc.methods.swapTPforTPFee().encodeABI(), 'uint256']) // 12
  listMethods.push([Moc.options.address, Moc.methods.swapTPforTCFee().encodeABI(), 'uint256']) // 13
  listMethods.push([Moc.options.address, Moc.methods.swapTCforTPFee().encodeABI(), 'uint256']) // 14
  listMethods.push([Moc.options.address, Moc.methods.redeemTCandTPFee().encodeABI(), 'uint256']) // 15
  listMethods.push([Moc.options.address, Moc.methods.mintTCandTPFee().encodeABI(), 'uint256']) // 16
  listMethods.push([Moc.options.address, Moc.methods.mocFeeFlowAddress().encodeABI(), 'address']) // 17
  listMethods.push([Moc.options.address, Moc.methods.mocAppreciationBeneficiaryAddress().encodeABI(), 'address']) // 18
  listMethods.push([Moc.options.address, Moc.methods.isLiquidationReached().encodeABI(), 'bool']) // 19
  listMethods.push([Moc.options.address, Moc.methods.getPTCac().encodeABI(), 'uint256']) // 20
  listMethods.push([Moc.options.address, Moc.methods.getCglb().encodeABI(), 'uint256']) // 21
  listMethods.push([Moc.options.address, Moc.methods.getTCAvailableToRedeem().encodeABI(), 'uint256']) // 22
  listMethods.push([Moc.options.address, Moc.methods.getTotalACavailable().encodeABI(), 'uint256']) // 23
  listMethods.push([Moc.options.address, Moc.methods.getLeverageTC().encodeABI(), 'uint256']) // 24
  listMethods.push([Moc.options.address, Moc.methods.nextEmaCalculation().encodeABI(), 'uint256']) // 25
  listMethods.push([Moc.options.address, Moc.methods.emaCalculationBlockSpan().encodeABI(), 'uint256']) // 26
  listMethods.push([Moc.options.address, Moc.methods.calcCtargemaCA().encodeABI(), 'uint256']) // 27
  listMethods.push([Moc.options.address, Moc.methods.shouldCalculateEma().encodeABI(), 'bool']) // 28
  listMethods.push([Moc.options.address, Moc.methods.bes().encodeABI(), 'uint256']) // 29
  listMethods.push([Moc.options.address, Moc.methods.bns().encodeABI(), 'uint256']) // 30
  listMethods.push([Moc.options.address, Moc.methods.getBts().encodeABI(), 'uint256']) // 31
  listMethods.push([MocVendors.options.address, MocVendors.methods.vendorsGuardianAddress().encodeABI(), 'address']) // 32
  listMethods.push([Moc.options.address, Moc.methods.feeTokenPct().encodeABI(), 'uint256']) // 33
  listMethods.push([Moc.options.address, Moc.methods.feeToken().encodeABI(), 'address']) // 34
  listMethods.push([Moc.options.address, Moc.methods.feeTokenPriceProvider().encodeABI(), 'address']) // 35
  listMethods.push([Moc.options.address, Moc.methods.tcInterestCollectorAddress().encodeABI(), 'address']) // 36
  listMethods.push([Moc.options.address, Moc.methods.tcInterestRate().encodeABI(), 'uint256']) // 37
  listMethods.push([Moc.options.address, Moc.methods.tcInterestPaymentBlockSpan().encodeABI(), 'uint256']) // 38
  listMethods.push([Moc.options.address, Moc.methods.nextTCInterestPayment().encodeABI(), 'uint256']) // 39
  listMethods.push([PP_FeeToken.options.address, PP_FeeToken.methods.peek().encodeABI(), 'uint256']) // 40
  listMethods.push([MocVendors.options.address, MocVendors.methods.vendorMarkup(vendorAddress).encodeABI(), 'uint256']) // 41
  listMethods.push([PP_COINBASE.options.address, PP_COINBASE.methods.peek().encodeABI(), 'uint256']) // 42
  listMethods.push([Moc.options.address, Moc.methods.maxAbsoluteOpProvider().encodeABI(), 'address']) // 43
  listMethods.push([Moc.options.address, Moc.methods.maxOpDiffProvider().encodeABI(), 'address']) // 44
  listMethods.push([Moc.options.address, Moc.methods.decayBlockSpan().encodeABI(), 'uint256']) // 45
  listMethods.push([Moc.options.address, Moc.methods.absoluteAccumulator().encodeABI(), 'uint256']) // 46
  listMethods.push([Moc.options.address, Moc.methods.differentialAccumulator().encodeABI(), 'uint256']) // 47
  listMethods.push([Moc.options.address, Moc.methods.lastOperationBlockNumber().encodeABI(), 'uint256']) // 48
  listMethods.push([Moc.options.address, Moc.methods.qACLockedInPending().encodeABI(), 'uint256']) // 49
  listMethods.push([MocQueue.options.address, MocQueue.methods.operIdCount().encodeABI(), 'uint256']) // 50
  listMethods.push([MocQueue.options.address, MocQueue.methods.firstOperId().encodeABI(), 'uint256']) // 51
  listMethods.push([MocQueue.options.address, MocQueue.methods.minOperWaitingBlk().encodeABI(), 'uint256']) // 52
  listMethods.push([MocQueue.options.address, MocQueue.methods.execFee(1).encodeABI(), 'uint256']) // 53 mintTC
  listMethods.push([MocQueue.options.address, MocQueue.methods.execFee(2).encodeABI(), 'uint256']) // 54 redeemTC
  listMethods.push([MocQueue.options.address, MocQueue.methods.execFee(3).encodeABI(), 'uint256']) // 55 mintTP
  listMethods.push([MocQueue.options.address, MocQueue.methods.execFee(4).encodeABI(), 'uint256']) // 56 redeemTP
  listMethods.push([MocQueue.options.address, MocQueue.methods.execFee(9).encodeABI(), 'uint256']) // 57 swapTPforTP
  listMethods.push([MocQueue.options.address, MocQueue.methods.execFee(8).encodeABI(), 'uint256']) // 58 swapTPforTC
  listMethods.push([MocQueue.options.address, MocQueue.methods.execFee(7).encodeABI(), 'uint256']) // 59 swapTCforTP
  listMethods.push([MocQueue.options.address, MocQueue.methods.execFee(6).encodeABI(), 'uint256']) // 60 redeemTCandTP
  listMethods.push([MocQueue.options.address, MocQueue.methods.execFee(5).encodeABI(), 'uint256']) // 61 mintTCandTP
  listMethods.push([FC_MAX_ABSOLUTE_OP_PROVIDER.options.address, FC_MAX_ABSOLUTE_OP_PROVIDER.methods.peek().encodeABI(), 'uint256']) // 62
  listMethods.push([FC_MAX_OP_DIFFERENCE_PROVIDER.options.address, FC_MAX_OP_DIFFERENCE_PROVIDER.methods.peek().encodeABI(), 'uint256']) // 63

  let PP_TP
  let tpAddress
  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    tpAddress = dContracts.contracts.TP[i].options.address
    PP_TP = dContracts.contracts.PP_TP[i]
    listMethods.push([Moc.options.address, Moc.methods.tpMintFees(tpAddress).encodeABI(), 'uint256'])
    listMethods.push([Moc.options.address, Moc.methods.tpRedeemFees(tpAddress).encodeABI(), 'uint256'])
    listMethods.push([Moc.options.address, Moc.methods.tpCtarg(i).encodeABI(), 'uint256'])
    listMethods.push([Moc.options.address, Moc.methods.pegContainer(i).encodeABI(), 'uint256'])
    listMethods.push([PP_TP.options.address, PP_TP.methods.peek().encodeABI(), 'uint256'])
    listMethods.push([Moc.options.address, Moc.methods.getPACtp(tpAddress).encodeABI(), 'uint256'])
    listMethods.push([Moc.options.address, Moc.methods.getTPAvailableToMint(tpAddress).encodeABI(), 'uint256'])
    listMethods.push([Moc.options.address, Moc.methods.tpEma(i).encodeABI(), 'uint256'])
  }

  let PP_CA
  let CA
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    PP_CA = dContracts.contracts.PP_CA[i]
    CA = dContracts.contracts.CA[i]
    listMethods.push([CA.options.address, CA.methods.balanceOf(Moc.options.address).encodeABI(), 'uint256'])
    listMethods.push([PP_CA.options.address, PP_CA.methods.peek().encodeABI(), 'uint256'])
  }

  const status = {}

  // Remove decode result parameter
  const cleanListMethods = listMethods.map(x => [x[0], x[1]])

  // const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call({}, 3807699)
  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call()

  status.canOperate = true
  const listReturnData = []
  multicallResult.returnData.forEach(function (item, itemIndex) {
    // Ok success
    if (item.success) {
      listReturnData.push(web3.eth.abi.decodeParameter(
          listMethods[itemIndex][2],
          item.returnData)
      )
    } else {

      // 24 getLeverageTC this is an exception
      if (itemIndex === 24) {
        // When there are an exception here is because leverage is infinity
        // very big number (infinity+)
        listReturnData.push(new BigNumber(115792089237316200000000000000000000000000000000000000))
        console.warn("WARN: Leverage too high!")

      } else {

        // Not Ok Error on calling
        if (listMethods[itemIndex][2] === 'uint256') {
          listReturnData.push(0)
        } else if (listMethods[itemIndex][2] === 'address') {
          listReturnData.push('0x')
        } else if (listMethods[itemIndex][2] === 'bool') {
          listReturnData.push(false)
        }

        // If there are any problems can not operate
        status.canOperate = false
        console.warn("WARN: Cannot operate!")

      }

    }

  })

  status.blockHeight = multicallResult[0]
  status.protThrld = listReturnData[0]
  status.liqThrld = listReturnData[1]
  status.liqEnabled = listReturnData[2]
  status.liquidated = listReturnData[3]
  status.nACcb = listReturnData[4]
  status.tcToken = listReturnData[5]
  status.nTCcb = listReturnData[6]
  status.successFee = listReturnData[7]
  status.appreciationFactor = listReturnData[8]
  status.feeRetainer = listReturnData[9]
  status.tcMintFee = listReturnData[10]
  status.tcRedeemFee = listReturnData[11]
  status.swapTPforTPFee = listReturnData[12]
  status.swapTPforTCFee = listReturnData[13]
  status.swapTCforTPFee = listReturnData[14]
  status.redeemTCandTPFee = listReturnData[15]
  status.mintTCandTPFee = listReturnData[16]
  status.mocFeeFlowAddress = listReturnData[17]
  status.mocAppreciationBeneficiaryAddress = listReturnData[18]
  status.isLiquidationReached = listReturnData[19]
  status.getPTCac = listReturnData[20]
  status.getCglb = listReturnData[21]
  status.getTCAvailableToRedeem = listReturnData[22]
  status.getTotalACavailable = listReturnData[23]
  status.getLeverageTC = listReturnData[24]
  status.nextEmaCalculation = listReturnData[25]
  status.emaCalculationBlockSpan = listReturnData[26]
  status.calcCtargemaCA = listReturnData[27]
  status.shouldCalculateEma = listReturnData[28]
  status.bes = listReturnData[29]
  status.bns = listReturnData[30]
  status.getBts = listReturnData[31]
  status.vendorGuardianAddress = listReturnData[32]
  status.feeTokenPct = listReturnData[33] // e.g. if tcMintFee = 1%, FeeTokenPct = 50% => qFeeToken = 0.5%
  status.feeToken = listReturnData[34]
  status.feeTokenPriceProvider = listReturnData[35]
  status.tcInterestCollectorAddress = listReturnData[36]
  status.tcInterestRate = listReturnData[37]
  status.tcInterestPaymentBlockSpan = listReturnData[38]
  status.nextTCInterestPayment = listReturnData[39]
  status.PP_FeeToken = listReturnData[40]
  status.vendorMarkup = listReturnData[41]
  status.PP_COINBASE = listReturnData[42]
  status.maxAbsoluteOpProvider = listReturnData[43]
  status.maxOpDiffProvider = listReturnData[44]
  status.decayBlockSpan = listReturnData[45]
  status.absoluteAccumulator = listReturnData[46]
  status.differentialAccumulator = listReturnData[47]
  status.lastOperationBlockNumber = listReturnData[48]
  status.qACLockedInPending = listReturnData[49]
  status.operIdCount = listReturnData[50]
  status.firstOperId = listReturnData[51]
  status.minOperWaitingBlk = listReturnData[52]
  status.tcMintExecFee = listReturnData[53]
  status.tcRedeemExecFee = listReturnData[54]
  status.tpMintExecFee = listReturnData[55]
  status.tpRedeemExecFee = listReturnData[56]
  status.swapTPforTPExecFee = listReturnData[57]
  status.swapTPforTCExecFee = listReturnData[58]
  status.swapTCforTPExecFee = listReturnData[59]
  status.redeemTCandTPExecFee = listReturnData[60]
  status.mintTCandTPExecFee = listReturnData[61]
  status.FC_MAX_ABSOLUTE_OP = listReturnData[62]
  status.FC_MAX_OP_DIFFERENCE = listReturnData[63]

  const tpMintFees = []
  const tpRedeemFees = []
  const tpCtarg = []
  const pegContainer = []
  PP_TP = []
  const getPACtp = []
  const getTPAvailableToMint = []
  const tpEma = []

  let last_index = 63 // this is the last used array index
  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    tpMintFees.push(listReturnData[last_index + 1])
    tpRedeemFees.push(listReturnData[last_index + 2])
    tpCtarg.push(listReturnData[last_index + 3])
    pegContainer.push(listReturnData[last_index + 4])
    PP_TP.push(listReturnData[last_index + 5])
    getPACtp.push(listReturnData[last_index + 6])
    getTPAvailableToMint.push(listReturnData[last_index + 7])
    tpEma.push(listReturnData[last_index + 8])
    last_index = last_index + 8
  }

  status.tpMintFees = tpMintFees
  status.tpRedeemFees = tpRedeemFees
  status.tpCtarg = tpCtarg
  status.pegContainer = pegContainer
  status.PP_TP = PP_TP
  status.getPACtp = getPACtp
  status.getTPAvailableToMint = getTPAvailableToMint
  status.tpEma = tpEma

  const getACBalance = []
  PP_CA = []
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    getACBalance.push(listReturnData[last_index + 1])
    PP_CA.push(listReturnData[last_index + 2])
    last_index = last_index + 2
  }

  status.getACBalance = getACBalance
  status.PP_CA = PP_CA
  status.getTokenPrice = new BigNumber('0')

  last_index = last_index + 1

  const calcCtargemaCA = new BigNumber(
      fromContractPrecisionDecimals(
          status.calcCtargemaCA,
          18
      )
  );

  status.canOperate = !calcCtargemaCA.gt(1000000);

  // History Price (24hs ago)
  const d24BlockHeights = status.blockHeight - process.env.BLOCK_SPAN_HISTORIC;
  listMethods = []
  listMethods.push([Moc.options.address, Moc.methods.getPTCac().encodeABI(), 'uint256']) // 0
  listMethods.push([PP_COINBASE.options.address, PP_COINBASE.methods.peek().encodeABI(), 'uint256']) // 1

  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    PP_TP = dContracts.contracts.PP_TP[i]
    listMethods.push([PP_TP.options.address, PP_TP.methods.peek().encodeABI(), 'uint256'])
  }

  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    PP_CA = dContracts.contracts.PP_CA[i]
    listMethods.push([PP_CA.options.address, PP_CA.methods.peek().encodeABI(), 'uint256'])
  }

  const historic = {};

  const cleanListMethodsHistoric = listMethods.map((x) => [x[0], x[1]]);
  const multicallResultHistoric = await multicall.methods
      .tryBlockAndAggregate(false, cleanListMethodsHistoric)
      .call({}, d24BlockHeights);

  status.canHistoric = true
  const listReturnDataHistoric = []
  multicallResultHistoric.returnData.forEach(function (item, itemIndex) {
    // Ok success
    if (item.success) {
      listReturnDataHistoric.push(web3.eth.abi.decodeParameter(
          listMethods[itemIndex][2],
          item.returnData)
      )
    } else {

      // Not Ok Error on calling
      if (listMethods[itemIndex][2] === 'uint256') {
        listReturnDataHistoric.push(0)
      } else if (listMethods[itemIndex][2] === 'address') {
        listReturnDataHistoric.push('0x')
      } else if (listMethods[itemIndex][2] === 'bool') {
        listReturnDataHistoric.push(false)
      }

      // If there are any problems can not have historic data
      status.canHistoric = false
      console.warn("WARN: Cannot have historic data!")
    }

  })

  PP_TP = []
  last_index = 2 // this is the last used array index
  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    PP_TP.push(listReturnData[last_index + 1])
    last_index = last_index + 1
  }

  PP_CA = []
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    PP_CA.push(listReturnData[last_index + 1])
    last_index = last_index + 1
  }

  historic.blockHeight = d24BlockHeights;
  historic.getPTCac = listReturnDataHistoric[0];
  historic.PP_COINBASE = listReturnDataHistoric[1];
  historic.PP_TP = PP_TP;
  historic.PP_CA = PP_CA;
  status.historic = historic;

  return status
}

const userBalance = async (web3, dContracts, userAddress, configProject) => {
  const collateral = configProject.collateral

  const multicall = dContracts.contracts.multicall
  const CollateralToken = dContracts.contracts.CollateralToken
  const FeeToken = dContracts.contracts.FeeToken
  const MoCContract = dContracts.contracts.Moc

  console.log(`Reading user balance ... account: ${userAddress}`)

  const listMethods = []
  listMethods.push([multicall.options.address, multicall.methods.getEthBalance(userAddress).encodeABI(), 'uint256']) // 0
  listMethods.push([CollateralToken.options.address, CollateralToken.methods.balanceOf(userAddress).encodeABI(), 'uint256']) // 1
  listMethods.push([CollateralToken.options.address, CollateralToken.methods.allowance(userAddress, MoCContract.options.address).encodeABI(), 'uint256']) // 2
  listMethods.push([FeeToken.options.address, FeeToken.methods.balanceOf(userAddress).encodeABI(), 'uint256']) // 3
  listMethods.push([FeeToken.options.address, FeeToken.methods.allowance(userAddress, MoCContract.options.address).encodeABI(), 'uint256']) // 4

  let TP
  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    TP = dContracts.contracts.TP[i]
    listMethods.push([TP.options.address, TP.methods.balanceOf(userAddress).encodeABI(), 'uint256'])
    listMethods.push([TP.options.address, TP.methods.allowance(userAddress, MoCContract.options.address).encodeABI(), 'uint256'])
  }

  let CA
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    CA = dContracts.contracts.CA[i]
    listMethods.push([CA.options.address, CA.methods.balanceOf(userAddress).encodeABI(), 'uint256'])
    listMethods.push([CA.options.address, CA.methods.allowance(userAddress, MoCContract.options.address).encodeABI(), 'uint256'])
  }

  // Remove decode result parameter
  const cleanListMethods = listMethods.map(x => [x[0], x[1]])
  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call()
  const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData))

  const userBalance = {}
  userBalance.blockHeight = multicallResult[0]
  userBalance.coinbase = listReturnData[0]

  userBalance.TC = {
    balance: listReturnData[1],
    allowance: listReturnData[2]
  }
  userBalance.FeeToken = {
    balance: listReturnData[3],
    allowance: listReturnData[4]
  }

  let last_index = 4 // this is the last used array index
  TP = []
  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    TP.push({ balance: listReturnData[last_index + 1], allowance: listReturnData[last_index + 2] })
    last_index = last_index + 2
  }
  userBalance.TP = TP

  CA = []
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    CA.push({ balance: listReturnData[last_index + 1], allowance: listReturnData[last_index + 2] })
    last_index = last_index + 2
  }
  userBalance.CA = CA

  return userBalance
}

export {
  contractStatus,
  userBalance
}
