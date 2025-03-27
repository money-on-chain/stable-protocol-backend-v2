import BigNumber from 'bignumber.js'
import {fromContractPrecisionDecimals, readJsonFile} from '../utils.js'
import Web3 from "web3";

// getting constants from omoc.json
const configOmoc = readJsonFile('./settings/omoc.json')


const onErrorLeverage = () => {
  const value = new BigNumber(
    115792089237316200000000000000000000000000000000000000
  );
  console.warn("WARN: Leverage too high!");
  return { value, canOperate: true };
};

const onErrorProposal = () => {
  console.warn("Proposal not exist");
  return { value: null, canOperate: true };
};

const onErrorTP = () => {
  return { value: null, canOperate: true };
};

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
  aggregate(
    contract,
    encodeABI,
    resultType,
    keyName,
    keyIndex,
    keySubIndex,
    onError
  ) {
    this.calls.push([
      contract.options.address,
      encodeABI,
      resultType,
      keyName,
      keyIndex,
      keySubIndex,
      onError,
    ]);
  }
  async tryBlockAndAggregate(blockNumber) {
    // Remove decode result parameter
    const cleanListMethods = this.calls.map((x) => [x[0], x[1]]);
    const multiCallResult = await this.multicall.methods
      .tryBlockAndAggregate(false, cleanListMethods)
      .call({}, blockNumber);

    let canOperate = true;

    const calls = this.calls;
    const storage = this.storage;
    const web3 = this.web3;

    storage["blockHeight"] = multiCallResult[0];

    multiCallResult.returnData.forEach(function (item, itemIndex) {
      let value;
      const resultType = calls[itemIndex][2];
      const keyName = calls[itemIndex][3];
      const keyIndex = calls[itemIndex][4];
      const keySubIndex = calls[itemIndex][5];
      const onError = calls[itemIndex][6];

      // ON success
      if (item.success) {
        if (typeof resultType === "string") {
          value = web3.eth.abi.decodeParameter(
            resultType,
            item.returnData
          );
        } else {
          value = web3.eth.abi.decodeParameters(
            resultType,
            item.returnData
          );
        }
      } else {
        if (onError !== undefined) {
          const resError = onError();
          value = resError["value"];
          canOperate = resError["canOperate"];
        } else {
          // Not Ok Error on calling
          if (resultType === "uint256") {
            value = "0";
          } else if (resultType === "address") {
            value = "0x";
          } else if (resultType === "bool") {
            value = false;
          }
          // If there are any problems can not operate
          canOperate = false;
          console.warn(
            "WARN: Cannot operate! Index query:",
            itemIndex
          );
        }
      }

      if (keyIndex != null && keySubIndex != null) {
        if (!storage[keyName]) {
          if (keyName === parseInt(keyName, 10)) {
            storage[keyName] = [];
          } else {
            storage[keyName] = {};
          }
        }
        if (!storage[keyName][keyIndex]) {
          if (keyIndex === parseInt(keyIndex, 10)) {
            storage[keyName][keyIndex] = [];
          } else {
            storage[keyName][keyIndex] = {};
          }
        }
        storage[keyName][keyIndex][keySubIndex] = value;
      } else if (keyIndex != null) {
        if (!storage[keyName]) {
          if (keyName === parseInt(keyName, 10)) {
            storage[keyName] = [];
          } else {
            storage[keyName] = {};
          }
        }
        storage[keyName][keyIndex] = value;
      } else {
        storage[keyName] = value;
      }
    });

    storage["canOperate"] = canOperate;

    return storage;
  }
}

