import { ContractFactory, Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Address } from "cluster";
import { ethers } from "hardhat";

describe("NFTPv1 contract", function () {
  // `before`, `beforeEach`, `after`, `afterEach`.

  let nftpFactory: ContractFactory;
  let nftp: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  before(async function () {
    // Get the ContractFactory and Signers here.
    nftpFactory = await ethers.getContractFactory("NFTPv1");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", owner.address);

    nftp = await nftpFactory.deploy("NFTP Test");

    await nftp.deposit(0x001, 100);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftp.owner()).to.equal(owner.address);
    });

    it("Should have a name of NFTP Test", async function () {
      const name = await nftp.name();
      expect(name).to.equal("NFTP Test");
    });
  });

  describe("Deposit", function () {
    it("Should have book value of 100 for sender on token 0x001", async function () {
      //   await nftp.deposit(0x001, 100);
      const book = await nftp.getBook(0x001, owner.address);
      expect(book).to.equal(100);
    });

    // it("Should have transferred 30 to account 0xA002", async function () {
    //   await nftp.transfer(0, owner.address, 16);
    //   const symbol = await nftp.getScoreboard(0, owner.address);
    //   expect(symbol).to.equal(16);
    // });
  });
});
