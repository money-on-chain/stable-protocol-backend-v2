
const contractStatus = async (web3, dContracts, configProject) => {

  const multicall = dContracts.contracts.multicall
  const Moc = dContracts.contracts.Moc

  /*
  const PP_TP = []
  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    PP_TP.push(dContracts.contracts.PP_TP[i])
  }

   */

  const PP_TP_0 = dContracts.contracts.PP_TP[0]
  const PP_TP_1 = dContracts.contracts.PP_TP[1]
  const PP_CA_0 = dContracts.contracts.PP_CA[0]
  const PP_CA_1 = dContracts.contracts.PP_CA[1]
  const CA_0 = dContracts.contracts.CA[0]
  const CA_1 = dContracts.contracts.CA[1]
  const MocVendors = dContracts.contracts.MocVendors
  const PP_FeeToken = dContracts.contracts.PP_FeeToken
  const MocWrapper = dContracts.contracts.MocWrapper

  console.log('Reading contract status ...')

  const listMethods = []
  listMethods.push([Moc.options.address, Moc.methods.protThrld().encodeABI(), 'uint256']) // 0
  listMethods.push([Moc.options.address, Moc.methods.liqThrld().encodeABI(), 'uint256'])  // 1
  listMethods.push([Moc.options.address, Moc.methods.liqEnabled().encodeABI(), 'bool']) // 2
  listMethods.push([Moc.options.address, Moc.methods.liquidated().encodeABI(), 'bool']) // 3
  listMethods.push([Moc.options.address, Moc.methods.nACcb().encodeABI(), 'uint256'])  // 4
  listMethods.push([Moc.options.address, Moc.methods.tcToken().encodeABI(), 'address']) // 5
  listMethods.push([Moc.options.address, Moc.methods.nTCcb().encodeABI(), 'uint256'])  // 6
  listMethods.push([Moc.options.address, Moc.methods.successFee().encodeABI(), 'uint256']) // 7
  listMethods.push([Moc.options.address, Moc.methods.appreciationFactor().encodeABI(), 'uint256'])  // 8
  listMethods.push([Moc.options.address, Moc.methods.feeRetainer().encodeABI(), 'uint256'])  // 9
  listMethods.push([Moc.options.address, Moc.methods.tcMintFee().encodeABI(), 'uint256'])  // 10
  listMethods.push([Moc.options.address, Moc.methods.tcRedeemFee().encodeABI(), 'uint256'])  // 11
  listMethods.push([Moc.options.address, Moc.methods.swapTPforTPFee().encodeABI(), 'uint256']) // 12
  listMethods.push([Moc.options.address, Moc.methods.swapTPforTCFee().encodeABI(), 'uint256']) // 13
  listMethods.push([Moc.options.address, Moc.methods.swapTCforTPFee().encodeABI(), 'uint256']) // 14
  listMethods.push([Moc.options.address, Moc.methods.redeemTCandTPFee().encodeABI(), 'uint256']) // 15
  listMethods.push([Moc.options.address, Moc.methods.mintTCandTPFee().encodeABI(), 'uint256'])  // 16
  listMethods.push([Moc.options.address, Moc.methods.tpMintFee(0).encodeABI(), 'uint256'])  // 17
  listMethods.push([Moc.options.address, Moc.methods.tpMintFee(1).encodeABI(), 'uint256'])  // 18
  listMethods.push([Moc.options.address, Moc.methods.tpRedeemFee(0).encodeABI(), 'uint256']) // 19
  listMethods.push([Moc.options.address, Moc.methods.tpRedeemFee(1).encodeABI(), 'uint256'])  // 20
  listMethods.push([Moc.options.address, Moc.methods.mocFeeFlowAddress().encodeABI(), 'address']) // 21
  listMethods.push([Moc.options.address, Moc.methods.mocAppreciationBeneficiaryAddress().encodeABI(), 'address']) // 22
  listMethods.push([Moc.options.address, Moc.methods.tpCtarg(0).encodeABI(), 'uint256'])  // 23
  listMethods.push([Moc.options.address, Moc.methods.tpCtarg(1).encodeABI(), 'uint256'])  // 24
  listMethods.push([Moc.options.address, Moc.methods.pegContainer(0).encodeABI(), 'uint256']) // 25
  listMethods.push([Moc.options.address, Moc.methods.pegContainer(1).encodeABI(), 'uint256']) // 26
  listMethods.push([PP_TP_0.options.address, PP_TP_0.methods.peek().encodeABI(), 'uint256']) // 27
  listMethods.push([PP_TP_1.options.address, PP_TP_1.methods.peek().encodeABI(), 'uint256']) // 28
  listMethods.push([PP_CA_0.options.address, PP_CA_0.methods.peek().encodeABI(), 'uint256']) // 29
  listMethods.push([PP_CA_1.options.address, PP_CA_1.methods.peek().encodeABI(), 'uint256']) // 30
  listMethods.push([Moc.options.address, Moc.methods.isLiquidationReached().encodeABI(), 'bool']) // 31
  listMethods.push([Moc.options.address, Moc.methods.getPACtp(0).encodeABI(), 'uint256']) // 32
  listMethods.push([Moc.options.address, Moc.methods.getPACtp(1).encodeABI(), 'uint256']) // 33
  listMethods.push([Moc.options.address, Moc.methods.getPTCac().encodeABI(), 'uint256']) // 34
  listMethods.push([Moc.options.address, Moc.methods.getCglb().encodeABI(), 'uint256']) // 35
  listMethods.push([Moc.options.address, Moc.methods.getTCAvailableToRedeem().encodeABI(), 'uint256']) // 36
  listMethods.push([Moc.options.address, Moc.methods.getTPAvailableToMint(0).encodeABI(), 'uint256'])  // 37
  listMethods.push([Moc.options.address, Moc.methods.getTPAvailableToMint(1).encodeABI(), 'uint256']) // 38
  listMethods.push([Moc.options.address, Moc.methods.getTotalACavailable().encodeABI(), 'uint256']) // 39
  listMethods.push([Moc.options.address, Moc.methods.getLeverageTC().encodeABI(), 'uint256']) // 40
  listMethods.push([Moc.options.address, Moc.methods.tpEma(0).encodeABI(), 'uint256']) // 41
  listMethods.push([Moc.options.address, Moc.methods.tpEma(1).encodeABI(), 'uint256']) // 42
  listMethods.push([Moc.options.address, Moc.methods.nextEmaCalculation().encodeABI(), 'uint256']) // 43
  listMethods.push([Moc.options.address, Moc.methods.emaCalculationBlockSpan().encodeABI(), 'uint256']) // 44
  listMethods.push([Moc.options.address, Moc.methods.calcCtargemaCA().encodeABI(), 'uint256']) // 45
  listMethods.push([Moc.options.address, Moc.methods.shouldCalculateEma().encodeABI(), 'bool']) // 46
  listMethods.push([Moc.options.address, Moc.methods.bes().encodeABI(), 'uint256']) // 47
  listMethods.push([Moc.options.address, Moc.methods.bns().encodeABI(), 'uint256']) // 48
  listMethods.push([Moc.options.address, Moc.methods.getBts().encodeABI(), 'uint256']) // 49
  listMethods.push([MocWrapper.options.address, MocWrapper.methods.getTokenPrice().encodeABI(), 'uint256']) // 50
  listMethods.push([CA_0.options.address, CA_0.methods.balanceOf(MocWrapper.options.address).encodeABI(), 'uint256']) // 51
  listMethods.push([CA_1.options.address, CA_1.methods.balanceOf(MocWrapper.options.address).encodeABI(), 'uint256']) // 52
  listMethods.push([MocVendors.options.address, MocVendors.methods.vendorsGuardianAddress().encodeABI(), 'address']) // 53
  listMethods.push([Moc.options.address, Moc.methods.feeTokenPct().encodeABI(), 'uint256']) // 54
  listMethods.push([Moc.options.address, Moc.methods.feeToken().encodeABI(), 'address']) // 55
  listMethods.push([Moc.options.address, Moc.methods.feeTokenPriceProvider().encodeABI(), 'address']) // 56
  listMethods.push([Moc.options.address, Moc.methods.tcInterestCollectorAddress().encodeABI(), 'address']) // 57
  listMethods.push([Moc.options.address, Moc.methods.tcInterestRate().encodeABI(), 'uint256']) // 58
  listMethods.push([Moc.options.address, Moc.methods.tcInterestPaymentBlockSpan().encodeABI(), 'uint256']) // 59
  listMethods.push([Moc.options.address, Moc.methods.nextTCInterestPayment().encodeABI(), 'uint256']) // 60
  listMethods.push([PP_FeeToken.options.address, PP_FeeToken.methods.peek().encodeABI(), 'uint256']) // 61

  // Remove decode result parameter
  const cleanListMethods = listMethods.map(x => [x[0], x[1]])

  //const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call({}, 3807699)
  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call()

  const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData))

  const status = {}
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
  status.tpMintFee = [listReturnData[17], listReturnData[18]]
  status.tpRedeemFee = [listReturnData[19], listReturnData[20]]
  status.mocFeeFlowAddress = listReturnData[21]
  status.mocAppreciationBeneficiaryAddress = listReturnData[22]
  status.tpCtarg = [listReturnData[23], listReturnData[24]]
  status.pegContainer = [listReturnData[25], listReturnData[26]]
  status.PP_TP = [listReturnData[27], listReturnData[28]]
  status.PP_CA = [listReturnData[29], listReturnData[30]]
  status.isLiquidationReached = listReturnData[31]
  status.getPACtp = [listReturnData[32], listReturnData[33]]
  status.getPTCac = listReturnData[34]
  status.getCglb = listReturnData[35]
  status.getTCAvailableToRedeem = listReturnData[36]
  status.getTPAvailableToMint = [listReturnData[37], listReturnData[38]]
  status.getTotalACavailable = listReturnData[39]
  status.getLeverageTC = listReturnData[40]
  status.tpEma = [listReturnData[41], listReturnData[42]]
  status.nextEmaCalculation = listReturnData[43]
  status.emaCalculationBlockSpan = listReturnData[44]
  status.calcCtargemaCA = listReturnData[45]
  status.shouldCalculateEma = listReturnData[46]
  status.bes = listReturnData[47]
  status.bns = listReturnData[48]
  status.getBts = listReturnData[49]
  status.getTokenPrice = listReturnData[50]
  status.getACBalance = [listReturnData[51], listReturnData[52]]
  status.vendorGuardianAddress = listReturnData[53]
  status.feeTokenPct = listReturnData[54] // e.g. if tcMintFee = 1%, FeeTokenPct = 50% => qFeeToken = 0.5%
  status.feeToken = listReturnData[55]
  status.feeTokenPriceProvider = listReturnData[56]
  status.tcInterestCollectorAddress = listReturnData[57]
  status.tcInterestRate = listReturnData[58]
  status.tcInterestPaymentBlockSpan = listReturnData[59]
  status.nextTCInterestPayment = listReturnData[60]
  status.PP_FeeToken = listReturnData[61]

  return status
}