const contractStatus = async (web3, dContracts, configProject) => {

  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const multicall = dContracts.contracts.multicall
  const PP_COINBASE = dContracts.contracts.PP_COINBASE
  const MocMultiCollateralGuard = dContracts.contracts.MocMultiCollateralGuard

  // OMOC
  let iregistry
  let stakingmachine
  let delaymachine
  let supporters
  let votingmachine
  let tg
  let proposalCountVoting
  if (typeof process.env.CONTRACT_IREGISTRY !== 'undefined') {
    iregistry = dContracts.contracts.iregistry
    stakingmachine = dContracts.contracts.stakingmachine
    delaymachine = dContracts.contracts.delaymachine
    supporters = dContracts.contracts.supporters
    votingmachine = dContracts.contracts.votingmachine
    tg = dContracts.contracts.tg
    proposalCountVoting = await votingmachine.methods.getProposalCount().call()
  }

  const multiCallRequest = new MultiCall(multicall, web3)

  const currentBlockNumber =  await multicall.methods.getBlockNumber().call()
  let contractMocType
  let Moc
  let MocVendors
  let MocQueue
  let PP_FeeToken
  let FC_MAX_ABSOLUTE_OP_PROVIDER
  let FC_MAX_OP_DIFFERENCE_PROVIDER

  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    contractMocType = configProject.tokens.CA[i].type
    Moc = dContracts.contracts.Moc[i]
    MocVendors = dContracts.contracts.MocVendors[i]
    MocQueue = dContracts.contracts.MocQueue[i]
    PP_FeeToken = dContracts.contracts.PP_FeeToken[i]
    FC_MAX_ABSOLUTE_OP_PROVIDER = dContracts.contracts.FC_MAX_ABSOLUTE_OP_PROVIDER[i]
    FC_MAX_OP_DIFFERENCE_PROVIDER = dContracts.contracts.FC_MAX_OP_DIFFERENCE_PROVIDER[i]

    multiCallRequest.aggregate(Moc, Moc.methods.protThrld().encodeABI(), 'uint256', i, 'protThrld')
    multiCallRequest.aggregate(Moc, Moc.methods.liqThrld().encodeABI(), 'uint256', i, 'liqThrld')
    multiCallRequest.aggregate(Moc, Moc.methods.liqEnabled().encodeABI(), 'bool', i, 'liqEnabled')
    multiCallRequest.aggregate(Moc, Moc.methods.liquidated().encodeABI(), 'bool', i, 'liquidated')
    multiCallRequest.aggregate(Moc, Moc.methods.nACcb().encodeABI(), 'uint256', i,'nACcb')
    multiCallRequest.aggregate(Moc, Moc.methods.tcToken().encodeABI(), 'address', i, 'tcToken')
    multiCallRequest.aggregate(Moc, Moc.methods.nTCcb().encodeABI(), 'uint256', i, 'nTCcb')
    multiCallRequest.aggregate(Moc, Moc.methods.successFee().encodeABI(), 'uint256', i,'successFee')
    multiCallRequest.aggregate(Moc, Moc.methods.appreciationFactor().encodeABI(), 'uint256', i,'appreciationFactor')
    multiCallRequest.aggregate(Moc, Moc.methods.feeRetainer().encodeABI(), 'uint256', i, 'feeRetainer')
    multiCallRequest.aggregate(Moc, Moc.methods.tcMintFee().encodeABI(), 'uint256', i, 'tcMintFee')
    multiCallRequest.aggregate(Moc, Moc.methods.tcRedeemFee().encodeABI(), 'uint256', i, 'tcRedeemFee')
    multiCallRequest.aggregate(Moc, Moc.methods.swapTPforTPFee().encodeABI(), 'uint256', i,'swapTPforTPFee')
    multiCallRequest.aggregate(Moc, Moc.methods.swapTPforTCFee().encodeABI(), 'uint256', i, 'swapTPforTCFee')
    multiCallRequest.aggregate(Moc, Moc.methods.swapTCforTPFee().encodeABI(), 'uint256', i, 'swapTCforTPFee')
    multiCallRequest.aggregate(Moc, Moc.methods.redeemTCandTPFee().encodeABI(), 'uint256', i, 'redeemTCandTPFee')
    multiCallRequest.aggregate(Moc, Moc.methods.mintTCandTPFee().encodeABI(), 'uint256', i, 'mintTCandTPFee')
    multiCallRequest.aggregate(Moc, Moc.methods.mocFeeFlowAddress().encodeABI(), 'address', i, 'mocFeeFlowAddress')
    multiCallRequest.aggregate(Moc, Moc.methods.mocAppreciationBeneficiaryAddress().encodeABI(), 'address', i, 'mocAppreciationBeneficiaryAddress')
    multiCallRequest.aggregate(Moc, Moc.methods.isLiquidationReached().encodeABI(), 'bool', i, 'isLiquidationReached')
    multiCallRequest.aggregate(Moc, Moc.methods.getPTCac().encodeABI(), 'uint256', i, 'getPTCac')
    multiCallRequest.aggregate(Moc, Moc.methods.getCglb().encodeABI(), 'uint256', i, 'getCglb')
    multiCallRequest.aggregate(Moc, Moc.methods.getLckAC().encodeABI(), 'uint256', i, 'getLckAC')
    multiCallRequest.aggregate(Moc, Moc.methods.getTCAvailableToRedeem().encodeABI(), 'uint256', i, 'getTCAvailableToRedeem')
    multiCallRequest.aggregate(Moc, Moc.methods.getTotalACavailable().encodeABI(), 'uint256', i, 'getTotalACavailable')
    //multiCallRequest.aggregate(Moc, Moc.methods.getLeverageTC().encodeABI(), 'uint256', 'getLeverageTC', null, null, onErrorLeverage)
    multiCallRequest.aggregate(Moc, Moc.methods.nextEmaCalculation().encodeABI(), 'uint256', i, 'nextEmaCalculation')
    multiCallRequest.aggregate(Moc, Moc.methods.emaCalculationTimeSpan().encodeABI(), 'uint256', i, 'emaCalculationTimeSpan')
    multiCallRequest.aggregate(Moc, Moc.methods.getCtargemaCA().encodeABI(), 'uint256', i, 'getCtargemaCA')
    multiCallRequest.aggregate(Moc, Moc.methods.shouldCalculateEma().encodeABI(), 'bool', i, 'shouldCalculateEma')
    multiCallRequest.aggregate(Moc, Moc.methods.settlementTimeSpan().encodeABI(), 'uint256', i, 'settlementTimeSpan')
    multiCallRequest.aggregate(Moc, Moc.methods.nextSettlementTime().encodeABI(), 'uint256', i, 'nextSettlementTime')
    //multiCallRequest.aggregate(Moc, Moc.methods.getBts().encodeABI(), 'uint256', 'getBts')
    multiCallRequest.aggregate(MocVendors, MocVendors.methods.vendorsGuardianAddress().encodeABI(), 'address', i, 'vendorGuardianAddress')
    multiCallRequest.aggregate(Moc, Moc.methods.feeTokenPct().encodeABI(), 'uint256', i, 'feeTokenPct')
    multiCallRequest.aggregate(Moc, Moc.methods.feeToken().encodeABI(), 'address', i, 'feeToken')
    multiCallRequest.aggregate(Moc, Moc.methods.feeTokenPriceProvider().encodeABI(), 'address', i, 'feeTokenPriceProvider')
    multiCallRequest.aggregate(Moc, Moc.methods.tcInterestCollectorAddress().encodeABI(), 'address', i, 'tcInterestCollectorAddress')
    multiCallRequest.aggregate(Moc, Moc.methods.tcInterestRate().encodeABI(), 'uint256', i, 'tcInterestRate')
    multiCallRequest.aggregate(Moc, Moc.methods.tcInterestPaymentTimeSpan().encodeABI(), 'uint256', i, 'tcInterestPaymentTimeSpan')
    multiCallRequest.aggregate(Moc, Moc.methods.nextTCInterestPayment().encodeABI(), 'uint256', i, 'nextTCInterestPayment')
    multiCallRequest.aggregate(PP_FeeToken, PP_FeeToken.methods.peek().encodeABI(), 'uint256', i, 'PP_FeeToken')
    multiCallRequest.aggregate(MocVendors, MocVendors.methods.vendorMarkup(vendorAddress).encodeABI(), 'uint256', i, 'vendorMarkup')
    multiCallRequest.aggregate(PP_COINBASE, PP_COINBASE.methods.peek().encodeABI(), 'uint256', i, 'PP_COINBASE')
    multiCallRequest.aggregate(Moc, Moc.methods.maxAbsoluteOpProvider().encodeABI(), 'address', i, 'maxAbsoluteOpProvider')
    multiCallRequest.aggregate(Moc, Moc.methods.maxOpDiffProvider().encodeABI(), 'address', i, 'maxOpDiffProvider')
    multiCallRequest.aggregate(Moc, Moc.methods.decayTimeSpan().encodeABI(), 'uint256', i, 'decayTimeSpan')
    multiCallRequest.aggregate(Moc, Moc.methods.absoluteAccumulator().encodeABI(), 'uint256', i, 'absoluteAccumulator')
    multiCallRequest.aggregate(Moc, Moc.methods.differentialAccumulator().encodeABI(), 'uint256', i, 'differentialAccumulator')
    multiCallRequest.aggregate(Moc, Moc.methods.lastOperationTimeStamp().encodeABI(), 'uint256', i, 'lastOperationTimeStamp')
    multiCallRequest.aggregate(Moc, Moc.methods.qACLockedInPending().encodeABI(), 'uint256', i, 'qACLockedInPending')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.operIdCount().encodeABI(), 'uint256', i, 'operIdCount')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.firstOperId().encodeABI(), 'uint256', i, 'firstOperId')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.minOperWaitingBlk().encodeABI(), 'uint256', i, 'minOperWaitingBlk')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.maxOperWaitingBlk().encodeABI(), 'uint256', i, 'maxOperWaitingBlk')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.isEmpty().encodeABI(), 'bool', i, 'isEmpty')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.execCost(1).encodeABI(), 'uint256', i, 'tcMintExecCost')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.execCost(2).encodeABI(), 'uint256', i, 'tcRedeemExecCost')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.execCost(3).encodeABI(), 'uint256', i, 'tpMintExecCost')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.execCost(4).encodeABI(), 'uint256', i, 'tpRedeemExecCost')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.execCost(9).encodeABI(), 'uint256', i, 'swapTPforTPExecCost')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.execCost(8).encodeABI(), 'uint256', i, 'swapTPforTCExecCost')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.execCost(7).encodeABI(), 'uint256', i, 'swapTCforTPExecCost')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.execCost(6).encodeABI(), 'uint256', i, 'redeemTCandTPExecCost')
    multiCallRequest.aggregate(MocQueue, MocQueue.methods.execCost(5).encodeABI(), 'uint256', i, 'mintTCandTPExecCost')
    multiCallRequest.aggregate(FC_MAX_ABSOLUTE_OP_PROVIDER, FC_MAX_ABSOLUTE_OP_PROVIDER.methods.peek().encodeABI(), 'uint256', i, 'FC_MAX_ABSOLUTE_OP')
    multiCallRequest.aggregate(FC_MAX_OP_DIFFERENCE_PROVIDER, FC_MAX_OP_DIFFERENCE_PROVIDER.methods.peek().encodeABI(), 'uint256', i, 'FC_MAX_OP_DIFFERENCE')
    multiCallRequest.aggregate(Moc, Moc.methods.maxQACToMintTP(currentBlockNumber).encodeABI(), 'uint256', i, 'maxQACToMintTP')
    multiCallRequest.aggregate(Moc, Moc.methods.maxQACToRedeemTP(currentBlockNumber).encodeABI(), 'uint256', i, 'maxQACToRedeemTP')
    multiCallRequest.aggregate(Moc, Moc.methods.paused().encodeABI(), 'bool', i, 'paused')
    multiCallRequest.aggregate(MocMultiCollateralGuard, MocMultiCollateralGuard.methods.getRealTCAvailableToRedeem(Moc.options.address).encodeABI(), 'uint256', i, 'getRealTCAvailableToRedeem')

    // only on coinbase mode
    if (contractMocType === 'coinbase') {
      multiCallRequest.aggregate(Moc, Moc.methods.transferMaxGas().encodeABI(), 'uint256', i, 'transferMaxGas')
      multiCallRequest.aggregate(Moc, Moc.methods.coinbaseFailedTransferFallback().encodeABI(), 'address', i, 'coinbaseFailedTransferFallback')
    }

  }

  multiCallRequest.aggregate(MocMultiCollateralGuard, MocMultiCollateralGuard.methods.maxOperPerBatch().encodeABI(), 'uint256', 'maxOperPerBatch')
  multiCallRequest.aggregate(MocMultiCollateralGuard, MocMultiCollateralGuard.methods.getCombinedCglb().encodeABI(), 'uint256', 'getCombinedCglb')
  multiCallRequest.aggregate(MocMultiCollateralGuard, MocMultiCollateralGuard.methods.getCombinedCtargemaCA().encodeABI(), 'uint256', 'getCombinedCtargemaCA')
  multiCallRequest.aggregate(MocMultiCollateralGuard, MocMultiCollateralGuard.methods.getLastPublicationBlock(true /*TODO: read useMaxLastPublicationBlock param*/).encodeABI(), 'uint256', 'getLastPublicationBlock')


  // OMOC
  if (typeof iregistry !== 'undefined') {
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
    multiCallRequest.aggregate(tg, tg.methods.totalSupply().encodeABI(), 'uint256', 'votingmachine', 'totalSupply')

    // Proposals
    let indexProp
    for (let i = 1; i < 50; i++) {
      if (proposalCountVoting - i >= 0) {
        indexProp = proposalCountVoting - i
        multiCallRequest.aggregate(votingmachine, votingmachine.methods.getProposalByIndex(indexProp).encodeABI(), [{ type: 'address', name: 'proposalAddress' }, { type: 'uint256', name: 'votingRound' }, { type: 'uint256', name: 'votes' }, { type: 'uint256', name: 'expirationTimeStamp' }], 'votingmachine', 'getProposalByIndex', indexProp, onErrorProposal)
      }
    }

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
  }

  // PP TP
  let PP_TP
  let tpAddress
  for (let ca = 0; ca < configProject.tokens.CA.length; ca++) {
    for (let i = 0; i < configProject.tokens.TP.length; i++) {
      Moc = dContracts.contracts.Moc[ca]
      tpAddress = dContracts.contracts.TP[i].options.address
      PP_TP = dContracts.contracts.PP_TP[i]

      multiCallRequest.aggregate(Moc, Moc.methods.tpMintFees(tpAddress).encodeABI(), 'uint256', ca, 'tpMintFees', i)
      multiCallRequest.aggregate(Moc, Moc.methods.tpRedeemFees(tpAddress).encodeABI(), 'uint256', ca, 'tpRedeemFees', i)
      multiCallRequest.aggregate(Moc, Moc.methods.tpCtarg(i).encodeABI(), 'uint256', ca, 'tpCtarg', i)
      multiCallRequest.aggregate(Moc, Moc.methods.pegContainer(i).encodeABI(), 'uint256', ca, 'pegContainer', i)
      multiCallRequest.aggregate(PP_TP, PP_TP.methods.peek().encodeABI(), 'uint256', ca, 'PP_TP', i)
      multiCallRequest.aggregate(Moc, Moc.methods.getPACtp(tpAddress).encodeABI(), 'uint256', ca, 'getPACtp', i)
      multiCallRequest.aggregate(Moc, Moc.methods.getTPAvailableToMint(tpAddress).encodeABI(), 'int256', ca, 'getTPAvailableToMint', i)
      multiCallRequest.aggregate(Moc, Moc.methods.tpEma(i).encodeABI(), 'uint256', ca, 'tpEma', i)
      multiCallRequest.aggregate(MocMultiCollateralGuard, MocMultiCollateralGuard.methods.getRealTPAvailableToMint(Moc.options.address, tpAddress).encodeABI(), 'uint256', ca, 'getRealTPAvailableToMint', i)
    }
  }

  // PP CA
  let PP_CA
  let CA
  let countRC20 = 0
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    PP_CA = dContracts.contracts.PP_CA[i]
    Moc = dContracts.contracts.Moc[i]
    contractMocType = configProject.tokens.CA[i].type

    if (contractMocType === 'coinbase') {
      multiCallRequest.aggregate(multicall, multicall.methods.getEthBalance(Moc.options.address).encodeABI(), 'uint256', 'getACBalance', i)
    } else {
      CA = dContracts.contracts.CA[countRC20]
      multiCallRequest.aggregate(CA, CA.methods.balanceOf(Moc.options.address).encodeABI(), 'uint256', 'getACBalance', i)
      countRC20++;
    }
    multiCallRequest.aggregate(PP_CA, PP_CA.methods.peek().encodeABI(), 'uint256', 'PP_CA', i)
  }

  console.log('Reading contract status ...')

  const status = await multiCallRequest.tryBlockAndAggregate();

  status.getTokenPrice = new BigNumber('0')
  const getCtargemaCA = new BigNumber(
      fromContractPrecisionDecimals(
          status.getCtargemaCA,
          18
      )
  );
  if (getCtargemaCA.gt(1000000)) {
    status.canOperate = false
  }

  // Multicall History Price
  const d24BlockHeights = status.blockHeight - process.env.BLOCK_SPAN_HISTORIC;
  const multiCallRequestHistory = new MultiCall(multicall, web3)

  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    Moc = dContracts.contracts.Moc[i]
    multiCallRequestHistory.aggregate(Moc, Moc.methods.getPTCac().encodeABI(), 'uint256', i, 'getPTCac')
    multiCallRequestHistory.aggregate(PP_COINBASE, PP_COINBASE.methods.peek().encodeABI(), 'uint256', i, 'PP_COINBASE')
    multiCallRequestHistory.aggregate(PP_FeeToken, PP_FeeToken.methods.peek().encodeABI(), 'uint256', i, 'PP_FeeToken')
  }

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

  return status
}

