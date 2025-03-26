import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v2/contracts.js'
import { sendTransaction } from '../../src/transaction.js'
import { toContractPrecisionDecimals } from "../../src/utils.js";
import BigNumber from 'bignumber.js';


dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]
    
    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

   // Obtain all contracts
   const dContracts = await readContracts(web3, configProject)

    // Send transaction and get receipt
    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()

    const tpIndex = 0
    const newPrice = "1"
    
    const valueToSend = null
    const priceProvider = dContracts.contracts.PP_TP[tpIndex]

  // Calculate estimate gas cost
  const estimateGas = await priceProvider.methods
      .poke(toContractPrecisionDecimals(new BigNumber(newPrice), 18))
      .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = priceProvider.methods
  .poke(toContractPrecisionDecimals(new BigNumber(newPrice), 18))
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(
      web3,
      valueToSend,
      estimateGas,
      encodedCall,
      priceProvider.options.address
  )

  
  console.log(`Transaction hash: ${receipt.transactionHash}`)
  const { '0': price } = await priceProvider.methods.peek().call()
  console.log(`Reading new price: ${new BigNumber(price)}`)
  
}

main()