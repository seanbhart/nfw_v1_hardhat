// /**
//  * @type import('hardhat/config').HardhatUserConfig
//  */
// import "tsconfig-paths/register";

// module.exports = {
//   solidity: "0.7.3",
// };

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        // version: "0.7.6",
        version: "0.8.6",
        settings: {},
      },
    ],
  },
  networks: {
    kovan: {
      url: `${process.env.NETWORK}`,
      accounts: [`0x${process.env.ACCOUNT_KEY_PRIV}`],
      // gas: 12000000,
      // blockGasLimit: 0x1fffffffffffff,
      // allowUnlimitedContractSize: true,
      // timeout: 1800000,
    },
  },
  gasReporter: {
    enabled: true,
    coinmarketcap: "3a70c918-991b-4402-8016-c6ba1ca65a13",
    currency: "USD",
    gasPrice: 30,
  },
};

export default config;