const userBalance = async (web3, dContracts, userAddress, configProject) => {
  const collateral = configProject.collateral

  const multicall = dContracts.contracts.multicall

  let stakingmachine
  let delaymachine
  let tg
  let vestingmachine
  let vestingfactory
  let votingmachine
  if (typeof process.env.CONTRACT_IREGISTRY !== 'undefined') {
    stakingmachine = dContracts.contracts.stakingmachine
    delaymachine = dContracts.contracts.delaymachine
    tg = dContracts.contracts.tg
    vestingmachine = dContracts.contracts.vestingmachine
    vestingfactory = dContracts.contracts.vestingfactory
    votingmachine = dContracts.contracts.votingmachine
  }

  console.log(`Reading user balance ... account: ${userAddress}`)

  const multiCallRequest = new MultiCall(multicall, web3)
  multiCallRequest.aggregate(multicall, multicall.methods.getEthBalance(userAddress).encodeABI(), 'uint256', 'coinbase')

  let Moc
  let CollateralToken
  let FeeToken
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    Moc = dContracts.contracts.Moc[i]
    CollateralToken = dContracts.contracts.CollateralToken[i]
    FeeToken = dContracts.contracts.FeeToken[i]
    multiCallRequest.aggregate(CollateralToken, CollateralToken.methods.balanceOf(userAddress).encodeABI(), 'uint256', i, 'TC', 'balance')
    multiCallRequest.aggregate(CollateralToken, CollateralToken.methods.allowance(userAddress, Moc.options.address).encodeABI(), 'uint256', i, 'TC', 'allowance')
    multiCallRequest.aggregate(FeeToken, FeeToken.methods.balanceOf(userAddress).encodeABI(), 'uint256', i, 'FeeToken', 'balance')
    multiCallRequest.aggregate(FeeToken, FeeToken.methods.allowance(userAddress, Moc.options.address).encodeABI(), 'uint256', i, 'FeeToken', 'allowance')
  }

  // OMOC
  if (typeof stakingmachine !== 'undefined') {

    multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getBalance(userAddress).encodeABI(), 'uint256', 'stakingmachine', 'getBalance')
    multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getLockedBalance(userAddress).encodeABI(), 'uint256', 'stakingmachine', 'getLockedBalance')
    multiCallRequest.aggregate(stakingmachine, stakingmachine.methods.getLockingInfo(userAddress).encodeABI(), [{ type: 'uint256', name: 'amount' }, { type: 'uint256', name: 'untilTimestamp' }], 'stakingmachine', 'getLockingInfo')
    multiCallRequest.aggregate(delaymachine, delaymachine.methods.getTransactions(userAddress).encodeABI(), [{ type: 'uint256[]', name: 'ids' }, { type: 'uint256[]', name: 'amounts' }, { type: 'uint256[]', name: 'expirations' }], 'delaymachine', 'getTransactions')
    multiCallRequest.aggregate(delaymachine, delaymachine.methods.getBalance(userAddress).encodeABI(), 'uint256', 'delaymachine', 'getBalance')
    multiCallRequest.aggregate(tg, tg.methods.balanceOf(userAddress).encodeABI(), 'uint256', 'tgBalance')
    multiCallRequest.aggregate(tg, tg.methods.allowance(userAddress, stakingmachine.options.address).encodeABI(), 'uint256', 'stakingmachine', 'tgAllowance')
    multiCallRequest.aggregate(votingmachine, votingmachine.methods.getUserVote(userAddress).encodeABI(), [{ type: 'address', name: 'voteAddress' }, { type: 'uint256', name: 'voteRound' }], 'votingmachine', 'getUserVote')

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
  }

  let TP
  for (let ca = 0; ca < configProject.tokens.CA.length; ca++) {
    for (let i = 0; i < configProject.tokens.TP.length; i++) {
      TP = dContracts.contracts.TP[i]
      Moc = dContracts.contracts.Moc[i]
      multiCallRequest.aggregate(TP, TP.methods.balanceOf(userAddress).encodeABI(), 'uint256', ca, 'TP_balance', i)
      multiCallRequest.aggregate(TP, TP.methods.allowance(userAddress, Moc.options.address).encodeABI(), 'uint256', ca, 'TP_allowance', i)
    }
  }

  let CA
  let contractMocType
  for (let i = 0; i < configProject.tokens.CA.length; i++) {
    // RC-20 collateral Only
    contractMocType = configProject.tokens.CA[i].type
    if (contractMocType !== 'coinbase')  {
      Moc = dContracts.contracts.Moc[i]
      CA = dContracts.contracts.CA[i]
      multiCallRequest.aggregate(CA, CA.methods.balanceOf(userAddress).encodeABI(), 'uint256', 'CA_balance', i)
      multiCallRequest.aggregate(CA, CA.methods.allowance(userAddress, Moc.options.address).encodeABI(), 'uint256', 'CA_allowance', i)
    }
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
    contractMocType = configProject.tokens.CA[i].type
    if (contractMocType === 'coinbase')  {
      CA.push({ balance: userBalance['coinbase'], allowance: userBalance['coinbase'] })
    } else {
      CA.push({ balance: userBalance['CA_balance'][i], allowance: userBalance['CA_allowance'][i] })
    }
  }


  userBalance.CA = CA
  userBalance.userAddress = userAddress;
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


