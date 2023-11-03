// Redeem Collateral Token

import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v2/contracts.js'
import { redeemTC } from '../../src/moc-v2/moc-rc20.js'

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain connection to all contracts
    const dContracts = await readContracts(web3, configProject)

    // Get amount from environment
    const qTC = `${process.env.OPERATION_AMOUNT_REDEEM_TC}`

    const { receipt, filteredEvents } = await redeemTC(web3, dContracts, configProject, qTC)

}

main()
