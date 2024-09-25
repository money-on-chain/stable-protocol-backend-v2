import BigNumber from 'bignumber.js'
import {fromContractPrecisionDecimals, readJsonFile} from '../utils.js'

// getting constants from omoc.json
const configOmoc = readJsonFile('./settings/omoc.json')


class MultiCall {
  constructor(multicall, web3) {
    this.multicall = multicall;
    this.web3 = web3;
    this.calls = [];
    this.storage = {};
  }
  clear() {
    this.calls = [];
  }
  aggregate(contract, encodeABI, resultType, keyName, keyIndex, keySubIndex) {
    this.calls.push([contract.options.address, encodeABI, resultType, keyName, keyIndex, keySubIndex])
  }
  async tryBlockAndAggregate(blockNumber) {

    // Remove decode result parameter
    const cleanListMethods = this.calls.map(x => [x[0], x[1]])
    const multiCallResult = await this.multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call({}, blockNumber)

    let canOperate = true

    const calls = this.calls
    const storage = this.storage
    const web3 = this.web3

    storage['blockHeight'] = multiCallResult[0]

    multiCallResult.returnData.forEach(function (item, itemIndex) {

      let value
      const resultType = calls[itemIndex][2]
      const keyName = calls[itemIndex][3]
      const keyIndex = calls[itemIndex][4]
      const keySubIndex = calls[itemIndex][5]

      // Ok success
      if (item.success) {
        if (typeof resultType === 'string') {
          value = web3.eth.abi.decodeParameter(resultType, item.returnData)
        } else {
          value = web3.eth.abi.decodeParameters(resultType, item.returnData)
        }
      } else {

        // Exceptions
        // getLeverageTC this is an exception
        if (keyName === 'getLeverageTC') {
          // When there are an exception here is because leverage is infinity
          // very big number (infinity+)
          value = new BigNumber(115792089237316200000000000000000000000000000000000000)
          console.warn("WARN: Leverage too high!")
        } else if (keyName === 'votingmachine' && keyIndex === 'getProposalByIndex') {
          value = null
        } else {
          // Not Ok Error on calling
          if (resultType === 'uint256') {
            value = '0'
          } else if (resultType === 'address') {
            value = '0x'
          } else if (resultType === 'bool') {
            value = false
          }
          // If there are any problems can not operate
          canOperate = false
          console.warn(`WARN: Cannot operate! Item: ${keyName} -> ${keyIndex} -> ${keySubIndex}`)
        }
      }

      if (keyIndex != null && keySubIndex != null) {
        if (!storage[keyName]){
          storage[keyName] = {}
        }
        if (!storage[keyName][keyIndex]){
          storage[keyName][keyIndex] = {}
        }
        storage[keyName][keyIndex][keySubIndex] = value
      } else if (keyIndex != null) {
        if (!storage[keyName]){
          if (keyIndex === parseInt(keyIndex, 10)) {
            storage[keyName] = []
          } else {
            storage[keyName] = {}
          }
        }
        storage[keyName][keyIndex] = value
      } else {
        storage[keyName] = value
      }

    })

    storage[canOperate] = canOperate

    return storage

  }
}

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

  // OMOC
  const iregistry = dContracts.contracts.iregistry
  const stakingmachine = dContracts.contracts.stakingmachine
  const delaymachine = dContracts.contracts.delaymachine
  const supporters = dContracts.contracts.supporters
  const votingmachine = dContracts.contracts.votingmachine

  const tg = dContracts.contracts.tg

  const multiCallRequest = new MultiCall(multicall, web3)

  multiCallRequest.aggregate(Moc, Moc.methods.protThrld().encodeABI(), 'uint256', 'protThrld')
  multiCallRequest.aggregate(Moc, Moc.methods.liqThrld().encodeABI(), 'uint256', 'liqThrld')
  multiCallRequest.aggregate(Moc, Moc.methods.liqEnabled().encodeABI(), 'bool', 'liqEnabled')
  multiCallRequest.aggregate(Moc, Moc.methods.liquidated().encodeABI(), 'bool', 'liquidated')
  multiCallRequest.aggregate(Moc, Moc.methods.nACcb().encodeABI(), 'uint256', 'nACcb')
  multiCallRequest.aggregate(Moc, Moc.methods.tcToken().encodeABI(), 'address', 'tcToken')
  multiCallRequest.aggregate(Moc, Moc.methods.nTCcb().encodeABI(), 'uint256', 'nTCcb')
  multiCallRequest.aggregate(Moc, Moc.methods.successFee().encodeABI(), 'uint256', 'successFee')
  multiCallRequest.aggregate(Moc, Moc.methods.appreciationFactor().encodeABI(), 'uint256', 'appreciationFactor')
  multiCallRequest.aggregate(Moc, Moc.methods.feeRetainer().encodeABI(), 'uint256', 'feeRetainer')
  multiCallRequest.aggregate(Moc, Moc.methods.tcMintFee().encodeABI(), 'uint256', 'tcMintFee')
  multiCallRequest.aggregate(Moc, Moc.methods.tcRedeemFee().encodeABI(), 'uint256', 'tcRedeemFee')
  multiCallRequest.aggregate(Moc, Moc.methods.swapTPforTPFee().encodeABI(), 'uint256', 'swapTPforTPFee')
  multiCallRequest.aggregate(Moc, Moc.methods.swapTPforTCFee().encodeABI(), 'uint256', 'swapTPforTCFee')
  multiCallRequest.aggregate(Moc, Moc.methods.swapTCforTPFee().encodeABI(), 'uint256', 'swapTCforTPFee')
  multiCallRequest.aggregate(Moc, Moc.methods.redeemTCandTPFee().encodeABI(), 'uint256', 'redeemTCandTPFee')
  multiCallRequest.aggregate(Moc, Moc.methods.mintTCandTPFee().encodeABI(), 'uint256', 'mintTCandTPFee')
  multiCallRequest.aggregate(Moc, Moc.methods.mocFeeFlowAddress().encodeABI(), 'address', 'mocFeeFlowAddress')
  multiCallRequest.aggregate(Moc, Moc.methods.mocAppreciationBeneficiaryAddress().encodeABI(), 'address', 'mocAppreciationBeneficiaryAddress')
  multiCallRequest.aggregate(Moc, Moc.methods.isLiquidationReached().encodeABI(), 'bool', 'isLiquidationReached')
  multiCallRequest.aggregate(Moc, Moc.methods.getPTCac().encodeABI(), 'uint256', 'getPTCac')
  multiCallRequest.aggregate(Moc, Moc.methods.getCglb().encodeABI(), 'uint256', 'getCglb')
  multiCallRequest.aggregate(Moc, Moc.methods.getTCAvailableToRedeem().encodeABI(), 'uint256', 'getTCAvailableToRedeem')
  multiCallRequest.aggregate(Moc, Moc.methods.getTotalACavailable().encodeABI(), 'uint256', 'getTotalACavailable')
  multiCallRequest.aggregate(Moc, Moc.methods.getLeverageTC().encodeABI(), 'uint256', 'getLeverageTC')
  multiCallRequest.aggregate(Moc, Moc.methods.nextEmaCalculation().encodeABI(), 'uint256', 'nextEmaCalculation')
  multiCallRequest.aggregate(Moc, Moc.methods.emaCalculationBlockSpan().encodeABI(), 'uint256', 'emaCalculationBlockSpan')
  multiCallRequest.aggregate(Moc, Moc.methods.calcCtargemaCA().encodeABI(), 'uint256', 'calcCtargemaCA')
  multiCallRequest.aggregate(Moc, Moc.methods.shouldCalculateEma().encodeABI(), 'bool', 'shouldCalculateEma')
  multiCallRequest.aggregate(Moc, Moc.methods.bes().encodeABI(), 'uint256', 'bes')
  multiCallRequest.aggregate(Moc, Moc.methods.bns().encodeABI(), 'uint256', 'bns')
  multiCallRequest.aggregate(Moc, Moc.methods.getBts().encodeABI(), 'uint256', 'getBts')
  multiCallRequest.aggregate(MocVendors, MocVendors.methods.vendorsGuardianAddress().encodeABI(), 'address', 'vendorGuardianAddress')
  multiCallRequest.aggregate(Moc, Moc.methods.feeTokenPct().encodeABI(), 'uint256', 'feeTokenPct')
  multiCallRequest.aggregate(Moc, Moc.methods.feeToken().encodeABI(), 'address', 'feeToken')
  multiCallRequest.aggregate(Moc, Moc.methods.feeTokenPriceProvider().encodeABI(), 'address', 'feeTokenPriceProvider')
  multiCallRequest.aggregate(Moc, Moc.methods.tcInterestCollectorAddress().encodeABI(), 'address', 'tcInterestCollectorAddress')
  multiCallRequest.aggregate(Moc, Moc.methods.tcInterestRate().encodeABI(), 'uint256', 'tcInterestRate')
  multiCallRequest.aggregate(Moc, Moc.methods.tcInterestPaymentBlockSpan().encodeABI(), 'uint256', 'tcInterestPaymentBlockSpan')
  multiCallRequest.aggregate(Moc, Moc.methods.nextTCInterestPayment().encodeABI(), 'uint256', 'nextTCInterestPayment')
  multiCallRequest.aggregate(PP_FeeToken, PP_FeeToken.methods.peek().encodeABI(), 'uint256', 'PP_FeeToken')
  multiCallRequest.aggregate(MocVendors, MocVendors.methods.vendorMarkup(vendorAddress).encodeABI(), 'uint256', 'vendorMarkup')
  multiCallRequest.aggregate(PP_COINBASE, PP_COINBASE.methods.peek().encodeABI(), 'uint256', 'PP_COINBASE')
  multiCallRequest.aggregate(Moc, Moc.methods.maxAbsoluteOpProvider().encodeABI(), 'address', 'maxAbsoluteOpProvider')
  multiCallRequest.aggregate(Moc, Moc.methods.maxOpDiffProvider().encodeABI(), 'address', 'maxOpDiffProvider')
  multiCallRequest.aggregate(Moc, Moc.methods.decayBlockSpan().encodeABI(), 'uint256', 'decayBlockSpan')
  multiCallRequest.aggregate(Moc, Moc.methods.absoluteAccumulator().encodeABI(), 'uint256', 'absoluteAccumulator')
  multiCallRequest.aggregate(Moc, Moc.methods.differentialAccumulator().encodeABI(), 'uint256', 'differentialAccumulator')
  multiCallRequest.aggregate(Moc, Moc.methods.lastOperationBlockNumber().encodeABI(), 'uint256', 'lastOperationBlockNumber')
  multiCallRequest.aggregate(Moc, Moc.methods.qACLockedInPending().encodeABI(), 'uint256', 'qACLockedInPending')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.operIdCount().encodeABI(), 'uint256', 'operIdCount')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.firstOperId().encodeABI(), 'uint256', 'firstOperId')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.minOperWaitingBlk().encodeABI(), 'uint256', 'minOperWaitingBlk')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.execFee(1).encodeABI(), 'uint256', 'tcMintExecFee')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.execFee(2).encodeABI(), 'uint256', 'tcRedeemExecFee')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.execFee(3).encodeABI(), 'uint256', 'tpMintExecFee')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.execFee(4).encodeABI(), 'uint256', 'tpRedeemExecFee')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.execFee(9).encodeABI(), 'uint256', 'swapTPforTPExecFee')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.execFee(8).encodeABI(), 'uint256', 'swapTPforTCExecFee')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.execFee(7).encodeABI(), 'uint256', 'swapTCforTPExecFee')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.execFee(6).encodeABI(), 'uint256', 'redeemTCandTPExecFee')
  multiCallRequest.aggregate(MocQueue, MocQueue.methods.execFee(5).encodeABI(), 'uint256', 'mintTCandTPExecFee')
  multiCallRequest.aggregate(FC_MAX_ABSOLUTE_OP_PROVIDER, FC_MAX_ABSOLUTE_OP_PROVIDER.methods.peek().encodeABI(), 'uint256', 'FC_MAX_ABSOLUTE_OP')
  multiCallRequest.aggregate(FC_MAX_OP_DIFFERENCE_PROVIDER, FC_MAX_OP_DIFFERENCE_PROVIDER.methods.peek().encodeABI(), 'uint256', 'FC_MAX_OP_DIFFERENCE')
  multiCallRequest.aggregate(Moc, Moc.methods.maxQACToMintTP().encodeABI(), 'uint256', 'maxQACToMintTP')
  multiCallRequest.aggregate(Moc, Moc.methods.maxQACToRedeemTP().encodeABI(), 'uint256', 'maxQACToRedeemTP')
  multiCallRequest.aggregate(Moc, Moc.methods.paused().encodeABI(), 'bool', 'paused')

  // OMOC
  multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getWithdrawLockTime().encodeABI(), 'uint256', 'stakingmachine', 'getWithdrawLockTime')
  multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getSupporters().encodeABI(), 'address', 'stakingmachine', 'getSupporters')
  multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getOracleManager().encodeABI(), 'address', 'stakingmachine', 'getOracleManager')
  multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getDelayMachine().encodeABI(), 'address', 'stakingmachine', 'getDelayMachine')
  multiCallRequest.aggregate(delaymachine, delaymachine.methods.getLastId().encodeABI(), 'uint256', 'delaymachine', 'getLastId')
  multiCallRequest.aggregate(delaymachine, delaymachine.methods.getSource().encodeABI(), 'address', 'delaymachine', 'getSource')
  multiCallRequest.aggregate(supporters, supporters.methods.isReadyToDistribute().encodeABI(), 'bool', 'supporters', 'isReadyToDistribute')
  multiCallRequest.aggregate(supporters, supporters.methods.mocToken().encodeABI(), 'address', 'supporters', 'mocToken')
  multiCallRequest.aggregate(supporters, supporters.methods.period().encodeABI(), 'uint256', 'supporters', 'period')
  multiCallRequest.aggregate(supporters, supporters.methods.totalMoc().encodeABI(), 'uint256', 'supporters', 'totalMoc')
  multiCallRequest.aggregate(supporters, supporters.methods.totalToken().encodeABI(), 'uint256', 'supporters', 'totalToken')
  multiCallRequest.aggregate(votingmachine, votingmachine.methods.getState().encodeABI(), 'uint256', 'votingmachine', 'getState')
  multiCallRequest.aggregate(votingmachine, votingmachine.methods.getVotingRound().encodeABI(), 'uint256', 'votingmachine', 'getVotingRound')
  multiCallRequest.aggregate(votingmachine, votingmachine.methods.getVoteInfo().encodeABI(), [{ type: 'address', name: 'winnerProposal' }, { type: 'uint256', name: 'inFavorVotes' }, { type: 'uint256', name: 'againstVotes' }], 'votingmachine', 'getVoteInfo')
  multiCallRequest.aggregate(votingmachine, votingmachine.methods.readyToPreVoteStep().encodeABI(), 'uint256', 'votingmachine', 'readyToPreVoteStep')
  multiCallRequest.aggregate(votingmachine, votingmachine.methods.readyToVoteStep().encodeABI(), 'uint256', 'votingmachine', 'readyToVoteStep')
  multiCallRequest.aggregate(votingmachine, votingmachine.methods.getProposalCount().encodeABI(), 'uint256', 'votingmachine', 'getProposalCount')
  multiCallRequest.aggregate(votingmachine, votingmachine.methods.getVotingData().encodeABI(), [{ type: 'address', name: 'winnerProposal' }, { type: 'uint256', name: 'inFavorVotes' }, { type: 'uint256', name: 'againstVotes' }, { type: 'uint256', name: 'votingExpirationTime' }], 'votingmachine', 'getVotingData')
  multiCallRequest.aggregate(votingmachine, votingmachine.methods.getProposalByIndex(0).encodeABI(), [{ type: 'address', name: 'proposalAddress' }, { type: 'uint256', name: 'votingRound' }, { type: 'uint256', name: 'votes' }, { type: 'uint256', name: 'expirationTimeStamp' }], 'votingmachine', 'getProposalByIndex', 0)
  multiCallRequest.aggregate(votingmachine, votingmachine.methods.getProposalByIndex(1).encodeABI(), [{ type: 'address', name: 'proposalAddress' }, { type: 'uint256', name: 'votingRound' }, { type: 'uint256', name: 'votes' }, { type: 'uint256', name: 'expirationTimeStamp' }], 'votingmachine', 'getProposalByIndex', 1)
  multiCallRequest.aggregate(votingmachine, votingmachine.methods.getProposalByIndex(2).encodeABI(), [{ type: 'address', name: 'proposalAddress' }, { type: 'uint256', name: 'votingRound' }, { type: 'uint256', name: 'votes' }, { type: 'uint256', name: 'expirationTimeStamp' }], 'votingmachine', 'getProposalByIndex', 2)
  multiCallRequest.aggregate(votingmachine, votingmachine.methods.getProposalByIndex(3).encodeABI(), [{ type: 'address', name: 'proposalAddress' }, { type: 'uint256', name: 'votingRound' }, { type: 'uint256', name: 'votes' }, { type: 'uint256', name: 'expirationTimeStamp' }], 'votingmachine', 'getProposalByIndex', 3)

  // OMOC REGISTRY CONSTANT
  multiCallRequest.aggregate(iregistry, iregistry.methods.getUint(configOmoc.RegistryConstants.MOC_VOTING_MACHINE_MIN_STAKE).encodeABI(), 'uint256', 'votingmachine', 'MIN_STAKE')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getUint(configOmoc.RegistryConstants.MOC_VOTING_MACHINE_PRE_VOTE_EXPIRATION_TIME_DELTA).encodeABI(), 'uint256', 'votingmachine', 'PRE_VOTE_EXPIRATION_TIME_DELTA')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getUint(configOmoc.RegistryConstants.MOC_VOTING_MACHINE_MAX_PRE_PROPOSALS).encodeABI(), 'uint256', 'votingmachine', 'MAX_PRE_PROPOSALS')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getUint(configOmoc.RegistryConstants.MOC_VOTING_MACHINE_PRE_VOTE_MIN_PCT_TO_WIN).encodeABI(), 'uint256', 'votingmachine', 'PRE_VOTE_MIN_PCT_TO_WIN')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getUint(configOmoc.RegistryConstants.MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_VETO).encodeABI(), 'uint256', 'votingmachine', 'VOTE_MIN_PCT_TO_VETO')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getUint(configOmoc.RegistryConstants.MOC_VOTING_MACHINE_VOTE_MIN_PCT_FOR_QUORUM).encodeABI(), 'uint256', 'votingmachine', 'MIN_PCT_FOR_QUORUM')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getUint(configOmoc.RegistryConstants.MOC_VOTING_MACHINE_VOTE_MIN_PCT_TO_ACCEPT).encodeABI(), 'uint256', 'votingmachine', 'VOTE_MIN_PCT_TO_ACCEPT')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getUint(configOmoc.RegistryConstants.MOC_VOTING_MACHINE_PCT_PRECISION).encodeABI(), 'uint256', 'votingmachine', 'PCT_PRECISION')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getUint(configOmoc.RegistryConstants.MOC_VOTING_MACHINE_VOTING_TIME_DELTA).encodeABI(), 'uint256', 'votingmachine', 'VOTING_TIME_DELTA')

  // PP TP
  let PP_TP
  let tpAddress
  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    tpAddress = dContracts.contracts.TP[i].options.address
    PP_TP = dContracts.contracts.PP_TP[i]

    multiCallRequest.aggregate(Moc, Moc.methods.tpMintFees(tpAddress).encodeABI(), 'uint256', 'tpMintFees', i)
    multiCallRequest.aggregate(Moc, Moc.methods.tpRedeemFees(tpAddress).encodeABI(), 'uint256', 'tpRedeemFees', i)
    multiCallRequest.aggregate(Moc, Moc.methods.tpCtarg(i).encodeABI(), 'uint256', 'tpCtarg', i)
    multiCallRequest.aggregate(Moc, Moc.methods.pegContainer(i).encodeABI(), 'uint256', 'pegContainer', i)
    multiCallRequest.aggregate(PP_TP, PP_TP.methods.peek().encodeABI(), 'uint256', 'PP_TP', i)
    multiCallRequest.aggregate(Moc, Moc.methods.getPACtp(tpAddress).encodeABI(), 'uint256', 'getPACtp', i)
    multiCallRequest.aggregate(Moc, Moc.methods.getTPAvailableToMint(tpAddress).encodeABI(), 'uint256', 'getTPAvailableToMint', i)
    multiCallRequest.aggregate(Moc, Moc.methods.tpEma(i).encodeABI(), 'uint256', 'tpEma', i)
  }

  // PP CA
  let PP_CA
  let CA
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    PP_CA = dContracts.contracts.PP_CA[i]
    CA = dContracts.contracts.CA[i]
    multiCallRequest.aggregate(CA, CA.methods.balanceOf(Moc.options.address).encodeABI(), 'uint256', 'getACBalance', i)
    multiCallRequest.aggregate(PP_CA, PP_CA.methods.peek().encodeABI(), 'uint256', 'PP_CA', i)
  }

  console.log('Reading contract status ...')

  const status = await multiCallRequest.tryBlockAndAggregate();

  status.getTokenPrice = new BigNumber('0')
  const calcCtargemaCA = new BigNumber(
      fromContractPrecisionDecimals(
          status.calcCtargemaCA,
          18
      )
  );
  if (calcCtargemaCA.gt(1000000)) {
    status.canOperate = false
  }

  // Multicall History Price
  const d24BlockHeights = status.blockHeight - process.env.BLOCK_SPAN_HISTORIC;
  const multiCallRequestHistory = new MultiCall(multicall, web3)
  multiCallRequestHistory.aggregate(Moc, Moc.methods.getPTCac().encodeABI(), 'uint256', 'getPTCac')
  multiCallRequestHistory.aggregate(PP_COINBASE, PP_COINBASE.methods.peek().encodeABI(), 'uint256', 'PP_COINBASE')
  multiCallRequestHistory.aggregate(PP_FeeToken, PP_FeeToken.methods.peek().encodeABI(), 'uint256', 'PP_FeeToken')

  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    PP_TP = dContracts.contracts.PP_TP[i]
    multiCallRequestHistory.aggregate(PP_TP, PP_TP.methods.peek().encodeABI(), 'uint256', 'PP_TP', i)
  }

  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    PP_CA = dContracts.contracts.PP_CA[i]
    multiCallRequestHistory.aggregate(PP_CA, PP_CA.methods.peek().encodeABI(), 'uint256', 'PP_CA', i)
  }

  const historic = await multiCallRequestHistory.tryBlockAndAggregate(d24BlockHeights);
  status.canHistoric = historic.canOperate
  status.historic = historic;

  console.log("DEBUG>>")
  console.log(status)

  return status
}

