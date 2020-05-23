pragma solidity ^0.4.17;
import "./TestERC20.sol";

contract Reserve {
    
    string public tokenSymbol; 
    address public tokenAddress;
    TestToken public tokenInterface;
    address private owner;
    uint256 public baseRate = 10**18; // 10^18
    uint public buyRate =     10**18; // 10^18 ETH = ? token when have ETH w token
    uint public sellRate =    10**18; // 10^18 token = ? ETH when have token w ETH
    //address public constant ETHAddress = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public constant ETHAddress = 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;
    
    function Reserve (address _owner,string _tokenSymbol, address _tokenAddress) public {
        owner = _owner;
        tokenAddress = _tokenAddress;
        tokenSymbol = _tokenSymbol;
        tokenInterface = TestToken(tokenAddress);
        baseRate = 10**tokenInterface.decimals();
        buyRate = buyRate;
        sellRate = baseRate;
    }
    
    function() public payable {}
    
    function withdrawFund(address _tokenAddress,uint256 srcAmount,address destAddress) public onlyOwner returns (bool){
        require(_tokenAddress == tokenAddress || _tokenAddress == ETHAddress);
        if (_tokenAddress == tokenAddress){
            require(tokenInterface.balanceOf(this) >= srcAmount);
            tokenInterface.transfer(destAddress, srcAmount);
        }
        else{
            require(this.balance >= srcAmount);
            destAddress.transfer(srcAmount);
        }
        return true;
    }
    
    function setExchangeRate18 (uint256 _buyRate, uint _sellRate) public onlyOwner returns (bool) {
        buyRate = _buyRate;
        sellRate = _sellRate;
        return true;
    }
    
    function setSellRate18 (uint256 _buyRate) public onlyOwner returns (bool) {
        buyRate = _buyRate;
        return true;
    }
    
    function setBuyRate18 (uint256 _sellRate) public onlyOwner returns (bool) {
        sellRate = _sellRate;
        return true;
    }
    
    function getTokenFund() public view returns (uint _TokenFund){
        return tokenInterface.balanceOf(this);
    }
    
    function getETHFund() public view returns (uint _ETHFund){
        return this.balance;
    }

    function exchangeToken(bool isBuy,uint srcAmount) public payable returns (uint _reciveAmount){
        require(msg.value == srcAmount || tokenInterface.allowance(msg.sender,this) == srcAmount);  
        uint reciveAmount;
        if (isBuy){
            //have eth / w token
            //buy token / sell eth
            reciveAmount = srcAmount*buyRate/baseRate;
            require(tokenInterface.balanceOf(this) >= reciveAmount);
            tokenInterface.transfer(msg.sender, reciveAmount);
        }
        if(!isBuy){
            //have token w eth
            //sell token / buy ETH
            reciveAmount = srcAmount*sellRate/baseRate;
            require(this.balance >= reciveAmount);
            tokenInterface.transferFrom(msg.sender,this, srcAmount);
            msg.sender.transfer(reciveAmount);
        }
        return reciveAmount;
    }
    
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
}

