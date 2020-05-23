pragma solidity ^0.4.17;
import "./Reserve.sol";
import "./TestERC20.sol";
contract Exchange {

    address private owner;
    // uint256 public currentExchangeRate18 = 10**18; // token : ETH
    mapping (address => Reserve) public reserveList;
    //address public constant ETHAddress = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public constant ETHAddress = 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;
    TestToken public tokenInterface;
    
    function Exchange(address _owner) public {
        owner = _owner;
    }
    
    function() public payable {}
    
    
    function addReverse(address reserveAddress) public onlyOwner returns (bool){
        Reserve reserve = Reserve(reserveAddress);
        reserveList[reserve.tokenAddress()] = reserve;
        return true;
    }
    
    function removeReserve(address _tokenAddress) public onlyOwner correctTokenAddress(_tokenAddress) returns (bool) {
        delete reserveList[_tokenAddress];
        return true;
    }
    
    function getExchangeRate(address srcToken,address destToken) public view correctTokenAddressInput(srcToken,destToken) returns (uint256){
        //rate from token a to token b, with 1 amount 
        // from 1 token to 1*sellRate/baseRate eth
        //from X eth to X*buyRate/baseRate token b
        // = sellrate(tokenA)*buyRate(tokenB)
        if (srcToken == destToken) return reserveList[srcToken].baseRate();
        if (srcToken == ETHAddress){
            return reserveList[destToken].buyRate();
        }
        if (destToken == ETHAddress){
            return reserveList[srcToken].sellRate();
        }
        return reserveList[srcToken].sellRate()*reserveList[destToken].buyRate()/reserveList[srcToken].baseRate();
    }
    
    function getExchangeAmount(address srcToken,address destToken,uint256 srcAmount) public view correctTokenAddressInput(srcToken,destToken) returns (uint256){
        //rate from token a to token b, with c amount 
        // = C * above
        if (srcToken == destToken) return reserveList[srcToken].baseRate()*srcAmount;
        if (srcToken == ETHAddress){
            return reserveList[destToken].buyRate()*srcAmount;
        }
        if (destToken == ETHAddress){
            return reserveList[srcToken].sellRate()*srcAmount;
        }
        return reserveList[srcToken].sellRate()*reserveList[destToken].buyRate()/reserveList[srcToken].baseRate()*srcAmount;
    }
    
    function exchangeToken(address srcToken,address destToken,uint256 srcAmount) public correctTokenAddressInput(srcToken,destToken) payable returns (bool) {
        require(msg.value == srcAmount || StandardToken(srcToken).allowance(msg.sender,this) == srcAmount);  
        Reserve srcReserve;
        Reserve destReserve;
        uint reciveToken;
        uint reciveETH;
        if (srcToken==ETHAddress){
            // buy
            srcReserve = reserveList[destToken];
            reciveToken = srcReserve.exchangeToken.value(srcAmount)(true,srcAmount);
            //send back destToken to user
            tokenInterface = TestToken(destToken);
            tokenInterface.transfer(msg.sender,reciveToken);
        }
        else if (destToken == ETHAddress){
            //recive token
            tokenInterface = TestToken(srcToken);
            tokenInterface.transferFrom(msg.sender, this, srcAmount);
            //sell
            destReserve = reserveList[srcToken];
            tokenInterface.approve(destReserve,srcAmount);
            reciveETH = destReserve.exchangeToken(false,srcAmount);
            //send back destToken to user
            msg.sender.transfer(reciveETH);
        }
        else{
            //recive srcToken
            tokenInterface = TestToken(srcToken);
            tokenInterface.transferFrom(msg.sender, this, srcAmount);
            //sell
            destReserve = reserveList[srcToken];
            tokenInterface.approve(destReserve,srcAmount);
            reciveETH = destReserve.exchangeToken(false,srcAmount);
            //buy destToken
            srcReserve = reserveList[destToken];
            reciveToken = srcReserve.exchangeToken.value(reciveETH)(true,reciveETH);
            //send back destToken to user
            tokenInterface = TestToken(destToken);
            tokenInterface.transfer(msg.sender,reciveToken);
        }
        return true;
    }
    
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
    
    modifier correctTokenAddress(address tokenAddress){
        require (reserveList[tokenAddress] !=address(0));
        _;
    }
    
    modifier correctTokenAddressInput(address srcToken,address destToken){
        require((reserveList[srcToken] !=address(0) && destToken == ETHAddress) || 
                (reserveList[destToken] !=address(0) && srcToken == ETHAddress) || 
                (reserveList[srcToken] !=address(0) && reserveList[destToken] !=address(0) ));
        _;
    }
    
}