const userBalance = async (web3, dContracts, userAddress, configProject) => {
  const collateral = configProject.collateral

  const multicall = dContracts.contracts.multicall
  const CollateralToken = dContracts.contracts.CollateralToken
  const FeeToken = dContracts.contracts.FeeToken
  const MoCContract = dContracts.contracts.Moc

  const stakingmachine = dContracts.contracts.stakingmachine
  const delaymachine = dContracts.contracts.delaymachine
  const tg = dContracts.contracts.tg
  const vestingmachine = dContracts.contracts.vestingmachine
  const vestingfactory = dContracts.contracts.vestingfactory


  console.log(`Reading user balance ... account: ${userAddress}`)

  const multiCallRequest = new MultiCall(multicall, web3)
  multiCallRequest.aggregate(multicall, multicall.methods.getEthBalance(userAddress).encodeABI(), 'uint256', 'coinbase')
  multiCallRequest.aggregate(CollateralToken, CollateralToken.methods.balanceOf(userAddress).encodeABI(), 'uint256', 'TC', 'balance')
  multiCallRequest.aggregate(CollateralToken, CollateralToken.methods.allowance(userAddress, MoCContract.options.address).encodeABI(), 'uint256', 'TC', 'allowance')
  multiCallRequest.aggregate(FeeToken, FeeToken.methods.balanceOf(userAddress).encodeABI(), 'uint256', 'FeeToken', 'balance')
  multiCallRequest.aggregate(FeeToken, FeeToken.methods.allowance(userAddress, MoCContract.options.address).encodeABI(), 'uint256', 'FeeToken', 'allowance')

  // OMOC
  multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getBalance(userAddress).encodeABI(), 'uint256', 'stakingmachine', 'getBalance')
  multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getLockedBalance(userAddress).encodeABI(), 'uint256', 'stakingmachine', 'getLockedBalance')
  multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getLockingInfo(userAddress).encodeABI(), [{ type: 'uint256', name: 'amount' }, { type: 'uint256', name: 'untilTimestamp' }], 'stakingmachine', 'getLockingInfo')
  multiCallRequest.aggregate(delaymachine, delaymachine.methods.getTransactions(userAddress).encodeABI(), [{ type: 'uint256[]', name: 'ids' }, { type: 'uint256[]', name: 'amounts' }, { type: 'uint256[]', name: 'expirations' }], 'delaymachine', 'getTransactions')
  multiCallRequest.aggregate(delaymachine, delaymachine.methods.getBalance(userAddress).encodeABI(), 'uint256', 'delaymachine', 'getBalance')
  multiCallRequest.aggregate(tg, tg.methods.balanceOf(userAddress).encodeABI(), 'uint256', 'tgBalance')
  multiCallRequest.aggregate(tg, tg.methods.allowance(userAddress, stakingmachine.options.address).encodeABI(), 'uint256', 'stakingmachine', 'tgAllowance')

  // OMOC VESTING MACHINE
  if (typeof vestingmachine !== 'undefined') {
    multiCallRequest.aggregate(vestingfactory, vestingfactory.methods.isTGEConfigured().encodeABI(), 'bool', 'vestingfactory', 'isTGEConfigured')
    multiCallRequest.aggregate(vestingfactory, vestingfactory.methods.getTGETimestamp().encodeABI(), 'uint256', 'vestingfactory', 'getTGETimestamp')
    multiCallRequest.aggregate(vestingmachine, vestingmachine.methods.getParameters().encodeABI(), [{ type: 'uint256[]', name: 'percentages' }, { type: 'uint256[]', name: 'timeDeltas' }], 'vestingmachine', 'getParameters')
    multiCallRequest.aggregate(vestingmachine, vestingmachine.methods.getHolder().encodeABI(), 'address', 'vestingmachine', 'getHolder')
    multiCallRequest.aggregate(vestingmachine, vestingmachine.methods.getLocked().encodeABI(), 'uint256', 'vestingmachine', 'getLocked')
    multiCallRequest.aggregate(vestingmachine, vestingmachine.methods.getAvailable().encodeABI(), 'uint256', 'vestingmachine', 'getAvailable')
    multiCallRequest.aggregate(vestingmachine, vestingmachine.methods.isVerified().encodeABI(), 'bool', 'vestingmachine', 'isVerified')
    multiCallRequest.aggregate(vestingmachine, vestingmachine.methods.getTotal().encodeABI(), 'uint256', 'vestingmachine', 'getTotal')
    multiCallRequest.aggregate(tg, tg.methods.balanceOf(vestingmachine.options.address).encodeABI(), 'uint256', 'vestingmachine', 'tgBalance')
    multiCallRequest.aggregate(tg, tg.methods.allowance(userAddress, vestingmachine.options.address).encodeABI(), 'uint256', 'vestingmachine', 'tgAllowance')
    multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getBalance(vestingmachine.options.address).encodeABI(), 'uint256', 'vestingmachine', 'staking', 'balance')
    multiCallRequest.aggregate(tg, tg.methods.allowance(vestingmachine.options.address, stakingmachine.options.address).encodeABI(), 'uint256', 'vestingmachine', 'staking', 'allowance')
    multiCallRequest.aggregate(delaymachine, delaymachine.methods.getBalance(vestingmachine.options.address).encodeABI(), 'uint256', 'vestingmachine', 'delay', 'balance')
    multiCallRequest.aggregate(tg, tg.methods.allowance(vestingmachine.options.address, delaymachine.options.address).encodeABI(), 'uint256', 'vestingmachine', 'delay', 'allowance')
    multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getBalance(vestingmachine.options.address).encodeABI(), 'uint256', 'vestingmachine', 'staking', 'getBalance')
    multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getLockedBalance(vestingmachine.options.address).encodeABI(), 'uint256', 'vestingmachine', 'staking','getLockedBalance')
    multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getLockingInfo(vestingmachine.options.address).encodeABI(), [{ type: 'uint256', name: 'amount' }, { type: 'uint256', name: 'untilTimestamp' }], 'vestingmachine', 'staking', 'getLockingInfo')
    multiCallRequest.aggregate(delaymachine, delaymachine.methods.getTransactions(vestingmachine.options.address).encodeABI(), [{ type: 'uint256[]', name: 'ids' }, { type: 'uint256[]', name: 'amounts' }, { type: 'uint256[]', name: 'expirations' }], 'vestingmachine', 'delay', 'getTransactions')
    multiCallRequest.aggregate(delaymachine, delaymachine.methods.getBalance(vestingmachine.options.address).encodeABI(), 'uint256', 'vestingmachine', 'delay', 'getBalance')
  }

  let TP
  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    TP = dContracts.contracts.TP[i]
    multiCallRequest.aggregate(TP, TP.methods.balanceOf(userAddress).encodeABI(), 'uint256', 'TP_balance', i)
    multiCallRequest.aggregate(TP, TP.methods.allowance(userAddress, MoCContract.options.address).encodeABI(), 'uint256', 'TP_allowance', i)
  }

  let CA
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    CA = dContracts.contracts.CA[i]
    multiCallRequest.aggregate(CA, CA.methods.balanceOf(userAddress).encodeABI(), 'uint256', 'CA_balance', i)
    multiCallRequest.aggregate(CA, CA.methods.allowance(userAddress, MoCContract.options.address).encodeABI(), 'uint256', 'CA_allowance', i)
  }

  const userBalance = await multiCallRequest.tryBlockAndAggregate();
  //userBalance.blockHeight = multicallResult[0]

  TP = []
  for (let i = 0; i < configProject.tokens.TP.length; i++) {
    TP.push({ balance: userBalance['TP_balance'][i], allowance: userBalance['TP_allowance'][i] })
  }
  userBalance.TP = TP

  CA = []
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    CA.push({ balance: userBalance['CA_balance'][i], allowance: userBalance['CA_allowance'][i] })
  }
  userBalance.CA = CA

  return userBalance
}

