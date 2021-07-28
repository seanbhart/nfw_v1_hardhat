// import { ContractFactory, Contract } from "@ethersproject/contracts";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { expect } from "chai";
// import { Address } from "cluster";
// import { ethers } from "hardhat";

// describe("NFWv1 contract", function () {
//   // `before`, `beforeEach`, `after`, `afterEach`.

//   let nfwFactory: ContractFactory;
//   let nfw: Contract;
//   let owner: SignerWithAddress;
//   let addr1: SignerWithAddress;
//   let addr2: SignerWithAddress;
//   let addrs: SignerWithAddress[];

//   before(async function () {
//     // Get the ContractFactory and Signers here.
//     nfwFactory = await ethers.getContractFactory("NFWv1");
//     [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
//     console.log("Deploying contracts with the account:", owner.address);

//     nfw = await nfwFactory.deploy("NFW Test", "NFW", "test.com");

//     // Prepare custom functions and data
//     nfw.updateScoreboard(0, owner.address, 15);
//   });

//   describe("Deployment", function () {
//     it("Should set the right owner", async function () {
//       expect(await nfw.owner()).to.equal(owner.address);
//     });

//     it("Should have a symbol of NFW", async function () {
//       const symbol = await nfw.symbol();
//       expect(symbol).to.equal("NFW");
//     });

//     it("Should have score of 15 for owner on first token", async function () {
//       const symbol = await nfw.getScoreboard(0, owner.address);
//       expect(symbol).to.equal(15);
//     });

//     it("Should have score of 16 for owner on first token", async function () {
//       await nfw.updateScoreboard(0, owner.address, 16);
//       const symbol = await nfw.getScoreboard(0, owner.address);
//       expect(symbol).to.equal(16);
//     });
//   });
// });
