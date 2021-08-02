import { ContractFactory, Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Address } from "cluster";
import { ethers } from "hardhat";

describe("NFTPv1 contract", function () {
  // `before`, `beforeEach`, `after`, `afterEach`.

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  let erc20Factory: ContractFactory;
  let erc20: Contract;
  let nftpFactory: ContractFactory;
  let nftp: Contract;

  var account2 = ethers.Wallet.createRandom();

  before(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    // console.log("Created signers. Owner:", owner.address);

    // Deploy the test ERC20 token
    erc20Factory = await ethers.getContractFactory("ERC20");
    erc20 = await erc20Factory.deploy("DASH token", "DASH", owner.address);
    console.log("Deployed ERC20");

    // Deploy the NFTP Wallet
    nftpFactory = await ethers.getContractFactory("NFTPv1");
    nftp = await nftpFactory.deploy();

    // Approve and transfer 100 from ERC20 to NFTP Wallet
    await erc20.approve(nftp.address, 100);
    await nftp.deposit(erc20.address, 100);
    console.log(
      "Deployed NFTP Wallet and deposited initial 100 to owner on token1"
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftp.owner()).to.equal(owner.address);
    });
  });

  describe("Balance", function () {
    it("Should have book value of 100 erc20 for sender", async function () {
      const book = await nftp.getBook(owner.address, erc20.address);
      expect(book).to.equal(100);
    });

    it("Should have token balance of 500 for sender on deployed erc20", async function () {
      const balance = await erc20.balanceOf(owner.address);
      expect(balance).to.equal(500);
    });
  });

  describe("Deposit", function () {
    it("Should have deposited 100 more for a book value of 200 for sender on erc20", async function () {
      await erc20.approve(nftp.address, 100);
      await nftp.deposit(erc20.address, 100);
      const book = await nftp.getBook(owner.address, erc20.address);
      expect(book).to.equal(200);
    });
  });

  describe("Balance", function () {
    it("Should have book value of 100 erc20 for sender", async function () {
      const book = await nftp.getBook(owner.address, erc20.address);
      expect(book).to.equal(100);
    });

    it("Should have token balance of 500 for sender on deployed erc20", async function () {
      const balance = await erc20.balanceOf(owner.address);
      expect(balance).to.equal(500);
    });
  });

  describe("Transfer", function () {
    it("Should have transferred 30 from owner", async function () {
      await nftp.transfer(erc20.address, account2.address, 30);
      const book = await nftp.getBook(owner.address, erc20.address);
      expect(book).to.equal(170);
    });
    it("Should have transferred 30 to account2", async function () {
      const book = await nftp.getBook(account2.address, erc20.address);
      expect(book).to.equal(30);
    });
  });

  describe("Mint", function () {
    it("Should have minted an NFTP token with symbol nDASH", async function () {
      await nftp.mint("nDASH");
      const nftpOwner = await nftp.getNftpOwner("nDASH");
      expect(nftpOwner).to.equal(owner.address);
    });
  });

  describe("Fill", function () {
    it("Should have filled the NFTP token with 100 erc20", async function () {
      await nftp.fill("nDASH", erc20.address, 100);
      const nftpBalance = await nftp.getNftp("nDASH", erc20.address);
      expect(nftpBalance).to.equal(100);
    });
  });

  describe("Balance", function () {
    it("Should have book value of 70 erc20 for sender", async function () {
      const book = await nftp.getBook(owner.address, erc20.address);
      expect(book).to.equal(70);
    });
  });

  describe("Drain", function () {
    it("Should have drained the NFTP token down to 40 erc20", async function () {
      await nftp.drain("nDASH", erc20.address, 60);
      const nftpBalance = await nftp.getNftp("nDASH", erc20.address);
      expect(nftpBalance).to.equal(40);
    });
  });

  describe("Balance", function () {
    it("Should have book value of 130 erc20 for sender", async function () {
      const book = await nftp.getBook(owner.address, erc20.address);
      expect(book).to.equal(130);
    });
  });

  describe("Assign", function () {
    it("Should have assigned NFTP token from owner to account2", async function () {
      // const ns = Array.from(Array(2000).keys());
      // ns.forEach(async (n) => await nftp.mint("nDASH" + n));
      await nftp.assign("nDASH", account2.address);
      const nftpOwner = await nftp.getNftpOwner("nDASH");
      expect(nftpOwner).to.equal(account2.address);
    });
  });

  describe("Withdraw", function () {
    it("Should have withdrawn 100 for sender on erc20", async function () {
      await nftp.withdraw(erc20.address, 100);
      const book = await nftp.getBook(owner.address, erc20.address);
      expect(book).to.equal(30);
    });
  });
});