const userBalance = async (web3, dContracts, userAddress, configProject) => {

  const multicall = dContracts.contracts.multicall
  const MocWrapper = dContracts.contracts.MocWrapper
  const CA_0 = dContracts.contracts.CA[0]
  const CA_1 = dContracts.contracts.CA[1]
  const TP_0 = dContracts.contracts.TP[0]
  const TP_1 = dContracts.contracts.TP[1]
  const CollateralToken = dContracts.contracts.CollateralToken
  const FeeToken = dContracts.contracts.FeeToken

  console.log(`Reading user balance ... account: ${userAddress}`)

  const listMethods = [
    [multicall.options.address, multicall.methods.getEthBalance(userAddress).encodeABI(), 'uint256'], // 0
    [CA_0.options.address, CA_0.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 1
    [CA_0.options.address, CA_0.methods.allowance(userAddress, MocWrapper.options.address).encodeABI(), 'uint256'], // 2
    [CA_1.options.address, CA_1.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 3
    [CA_1.options.address, CA_1.methods.allowance(userAddress, MocWrapper.options.address).encodeABI(), 'uint256'], // 4
    [TP_0.options.address, TP_0.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 5
    [TP_1.options.address, TP_1.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 6
    [CollateralToken.options.address, CollateralToken.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 7
    [CollateralToken.options.address, CollateralToken.methods.allowance(userAddress, MocWrapper.options.address).encodeABI(), 'uint256'], // 8
    [FeeToken.options.address, FeeToken.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 9
    [FeeToken.options.address, FeeToken.methods.allowance(userAddress, MocWrapper.options.address).encodeABI(), 'uint256'] // 10
  ]

  // Remove decode result parameter
  const cleanListMethods = listMethods.map(x => [x[0], x[1]])
  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call()
  const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData))

  const userBalance = {}
  userBalance.blockHeight = multicallResult[0]
  userBalance.coinbase = listReturnData[0]
  userBalance.CA = [
      {
        balance: listReturnData[1],
        allowance: listReturnData[2]
      },
      {
        balance: listReturnData[3],
        allowance: listReturnData[4]
      },
  ]
  userBalance.TP = [listReturnData[5], listReturnData[6]]
  userBalance.TC = {
    balance: listReturnData[7],
    allowance: listReturnData[8]
  }
  userBalance.FeeToken = {
    balance: listReturnData[9],
    allowance: listReturnData[10]
  }

  return userBalance
}

export {
  contractStatus,
  userBalance
}
