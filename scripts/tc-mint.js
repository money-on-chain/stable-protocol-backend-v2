// Mint Collateral Token

import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../src/utils.js'
import { readContracts } from '../src/moc-v2/contracts.js'
import { mintTC } from '../src/moc-v2/moc-collateral-bag.js'

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts from one address of the MoC.sol
    const dContracts = await readContracts(web3, configProject)

    // Get amount from environment
    const qTC = `${process.env.OPERATION_AMOUNT_MINT_TC}`
    const caIndex = 0

    const { receipt, filteredEvents } = await mintTC(web3, dContracts, configProject, caIndex, qTC)

}

main()