const registryAddresses = async (web3, dContracts) => {

  const multicall = dContracts.contracts.multicall
  const iregistry = dContracts.contracts.iregistry

  const multiCallRequest = new MultiCall(multicall, web3)
  multiCallRequest.aggregate(iregistry, iregistry.methods.getAddress(configOmoc.RegistryConstants.MOC_STAKING_MACHINE).encodeABI(), 'address', 'MOC_STAKING_MACHINE')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getAddress(configOmoc.RegistryConstants.SUPPORTERS_ADDR).encodeABI(), 'address', 'SUPPORTERS_ADDR')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getAddress(configOmoc.RegistryConstants.MOC_DELAY_MACHINE).encodeABI(), 'address', 'MOC_DELAY_MACHINE')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getAddress(configOmoc.RegistryConstants.MOC_VESTING_MACHINE).encodeABI(), 'address', 'MOC_VESTING_MACHINE')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getAddress(configOmoc.RegistryConstants.MOC_VOTING_MACHINE).encodeABI(), 'address', 'MOC_VOTING_MACHINE')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getAddress(configOmoc.RegistryConstants.MOC_PRICE_PROVIDER_REGISTRY).encodeABI(), 'address', 'MOC_PRICE_PROVIDER_REGISTRY')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getAddress(configOmoc.RegistryConstants.ORACLE_MANAGER_ADDR).encodeABI(), 'address', 'ORACLE_MANAGER_ADDR')
  multiCallRequest.aggregate(iregistry, iregistry.methods.getAddress(configOmoc.RegistryConstants.MOC_TOKEN).encodeABI(), 'address', 'MOC_TOKEN')

  return await multiCallRequest.tryBlockAndAggregate();
}

export {
  contractStatus,
  userBalance,
  registryAddresses
}
