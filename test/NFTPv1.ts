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

  var account1 = ethers.Wallet.createRandom();
  var account2 = ethers.Wallet.createRandom();
  var token1 = ethers.Wallet.createRandom();
  var token2 = ethers.Wallet.createRandom();

  before(async function () {
    // Get the ContractFactory and Signers here.
    nftpFactory = await ethers.getContractFactory("NFTPv1");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    // console.log("Deploying contracts with the account:", owner.address);
    console.log("Deploying contract with owner account.");

    nftp = await nftpFactory.deploy();

    await nftp.deposit(token1.address, 100);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftp.owner()).to.equal(owner.address);
    });
  });

  describe("Balance", function () {
    it("Should have book value of 100 for sender on token1", async function () {
      const book = await nftp.getBook(owner.address, token1.address);
      expect(book).to.equal(100);
    });
  });

  describe("Deposit", function () {
    it("Should have deposited 100 more for a book value of 200 for sender on token1", async function () {
      await nftp.deposit(token1.address, 100);
      const book = await nftp.getBook(owner.address, token1.address);
      expect(book).to.equal(200);
    });
  });

  describe("Transfer", function () {
    it("Should have transferred 30 from owner", async function () {
      await nftp.transfer(token1.address, account1.address, 30);
      const book = await nftp.getBook(owner.address, token1.address);
      expect(book).to.equal(170);
    });
    it("Should have transferred 30 to account1", async function () {
      const book = await nftp.getBook(account1.address, token1.address);
      expect(book).to.equal(30);
    });
  });

  describe("Mint", function () {
    it("Should have minted an NFTP token with symbol DASH", async function () {
      await nftp.mint("DASH");
      const nftpOwner = await nftp.getNftpOwner("DASH");
      expect(nftpOwner).to.equal(owner.address);
    });
  });

  describe("Fill", function () {
    it("Should have filled the NFTP token with 100 token1", async function () {
      await nftp.fill("DASH", token1.address, 100);
      const nftpBalance = await nftp.getNftp("DASH", token1.address);
      expect(nftpBalance).to.equal(100);
    });
  });

  describe("Balance", function () {
    it("Should have book value of 70 for sender on token1", async function () {
      const book = await nftp.getBook(owner.address, token1.address);
      expect(book).to.equal(70);
    });
  });

  describe("Drain", function () {
    it("Should have drained the NFTP token down to 40 token1", async function () {
      await nftp.drain("DASH", token1.address, 60);
      const nftpBalance = await nftp.getNftp("DASH", token1.address);
      expect(nftpBalance).to.equal(40);
    });
  });

  describe("Balance", function () {
    it("Should have book value of 130 for sender on token1", async function () {
      const book = await nftp.getBook(owner.address, token1.address);
      expect(book).to.equal(130);
    });
  });

  describe("Withdraw", function () {
    it("Should have withdrawn 100 for sender on token1", async function () {
      await nftp.withdraw(token1.address, 100);
      const book = await nftp.getBook(owner.address, token1.address);
      expect(book).to.equal(30);
    });
  });
});
