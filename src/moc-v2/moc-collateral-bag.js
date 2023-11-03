import { mintTC as mintTC_, redeemTC as redeemTC_, mintTP as mintTP_, redeemTP as redeemTP_,
    swapTPforTP as swapTPforTP_, swapTPforTC as swapTPforTC_, swapTCforTP as swapTCforTP_,
    mintTCandTP as mintTCandTP_, redeemTCandTP as redeemTCandTP_ } from "./moc-core"


const mintTC = async (web3, dContracts, configProject, caIndex, qTC) => {
    // Mint Collateral token with CA support vendors
    return mintTC_(web3, dContracts, configProject, caIndex, qTC)
}

const redeemTC = async (web3, dContracts, configProject, caIndex, qTC) => {
    // Redeem Collateral token receiving CA support vendors
    return redeemTC_(web3, dContracts, configProject, caIndex, qTC)
}

const mintTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTP) => {
    // Mint pegged token with collateral CA BAG support vendor
    return mintTP_(web3, dContracts, configProject, caIndex, tpIndex, qTP)
}

const redeemTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTP) => {
    // Redeem pegged token receiving CA support vendor
    return redeemTP_(web3, dContracts, configProject, caIndex, tpIndex, qTP)
}

const swapTPforTP = async (web3, dContracts, configProject, iFromTP, iToTP, qTP, caIndex) => {
    // caller sends a Pegged Token and receives another one support vendor
    return swapTPforTP_(web3, dContracts, configProject, iFromTP, iToTP, qTP, caIndex)
}

const swapTPforTC = async (web3, dContracts, configProject, caIndex, tpIndex, qTP) => {
    // caller sends a Pegged Token and receives Collateral Token support vendor
    return swapTPforTC_(web3, dContracts, configProject, caIndex, tpIndex, qTP)
}

const swapTCforTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTC) => {
    // caller sends Collateral Token and receives Pegged Token support vendor
    return swapTCforTP_(web3, dContracts, configProject, caIndex, tpIndex, qTC)
}

const mintTCandTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTP) => {
    // caller sends Asset and receives Collateral Token and Pegged Token support vendor
    return mintTCandTP_(web3, dContracts, configProject, caIndex, tpIndex, qTP)
}

const redeemTCandTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTC) => {
    // caller sends Collateral Token and Pegged Token and receives Assets support vendor
    return redeemTCandTP_(web3, dContracts, configProject, caIndex, tpIndex, qTC)
}


export {
    mintTC,
    redeemTC,
    mintTP,
    redeemTP,
    swapTPforTP,
    swapTPforTC,
    swapTCforTP,
    mintTCandTP,
    redeemTCandTP
}
