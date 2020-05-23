import { getExchangeRate, getTokenBalances } from "./services/networkService";
import { getExchangeContract } from "./services/web3Service";
import EnvConfig from "./configs/env";
import Web3 from "web3";
var currentTokenBalance;
var account;
var currentSrcToken;
var sleepTimeForWaitingRespond = 300;

$(function () {
  initiateProject();

  function initiateProject() {
    const defaultSrcSymbol = EnvConfig.TOKENS[0].symbol;
    const defaultDestSymbol = EnvConfig.TOKENS[1].symbol;

    initiateDropdown();
    initiateSelectedToken(defaultSrcSymbol, defaultDestSymbol);
    initiateDefaultRate(defaultSrcSymbol, defaultDestSymbol);
    //**edit */
    currentSrcToken = EnvConfig.TOKENS[0];
  }

  function initiateDropdown() {
    let dropdownTokens = '';

    EnvConfig.TOKENS.forEach((token) => {
      dropdownTokens += `<div class="dropdown__item">${token.symbol}</div>`;
    });

    $('.dropdown__content').html(dropdownTokens);
  }

  function initiateSelectedToken(srcSymbol, destSymbol) {
    $('#selected-src-symbol').html(srcSymbol);
    $('#selected-dest-symbol').html(destSymbol);
    $('#rate-src-symbol').html(srcSymbol);
    $('#rate-dest-symbol').html(destSymbol);
    $('#selected-transfer-token').html(srcSymbol);
  }

  function initiateDefaultRate(srcSymbol, destSymbol) {
    const srcToken = findTokenBySymbol(srcSymbol);
    const destToken = findTokenBySymbol(destSymbol);
    const defaultSrcAmount = (Math.pow(10, 18)).toString();

    getExchangeRate(srcToken.address, destToken.address, defaultSrcAmount).then((result) => {
      const rate = result / Math.pow(10, 18);
      $('#exchange-rate').html(rate);
    }).catch((error) => {
      console.log(error);
      $('#exchange-rate').html(0);
    });
  }

  function findTokenBySymbol(symbol) {
    return EnvConfig.TOKENS.find(token => token.symbol === symbol);
  }

  // On changing token from dropdown.
  $(document).on('click', '.dropdown__item', function () {
    const selectedSymbol = $(this).html();
    $(this).parent().siblings('.dropdown__trigger').find('.selected-target').html(selectedSymbol);
    /* TODO: Implement changing rate for Source and Dest Token here. */
    //var srcToken = findTokenBySymbol($('#selected-src-symbol').text());
    //var destToken = findTokenBySymbol($('#selected-dest-symbol').text());
    var srcToken = findTokenBySymbol(selectedSymbol);
    currentSrcToken = srcToken;
    getAmountToken();
    getExchangeRate_a();
    setTimeout(updateSwapDestAmount, sleepTimeForWaitingRespond);
  });

  // Import Metamask
  $('#import-metamask').on('click', function () {
    /* TODO: Importing wallet by Metamask goes here. */
    ethereum.enable().then(() => {
      if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
      } else {
        web3 = new Web3(new Web3.providers.HttpProvider(EnvConfig.RPC_ENDPOINT));
      }
      getAddress();
      getAmountToken();
      getExchangeRate_a();
    })

  });

  // Handle on Source Amount Changed
  $('#swap-source-amount').on('input change', function () {
    /* TODO: Fetching latest rate with new amount */
    /* TODO: Updating dest amount */
    getExchangeRate_a();
    updateSwapDestAmount();
  });

  // Handle on click token in Token Dropdown List
  $('.dropdown__item').on('click', function () {
    $(this).parents('.dropdown').removeClass('dropdown--active');
    /* TODO: Select Token logic goes here */
  });

  // Handle on Swap Now button clicked
  $('#swap-button').on('click', function () {
    if (web3.currentProvider.selectedAddress != null) {
      var amount = $('#swap-source-amount').val();
      var sender = web3.currentProvider.selectedAddress;
      const srcToken = findTokenBySymbol($('#selected-src-symbol').text());
      const destToken = findTokenBySymbol($('#selected-dest-symbol').text());
      
      if (!amount || isNaN(amount)) {
        alert("Need valid amount of token!");
        return;
      }
      else if (srcToken.address == destToken.address) {
        alert("Only swap between 2 different token!");
        return;
      }
      else if ((Number(amount)) > currentTokenBalance) {
        alert("Can only transfer as much as you have!");
        return;
      }
      var amountToWei = web3.utils.toWei(amount, "ether");
      if (srcToken.symbol == 'TOMO') {
        let exchangeContract = new web3.eth.Contract(EnvConfig.EXCHANGE_CONTRACT_ABI, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);
        let action = new Promise((resolve, reject) => {
          exchangeContract.methods.exchangeToken(srcToken.address, destToken.address, amountToWei).send({ from: sender, value: amountToWei }).then((result) => {
            resolve(result)
          }, (error) => {
            reject(error);

          })
        })
      }
      else {
        let tokenContract = new web3.eth.Contract(EnvConfig.TOKEN_ABI, srcToken.address);
        let action = new Promise((resolve, reject) => {
          tokenContract.methods.approve(EnvConfig.EXCHANGE_CONTRACT_ADDRESS, amountToWei).send({ from: sender }).then((result) => {
            resolve(result)

            let exchangeContract = new web3.eth.Contract(EnvConfig.EXCHANGE_CONTRACT_ABI, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);
            let action2 = new Promise((resolve, reject) => {
              exchangeContract.methods.exchangeToken(srcToken.address, destToken.address, amountToWei).send({ from: sender}).then((result) => {
                resolve(result)
              }, (error) => {
                console.log("fail from here");
                reject(error);

              })
            })

          }, (error) => {
            console.log(error);
            reject(error);
          })
        })
      }
    }

  });

  // Tab Processing
  $('.tab__item').on('click', function () {
    const contentId = $(this).data('content-id');
    $('.tab__item').removeClass('tab__item--active');
    $(this).addClass('tab__item--active');

    if (contentId === 'swap') {
      $('#swap').addClass('active');
      $('#transfer').removeClass('active');
      //add more
      $('#selected-src-symbol').html(currentSrcToken.symbol);
    } else {
      $('#transfer').addClass('active');
      $('#swap').removeClass('active');
      //add more
      $('#selected-transfer-token').html(currentSrcToken.symbol);
    }
  });

  // Dropdown Processing
  $('.dropdown__trigger').on('click', function () {
    $(this).parent().toggleClass('dropdown--active');
  });

  // Close Modal
  $('.modal').on('click', function (e) {
    if (e.target !== this) return;
    $(this).removeClass('modal--active');
  });

  $('#transfer-button').click(function () {
    if (web3.currentProvider.selectedAddress != null) {
      var amount = $('#transfer-source-amount').val();
      if (!amount || isNaN(amount)) {
        alert("Need valid amount of token!");
        return;
      }
      var receiver = $('#transfer-address').val();
      var sender = web3.currentProvider.selectedAddress;
      var amountToWei = web3.utils.toWei(amount, "ether");
      if ((Number(amount)) > currentTokenBalance) {
        alert("Can only transfer as much as you have!");
        return;
      }
      if (currentSrcToken.symbol === 'TOMO') {
        web3.eth.sendTransaction({ to: receiver, from: sender, value: amountToWei });
      }
      else {
        let tokenContract = new web3.eth.Contract(EnvConfig.TOKEN_ABI, currentSrcToken.address);
        let action = new Promise((resolve, reject) => {
          tokenContract.methods.transfer(receiver, amountToWei).send({ from: sender }).then((result) => {
            resolve(result)
          }, (error) => {
            console.log(error);
            reject(error);
          })
        })
      }
    }
  });



  function getExchangeRate_a() {
    if (web3.currentProvider.selectedAddress != null) {
      const srcToken = findTokenBySymbol($('#selected-src-symbol').text());
      const destToken = findTokenBySymbol($('#selected-dest-symbol').text());
      const defaultSrcAmount = '1';
      //input 2 tomo make revert, fixed value
      if (srcToken.address == EnvConfig.TOKENS[0].address && destToken.address == EnvConfig.TOKENS[0].address) {
        $('#rate-src-symbol').html(srcToken.symbol);
        $('#exchange-rate').html('1');
        $('#rate-dest-symbol').html(destToken.symbol);
      }
      else {
        getExchangeRate(srcToken.address, destToken.address, defaultSrcAmount).then((result) => {
          const rate = result;
          $('#rate-src-symbol').html(srcToken.symbol);
          $('#exchange-rate').html(rate);
          $('#rate-dest-symbol').html(destToken.symbol);
        }).catch((error) => {
          console.log(error);
          $('#rate-src-symbol').html(srcToken.symbol);
          $('#exchange-rate').html(0);
          $('#rate-dest-symbol').html(destToken.symbol);
        });
      }
    }
  }

  function updateSwapDestAmount() {
    var inputAmount = $('#swap-source-amount').val();
    if (inputAmount && !isNaN(inputAmount)) {
      var source_amount = Number(inputAmount);
      var rate = Number($('#exchange-rate').html());
      var dest_amount = source_amount * rate;
      $('#swap-dest-amount').html(dest_amount);
    }
    else {
      $('#swap-dest-amount').html(0);
    }
  }

  function doInterval() {
    if (web3.currentProvider.selectedAddress != null) {
      getAddress();
      getAmountToken();
      getExchangeRate_a();
    }
  }
  setInterval(doInterval, 5000); // Time in milliseconds

  function getAddress() {
    if (web3.currentProvider.selectedAddress != null) {
      let accountInfor = web3.currentProvider.selectedAddress;
      account = accountInfor;
      //let compressAccount = accountInfor.substring(0, 10) + "..." + accountInfor.substring(accountInfor.length - 5, accountInfor.length);
      $('#current-account-address').html("Address: " + account);
      $('#current-account-address-transfer').html("Address: " + account);
    }
  }
  function getAmountToken() {
    if (web3.currentProvider.selectedAddress != null) {
      if (currentSrcToken.symbol === 'CTK') {
        getTokenBalances(EnvConfig.TOKENS[1].address, web3.currentProvider.selectedAddress).then((result) => {
          currentTokenBalance = result;
          $('#current-account-token-amount').html(currentSrcToken.symbol + ": " + currentTokenBalance / Math.pow(10, 18));
          $('#current-account-token-amount-transfer').html(currentSrcToken.symbol + ": " + currentTokenBalance / Math.pow(10, 18));
        }, (error) => {
        })
      }

      if (currentSrcToken.symbol === 'DTK') {
        getTokenBalances(EnvConfig.TOKENS[2].address, web3.currentProvider.selectedAddress).then((result) => {
          currentTokenBalance = result;
          $('#current-account-token-amount').html(currentSrcToken.symbol + ": " + currentTokenBalance / Math.pow(10, 18));
          $('#current-account-token-amount-transfer').html(currentSrcToken.symbol + ": " + currentTokenBalance / Math.pow(10, 18));
        }, (error) => {
        })
      }
      if (currentSrcToken.symbol === 'TOMO') {
        web3.eth.getBalance(web3.currentProvider.selectedAddress, (err, wei) => {
          if (wei !== 'undefined') {
            currentTokenBalance = wei / Math.pow(10, 18);
            if (currentSrcToken.symbol === 'TOMO') {
              $('#current-account-token-amount').html(currentSrcToken.symbol + ": " + currentTokenBalance);
              $('#current-account-token-amount-transfer').html(currentSrcToken.symbol + ": " + currentTokenBalance);
            }
          }
        });
      }
    }
  }

});




