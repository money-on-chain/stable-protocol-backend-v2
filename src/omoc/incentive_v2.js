import {readJsonFile} from "../utils.js";
import abiDecoder from 'abi-decoder'
import Web3 from "web3";
import {sendTransaction} from "../transaction.js";


const renderEventField = (eveName, eveValue) => {
    const formatItemsWei = new Set([
        'value'
    ])

    if (formatItemsWei.has(eveName)) { eveValue = Web3.utils.fromWei(eveValue) }

    console.log('\x1b[32m%s\x1b[0m', `${eveName}: ${eveValue}`)
}


const renderEvent = (evente) => {
    console.log('')
    console.log('\x1b[35m%s\x1b[0m', `Event: ${evente.name}`)
    console.log('')
    evente.events.forEach(eve => renderEventField(eve.name, eve.value))
}


const decodeEvents = (receipt) => {
    const decodedLogs = abiDecoder.decodeLogs(receipt.logs)

    const filterIncludes = [
        'ClaimOK',
        'VestingCreated'
    ]

    const filteredEvents = decodedLogs.filter(event =>
        filterIncludes.includes(event.name)
    )

    filteredEvents.forEach(evente => renderEvent(evente))

    return filteredEvents
}


const loadContracts = async (web3) => {

    const abiIncentiveV2 = readJsonFile(`./abis/omoc/IncentiveV2.json`)
    const abiVestingFactory = readJsonFile('./abis/omoc/VestingFactory.json')
    const abiIRegistry = readJsonFile('./abis/omoc/IRegistry.json')
    const abiIERC20 = readJsonFile('./abis/omoc/IERC20.json')

    const configOmoc = readJsonFile('./settings/omoc.json')

    console.log('Reading Incentive V2 Contract... address: ', process.env.CONTRACT_INCENTIVE_V2)
    const incentiveV2 = new web3.eth.Contract(abiIncentiveV2.abi, process.env.CONTRACT_INCENTIVE_V2)

    const vestingFactoryAddress = await incentiveV2.methods.getVestingFactory().call()
    console.log(`Vesting Factory Address: ${vestingFactoryAddress}`)
    const iRegistryAddress = await incentiveV2.methods.get_registry().call()
    console.log(`IRegistry Address: ${iRegistryAddress}`)

    console.log('Reading Registry Contract... address: ', iRegistryAddress)
    const iRegistry = new web3.eth.Contract(abiIRegistry.abi, iRegistryAddress)

    console.log('Reading Vesting Factory Contract... address: ', vestingFactoryAddress)
    const vestingFactory = new web3.eth.Contract(abiVestingFactory.abi, vestingFactoryAddress)

    const tokenAddress = await iRegistry.methods.getAddress(configOmoc.RegistryConstants.MOC_TOKEN).call()

    console.log('Reading Token Contract... address: ', tokenAddress)
    const token = new web3.eth.Contract(abiIERC20.abi, tokenAddress)

    const incentiveTokenBalance = await token.methods.balanceOf(process.env.CONTRACT_INCENTIVE_V2).call()
    console.log('Tokens in Incentive V2: ', Web3.utils.fromWei(incentiveTokenBalance))

    // Add abi to decoder to decode events
    abiDecoder.addABI(abiIncentiveV2.abi)
    abiDecoder.addABI(abiVestingFactory.abi)

    return {incentiveV2, vestingFactory}
}


const incentiveStatus = async (web3, accountAddress) => {

    const contracts = await loadContracts(web3)

    let result

    // Vesting Factory

    console.log('')
    console.log('Vesting Factory')
    console.log('===============')
    console.log('')

    result = await contracts.vestingFactory.methods.isTGEConfigured().call()
    console.log(`isTGEConfigured: ${result}`)

    result = await contracts.vestingFactory.methods.getTGETimestamp().call()
    console.log(`getTGETimestamp: ${result}`)

    console.log('')
    console.log('Incentive V2')
    console.log('===============')
    console.log('')

    result = await contracts.incentiveV2.methods.format_claimV2().call()
    console.log(`format_claimV2: ${result}`)

    result = await contracts.incentiveV2.methods.get_registry().call()
    console.log(`Registry: ${result}`)

    result = await contracts.incentiveV2.methods.get_total_in_vestings().call()
    console.log(`get_total_in_vestings: ${result}`)

    result = await contracts.incentiveV2.methods.get_percentages().call()
    console.log(`get_percentages: ${result}`)

    result = await contracts.incentiveV2.methods.get_vesting().call()
    console.log(`get_vesting: ${result}`)

    result = await contracts.incentiveV2.methods.get_deltas().call()
    console.log(`get_deltas: ${result}`)

    result = await contracts.incentiveV2.methods.get_chainId().call()
    console.log(`get_chainId: ${result}`)

    result = await contracts.incentiveV2.methods.owner().call()
    console.log(`owner: ${result}`)

    result = await contracts.incentiveV2.methods.governor().call()
    console.log(`governor: ${result}`)

    result = await contracts.incentiveV2.methods.addrEncode(accountAddress).call()
    console.log(`addrEncode: ${result}`)

    result = await contracts.incentiveV2.methods.get_balance(accountAddress).call()
    console.log(`get_balance: ${result}`)

}

const claimV2 = async (web3, signDataResponse) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const contracts = await loadContracts(web3)
    const incentiveV2Address = contracts.incentiveV2.options.address
    const valueToSend = null

    const signature = signDataResponse;
    const r = '0x' + signature.slice(2).slice(0, 64);
    const s = '0x' + signature.slice(2).slice(64, 128);
    const v = Number.parseInt(signature.slice(2).slice(128), 16);

    // Calculate estimate gas cost
    const estimateGas = await contracts.incentiveV2.methods
        .claimV2([v], [r], [s])
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = contracts.incentiveV2.methods
        .claimV2([v], [r], [s])
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, incentiveV2Address)

    const filteredEventsIncentive = decodeEvents(receipt)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEventsIncentive }
}


const recoverMessage = async (web3, sourceData, chainId) => {

    try {
        const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
        const fromAddress = userAddress.slice(2);
        const code = `:OMoC:${chainId}:address:${fromAddress}`;
        const recoveredAddress = web3.eth.accounts.recover(code, sourceData);
        return recoveredAddress.toLowerCase();
    } catch (err) {
        console.error(err);
    }

}


export {
    incentiveStatus,
    claimV2,
    recoverMessage
}