const mocAddresses = async (web3, dContracts, contractMoc, contractMocType) => {

  const multicall = dContracts.contracts.multicall

  const multiCallRequest = new MultiCall(multicall, web3)
  multiCallRequest.aggregate(contractMoc, contractMoc.methods.feeToken().encodeABI(), 'address', 'feeToken')
  multiCallRequest.aggregate(contractMoc, contractMoc.methods.feeTokenPriceProvider().encodeABI(), 'address', 'feeTokenPriceProvider')

  if (contractMocType !== 'coinbase') {
    multiCallRequest.aggregate(contractMoc, contractMoc.methods.acToken().encodeABI(), 'address', 'acToken')
  }

  multiCallRequest.aggregate(contractMoc, contractMoc.methods.tcToken().encodeABI(), 'address', 'tcToken')
  multiCallRequest.aggregate(contractMoc, contractMoc.methods.maxAbsoluteOpProvider().encodeABI(), 'address', 'maxAbsoluteOpProvider')
  multiCallRequest.aggregate(contractMoc, contractMoc.methods.maxOpDiffProvider().encodeABI(), 'address', 'maxOpDiffProvider')
  multiCallRequest.aggregate(contractMoc, contractMoc.methods.mocQueue().encodeABI(), 'address', 'mocQueue')
  multiCallRequest.aggregate(contractMoc, contractMoc.methods.mocVendors().encodeABI(), 'address', 'mocVendors')

  const MAX_LEN_ARRAY_TP = 4;
  for (let i = 0; i < MAX_LEN_ARRAY_TP; i++) {
    multiCallRequest.aggregate(contractMoc, contractMoc.methods.tpTokens(i).encodeABI(), 'address', 'tpTokens', i, null, onErrorTP)
  }

  return await multiCallRequest.tryBlockAndAggregate();
}

export {
  contractStatus,
  userBalance,
  registryAddresses,
  mocAddresses
}
