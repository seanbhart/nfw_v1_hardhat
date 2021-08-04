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
import { Bytes } from "ethers";
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
  let uniPairFactory: ContractFactory;
  let uniPair: Contract;
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

    // Deploy the test ERC20 token
    tokenFactory = await ethers.getContractFactory("NFW_ERC20");
    token1 = await tokenFactory.deploy("BASH token", "BASH", owner.address);
    token2 = await tokenFactory.deploy("DASH token", "DASH", owner.address);
    console.log("Deployed tokens: ", token1.address, token2.address);

    // Deploy the Uniswap Pair Factory
    uniFactoryFactory = await ethers.getContractFactory("UniswapV2Factory");
    uniFactory = await uniFactoryFactory.deploy(owner.address);
    console.log("uniFactory: ", uniFactory.address);
    let initCodeHash: Bytes = await uniFactory.INIT_CODE_PAIR_HASH();
    console.log("uniFactory INIT_CODE_PAIR_HASH: ", initCodeHash);

    // Create the token pair
    let tx: ContractTransaction = await uniFactory.createPair(
      token1.address,
      token2.address
    );

    let receipt: ContractReceipt = await tx.wait();
    let foundEvents = receipt.events?.filter((x) => {
      return x.event == "PairCreated";
    });
    let events = foundEvents as Event[];
    uniPairAddress = events[0].args?.pair;
    console.log("uniPairAddress: ", uniPairAddress);
    // let pairCheck = await uniFactory.getPair(token1.address, token2.address);
    // console.log("Uni pair: ", pairCheck);
    uniPairFactory = await ethers.getContractFactory("UniswapV2Pair");
    uniPair = uniPairFactory.attach(uniPairAddress.toString());

    // Deploy WETH
    uniWethFactory = await ethers.getContractFactory("WETH9");
    uniWeth = await uniWethFactory.deploy();
    console.log("Deployed WETH: ", uniWeth.address);

    // Deploy the Uniswap Router
    console.log(
      "Deploying Uni Router: ",
      uniFactory.address,
      " ",
      uniWeth.address
    );
    uniRouterFactory = await ethers.getContractFactory("UniswapV2Router01");
    uniRouter = await uniRouterFactory.deploy(
      uniFactory.address,
      uniWeth.address
    );
    console.log("Deployed Uni Router");
    console.log(await uniRouter.factory());
  });

  describe("Deployment", function () {
    it("Should have set the right token2 symbol", async function () {
      expect(await token2.symbol()).to.equal("DASH");
    });
  });

  describe("Liquidity", function () {
    it("Should have 40000 of each token in Uni pair", async function () {
      await token1.approve(uniRouter.address, 40000);
      await token2.approve(uniRouter.address, 40000);
      await uniRouter.addLiquidity(
        token1.address,
        token2.address,
        // ethers.BigNumber.from(10000),
        // ethers.BigNumber.from(10000),
        40000,
        40000,
        0,
        0,
        owner.address,
        Math.round(Date.now() / 1000) + 15
      );
      const [reserve0, reserve1, timestamp] = await uniPair.getReserves();
      expect(reserve0).to.equal(40000);
      expect(reserve1).to.equal(40000);
    });
  });
});
