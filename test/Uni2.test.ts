import {
  ContractFactory,
  Contract,
  ContractReceipt,
  ContractTransaction,
  Event,
} from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Address } from "cluster";
import { ethers } from "hardhat";

describe("NFTPv1 contract", function () {
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  let tokenFactory: ContractFactory;
  let token1: Contract;
  let token2: Contract;
  let uniFactoryFactory: ContractFactory;
  let uniFactory: Contract;
  let uniPairAddress: Address;
  let uniWethFactory: ContractFactory;
  let uniWeth: Contract;
  let uniRouterFactory: ContractFactory;
  let uniRouter: Contract;

  var account2 = ethers.Wallet.createRandom();
  console.log("Uni contracts test");

  before(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    console.log(
      "Created signers: ",
      owner.address,
      addr1.address,
      addr2.address
    );

    // Deploy the Uniswap Router
    uniRouterFactory = await ethers.getContractFactory("UniswapV2Router01");
    uniRouter = await uniRouterFactory.deploy(
      "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
    );
    console.log("Deployed Uni Router");

    await uniRouter.addLiquidity(
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      ethers.BigNumber.from(10000),
      ethers.BigNumber.from(10000),
      0,
      0,
      owner.address,
      Math.round(Date.now() / 1000) + 150
    );

    console.log(await uniRouter.factory());
  });

  describe("Deployment", function () {
    it("Should have set the right token2 symbol", async function () {
      expect(await token2.symbol()).to.equal("DASH");
    });
  });
});
