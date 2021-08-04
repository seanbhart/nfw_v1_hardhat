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

describe("NFWv1 contract", function () {
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  let tokenFactory: ContractFactory;
  let token1: Contract;
  let token2: Contract;
  let token3: Contract;
  let uniFactoryFactory: ContractFactory;
  let uniFactory: Contract;
  // let uniPairAddress: Address;
  let uniPair12Factory: ContractFactory;
  let uniPair12: Contract;
  let uniPair23Factory: ContractFactory;
  let uniPair23: Contract;
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
    token2 = await tokenFactory.deploy("CASH token", "CASH", owner.address);
    token3 = await tokenFactory.deploy("DASH token", "DASH", owner.address);
    console.log(
      "Deployed tokens: ",
      token1.address,
      token2.address,
      token3.address
    );

    // Deploy the Uniswap Pair Factory
    uniFactoryFactory = await ethers.getContractFactory("UniswapV2Factory");
    uniFactory = await uniFactoryFactory.deploy(owner.address);
    console.log("uniFactory: ", uniFactory.address);
    let initCodeHash: Bytes = await uniFactory.INIT_CODE_PAIR_HASH();
    console.log("uniFactory INIT_CODE_PAIR_HASH: ", initCodeHash);

    // // Create the token pairs
    // let tx12: ContractTransaction = await uniFactory.createPair(
    //   token1.address,
    //   token2.address
    // );
    // let receipt: ContractReceipt = await tx12.wait();
    // let tx12FoundEvents = receipt.events?.filter((x) => {
    //   return x.event == "PairCreated";
    // });
    // let tx12Events = tx12FoundEvents as Event[];
    // uniPairAddress = tx12Events[0].args?.pair;
    // console.log("uniPairAddress: ", uniPairAddress);

    await uniFactory.createPair(token1.address, token2.address);
    let uniPair12Address = await uniFactory.getPair(
      token1.address,
      token2.address
    );
    uniPair12Factory = await ethers.getContractFactory("UniswapV2Pair");
    uniPair12 = uniPair12Factory.attach(uniPair12Address.toString());

    await uniFactory.createPair(token2.address, token3.address);
    let uniPair23Address = await uniFactory.getPair(
      token2.address,
      token3.address
    );
    uniPair23Factory = await ethers.getContractFactory("UniswapV2Pair");
    uniPair23 = uniPair23Factory.attach(uniPair23Address.toString());

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
    it("Should have set the right token1 symbol", async function () {
      expect(await token1.symbol()).to.equal("BASH");
    });
    it("Should have set the right token2 symbol", async function () {
      expect(await token2.symbol()).to.equal("CASH");
    });
    it("Should have set the right token3 symbol", async function () {
      expect(await token3.symbol()).to.equal("DASH");
    });
  });

  describe("Add Liquidity", function () {
    it("Should have 20000 of tokens 1&3 (40000 of token 2) in Uni pair", async function () {
      await token1.approve(uniRouter.address, 20000);
      await token2.approve(uniRouter.address, 40000);
      await token3.approve(uniRouter.address, 20000);
      for (let i = 0; i < 2; i++) {
        await uniRouter.addLiquidity(
          token1.address,
          token2.address,
          10000,
          10000,
          0,
          0,
          owner.address,
          Math.round(Date.now() / 1000) + 15
        );

        await uniRouter.addLiquidity(
          token2.address,
          token3.address,
          10000,
          10000,
          0,
          0,
          owner.address,
          Math.round(Date.now() / 1000) + 15
        );
      }

      const [reserve12_0, reserve12_1, timestamp12] =
        await uniPair12.getReserves();
      expect(reserve12_0).to.equal(20000);
      expect(reserve12_1).to.equal(20000);

      const [reserve23_0, reserve23_1, timestamp23] =
        await uniPair23.getReserves();
      expect(reserve23_0).to.equal(20000);
      expect(reserve23_1).to.equal(20000);
    });

    it("Should have token balance of 20000 for pair1-2 on token1", async function () {
      const bal12_1 = await token1.balanceOf(uniPair12.address);
      expect(bal12_1).to.equal(20000);
    });
    it("Should have token balance of 20000 for pair1-2 on token2", async function () {
      const bal12_2 = await token2.balanceOf(uniPair12.address);
      expect(bal12_2).to.equal(20000);
    });
    it("Should have token balance of 20000 for pair2-3 on token2", async function () {
      const bal23_1 = await token2.balanceOf(uniPair23.address);
      expect(bal23_1).to.equal(20000);
    });
    it("Should have token balance of 20000 for pair2-3 on token3", async function () {
      const bal23_2 = await token3.balanceOf(uniPair23.address);
      expect(bal23_2).to.equal(20000);
    });
  });

  describe("Balance", function () {
    it("Should have LP token1-2 balance of 19000 for sender", async function () {
      const lpBalance12 = await uniPair12.balanceOf(owner.address);
      expect(lpBalance12).to.equal(19000);
    });
    it("Should have LP token2-3 balance of 19000 for sender", async function () {
      const lpBalance23 = await uniPair23.balanceOf(owner.address);
      expect(lpBalance23).to.equal(19000);
    });

    it("Should have token balance of 30000 for sender on token1", async function () {
      const bal1 = await token1.balanceOf(owner.address);
      expect(bal1).to.equal(30000);
    });
    it("Should have token balance of 10000 for sender on token2", async function () {
      const bal2 = await token2.balanceOf(owner.address);
      expect(bal2).to.equal(10000);
    });
    it("Should have token balance of 30000 for sender on token3", async function () {
      const bal3 = await token3.balanceOf(owner.address);
      expect(bal3).to.equal(30000);
    });
  });

  describe("Swap", function () {
    it("Should have swapped 5000 token1 for 5000 token2 for sender", async function () {
      await token1.approve(uniRouter.address, 5000);
      for (let i = 0; i < 5; i++) {
        await uniRouter.swapExactTokensForTokens(
          1000,
          0,
          [token1.address, token2.address],
          owner.address,
          Math.round(Date.now() / 1000) + 30
        );
      }

      const bal1 = await token1.balanceOf(owner.address);
      const bal2 = await token2.balanceOf(owner.address);
      expect(bal1).to.equal(25000);
      expect(bal2).to.equal(13987);
    });

    it("Should have swapped 5000 token1 for 5000 token3 through token 2 for sender", async function () {
      await token1.approve(uniRouter.address, 5000);
      for (let i = 0; i < 5; i++) {
        await uniRouter.swapExactTokensForTokens(
          1000,
          0,
          [token1.address, token2.address, token3.address],
          owner.address,
          Math.round(Date.now() / 1000) + 30
        );
      }

      const bal1 = await token1.balanceOf(owner.address);
      const bal2 = await token2.balanceOf(owner.address);
      const bal3 = await token3.balanceOf(owner.address);
      expect(bal1).to.equal(20000);
      expect(bal2).to.equal(13987);
      expect(bal3).to.equal(32339);
    });
  });

  // describe("Remove Liquidity", function () {
  //   it("Should have 0 of tokens 1&3 (0 of token 2) in Uni pair", async function () {
  //     await token1.approve(uniRouter.address, 20000);
  //     await token2.approve(uniRouter.address, 40000);
  //     await token3.approve(uniRouter.address, 20000);
  //     for (let i = 0; i < 2; i++) {
  //       await uniRouter.removeLiquidity(
  //         token1.address,
  //         token2.address,
  //         1000,
  //         0,
  //         0,
  //         owner.address,
  //         Math.round(Date.now() / 1000) + 30
  //       );

  //       await uniRouter.removeLiquidity(
  //         token2.address,
  //         token3.address,
  //         1000,
  //         0,
  //         0,
  //         owner.address,
  //         Math.round(Date.now() / 1000) + 30
  //       );
  //     }

  //     const [reserve12_0, reserve12_1, timestamp12] =
  //       await uniPair12.getReserves();
  //     expect(reserve12_0).to.equal(0);
  //     expect(reserve12_1).to.equal(0);

  //     const [reserve23_0, reserve23_1, timestamp23] =
  //       await uniPair23.getReserves();
  //     expect(reserve23_0).to.equal(0);
  //     expect(reserve23_1).to.equal(0);
  //   });
  // });
});
