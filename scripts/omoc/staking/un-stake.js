import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../../src/utils.js'
import { readContracts } from '../../../src/moc-v2/contracts.js'
import { unStake } from '../../../src/omoc/staking.js'
import BigNumber from "bignumber.js";

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts
    const dContracts = await readContracts(web3, configProject)

    const amount = new BigNumber(1)

    // Send transaction and get receipt
    const { receipt, filteredEvents } = await unStake(web3, dContracts, configProject, amount)
}

main()
