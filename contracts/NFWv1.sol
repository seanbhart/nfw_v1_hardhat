// SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;
pragma solidity >=0.7.6;

import 'hardhat/console.sol';
// import './interfaces/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';


struct Offer {
    address account;
    uint amount;
}

struct CPI {
    uint x;
    uint y;
    uint k;
}

contract NFWv1 is Ownable {
    address public feeRecipient;
    address public feeRecipientSetter;

    // address public factory;
    // address private _creator;
    // string public symbol;

    // account address => token address => balance amount
    mapping(address => mapping(address => uint)) public getBook;
    // NFW symbol => token address => token balance
    mapping(string => mapping(address => uint)) public getNfw;
    // NFW symbol => owner address
    mapping(string => address) public getNfwOwner;
    // Owner address => NFW list
    mapping(address => string[]) public getOwnerNfws;
    string[] public nfwList;

    // account address => NFW symbol => Offer list
    mapping(address => mapping(string => Offer[])) public getOffers;

    /* CONST. PROD. AMM
    */
    // token0 => token1 => CPI
    mapping(address => mapping(address => CPI)) public getCPI;
    event Swap(address account_, address tokenHave_, address tokenWant_, uint input_, uint output_);

    event Deposit(address account_, address token_, uint amount_);
    event Withdrawal(address account_, address token_, uint amount_);
    event Transfer(address token_, address from_, address to_, uint amount_);
    event Mint(string symbol_, address account_);
    event Fill(string symbol_, address token_, uint amount_);
    event Drain(string symbol_, address token_, uint amount_);
    event Assign(string symbol_, address from_, address to_);
    
    // constructor(address _feeRecipientSetter) Ownable() {
    //     feeRecipientSetter = _feeRecipientSetter;
    // }
    constructor(address token0, address token1) Ownable() {
        console.log("NFWv1 constructor");
        CPI memory initCPI;
        initCPI.x = 1000;
        initCPI.y = 1000;
        initCPI.k = 1000000;
        getCPI[token0][token1] = initCPI;
    }

    /* CP AMM FUNCTIONS
    */
    function swap(
        address _account,
        address _tokenHave,
        address _tokenWant,
        uint _give
    ) public virtual {
        require(_give > 0, 'NFWv1: ILLEGAL SWAP INPUT');

        // Get the token pair Constant Product Invariant data (and liquidity amounts)
        CPI memory swapCPI;
        bool tokenHaveFirst = true;
        if (getCPI[_tokenHave][_tokenWant].k != 0) {
            swapCPI = getCPI[_tokenHave][_tokenWant];
        } else if (getCPI[_tokenWant][_tokenHave].k != 0) {
            swapCPI = getCPI[_tokenWant][_tokenHave];
            tokenHaveFirst = false;
        }
        require(swapCPI.k != 0, 'NFWv1: TOKEN PAIR NOT FOUND');

        // Calculate the amount of wanted token to return
        // Invariant / (tokenHave + give) = tokenWant new LP amount
        // tokenWant current - tokenWant new LP amount = tokenWant return amount
        uint x = tokenHaveFirst ? swapCPI.x : swapCPI.y;
        uint y = tokenHaveFirst ? swapCPI.y : swapCPI.x;
        uint output = y - (swapCPI.k / (x + _give));
        console.log("swap output: ", output);

        // Update the stored CPI
        swapCPI.x = x + _give;
        swapCPI.y = y - output;
        tokenHaveFirst ? getCPI[_tokenHave][_tokenWant] = swapCPI : getCPI[_tokenWant][_tokenHave] = swapCPI;
        console.log("swapCPI: ", swapCPI.x, swapCPI.y, swapCPI.k);

        // Adjust the account's balances
        uint currentHave = getBook[_account][_tokenHave];
        getBook[_account][_tokenHave] = currentHave - _give;
        uint currentWant = getBook[_account][_tokenWant];
        getBook[_account][_tokenWant] = currentWant + output;

        emit Swap(_account, _tokenHave, _tokenWant, _give, output);
    }

    /* BOOK FUNCTIONS
    */
    function deposit(
        address _token,
        uint _amount
    ) public virtual {
        require(_amount > 0, 'NFWv1: ILLEGAL DEPOSIT AMOUNT');

        uint currentBalance = 0;
        if (getBook[msg.sender][_token] > 0) {
            currentBalance = getBook[msg.sender][_token];
        }

        // Transfer amount from sender to contract for referenced token
        IERC20 fromToken = IERC20(_token);
        fromToken.transferFrom(msg.sender, address(this), _amount);

        // Increase the internal book balance to account for transfer
        getBook[msg.sender][_token] = currentBalance + _amount;
        emit Deposit(msg.sender, _token, _amount);
    }

    function withdraw(
        address _token,
        uint _amount
    ) public virtual {
        // Check available Book Balance
        uint bookBalance = getBook[msg.sender][_token];
        require(bookBalance >= _amount, 'NFWv1: INSUFFICIENT BOOK BALANCE');
        
        // Transfer amount from contract to sender for referenced token
        IERC20 toToken = IERC20(_token);
        toToken.transfer(msg.sender, _amount);

        // Decrease the internal book balance to account for transfer
        getBook[msg.sender][_token] = getBook[msg.sender][_token] - _amount;
        emit Withdrawal(msg.sender, _token, _amount);
    }

    function transfer(
        address _token,
        address _to,
        uint _amount
    ) public virtual {
        _safeTransfer(_token, msg.sender, _to, _amount);
        emit Transfer(_token, msg.sender, _to, _amount);
    }

    /* NFW FUNCTIONS
    */
    function mint(
        string memory _symbol
    ) public virtual {
        require(getNfwOwner[_symbol] == address(0), 'NFWv1: TOKEN_EXISTS');
        getNfwOwner[_symbol] = msg.sender;
        getOwnerNfws[msg.sender].push(_symbol);
        nfwList.push(_symbol);

        emit Mint(_symbol, msg.sender);
    }

    function fill(
        string memory _symbol,
        address _token,
        uint _amount
    ) public virtual {
        // Check ownership
        require(getNfwOwner[_symbol] == msg.sender, 'NFWv1: UNAUTHORIZED');

        // Check available Book Balance
        uint bookBalance = getBook[msg.sender][_token];
        require(bookBalance >= _amount, 'NFWv1: INSUFFICIENT BOOK BALANCE');

        // Transfer Book Balance to NFW Balance
        getBook[msg.sender][_token] = getBook[msg.sender][_token] - _amount;
        getNfw[_symbol][_token] = getNfw[_symbol][_token] + _amount;

        emit Fill(_symbol, _token, _amount);

        // // Check all target token balances in this account's NFWs
        // string[] memory ownerNfws = getOwnerNfws[msg.sender];
        // uint nfwTokenTotalBalance = 0;
        // uint len = ownerNfws.length;
        // for (uint i=0; i<len; i++) {
        //     if (keccak256(bytes(ownerNfws[i])) == keccak256(bytes(_symbol))) {
        //         nfwTokenTotalBalance += getNfw[_symbol][_token];
        //     }
        // }
        
        // // The remaining book balance not allocated funds to NFWs should cover the desired allocation.
        // require(bookBalance - nfwTokenTotalBalance >= _amount, 'NFWv1: INSUFFICIENT UNALLOCATED BOOK BALANCE');
        // getNfw[_symbol][_token] = _amount;
    }

    function drain(
        string memory _symbol,
        address _token,
        uint _amount
    ) public virtual {
        // Check ownership
        require(getNfwOwner[_symbol] == msg.sender, 'NFWv1: UNAUTHORIZED');

        // Check available NFW Balance
        uint nfwBalance = getNfw[_symbol][_token];
        require(nfwBalance >= _amount, 'NFWv1: INSUFFICIENT NFW BALANCE');

        // Transfer Book Balance to NFW Balance
        getNfw[_symbol][_token] = getNfw[_symbol][_token] - _amount;
        getBook[msg.sender][_token] = getBook[msg.sender][_token] + _amount;

        emit Drain(_symbol, _token, _amount);
    }

    function assign(
        string memory _symbol,
        address _to
    ) public virtual {
        // Check ownership
        require(getNfwOwner[_symbol] == msg.sender, 'NFWv1: UNAUTHORIZED');

        // Remove the symbol from the prior owner
        uint i = 0;
        while (keccak256(abi.encodePacked(getOwnerNfws[msg.sender][i])) != keccak256(abi.encodePacked(_symbol))) { i++; }
        delete getOwnerNfws[msg.sender][i];
        getOwnerNfws[_to].push(_symbol);

        // console.log("from nfws:");
        // string[] memory nfws = getOwnerNfws[msg.sender];
        // for(uint j=0; j<nfws.length; j++){
        //     console.log(nfws[j]);
        // }
        // console.log("to nfws:");
        // nfws = getOwnerNfws[_to];
        // for(uint j=0; j<nfws.length; j++){
        //     console.log(nfws[j]);
        // }

        // Transfer Book Balance to NFW Balance
        getNfwOwner[_symbol] = _to;

        emit Assign(_symbol, msg.sender, _to);
    }

    /* PRIVATE UTILITY FUNCTIONS
    */
    function _safeTransfer(
        address _token,
        address _from,
        address _to,
        uint _amount
    ) private {
        // Ensure the from address has enough balance for the transfer
        require(getBook[_from][_token] >= _amount, 'NFWv1: INSUFFICIENT FUNDS');
        getBook[_from][_token] = getBook[_from][_token] - _amount;
        getBook[_to][_token] = getBook[_to][_token] + _amount;
    }

    /* FEE FUNCTIONS
    */
    function setFeeRecipient(address _feeRecipient) external {
        require(msg.sender == feeRecipient, 'NFWv1: FORBIDDEN');
        feeRecipient = _feeRecipient;
    }

    function setFeeRecipientSetter(address _feeRecipientSetter) external {
        require(msg.sender == feeRecipient, 'NFWv1: FORBIDDEN');
        feeRecipient = _feeRecipientSetter;
    }
}
