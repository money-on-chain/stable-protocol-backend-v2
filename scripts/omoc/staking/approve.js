import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../../src/utils.js'
import { readContracts } from '../../../src/moc-v2/contracts.js'
import { AllowanceUseContract } from '../../../src/moc-v2/moc-base.js'
import BigNumber from "bignumber.js";

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts
    const dContracts = await readContracts(web3, configProject)

    // Token to approve
    const token = dContracts.contracts.tg
    const contract = dContracts.contracts.stakingmachine
    const tokenDecimals = configProject.tokens.FeeToken.decimals
    const amount = new BigNumber(0)

    // Send transaction and get receipt
    const { receipt, filteredEvents } = await AllowanceUseContract(web3, dContracts, configProject, token, contract, amount, tokenDecimals)
}

main()
