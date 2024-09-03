import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../../src/utils.js'
import {
    claimV2
} from '../../../src/omoc/incentive_v2.js'


dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    const parameters = {
        '_sigV': '',
        '_sigR': '',
        '_sigS': ''
    }

    // Send transaction and get receipt
    const { receipt, filteredEvents } = await claimV2(web3, parameters)
}

main()
