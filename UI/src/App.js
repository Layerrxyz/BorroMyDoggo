import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect, lightConnect } from "./redux/blockchain/blockchainActions";
import { fetchDog } from "./redux/dog/dogActions";
import { fetchStats } from "./redux/stats/statsActions";
import { fetchPass } from "./redux/pass/passActions";
import * as s from "./styles/globalStyles";
import styled from "styled-components";
import Web3 from "web3";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faTwitter,
  faLinkedin,
  faDiscord,
} from "@fortawesome/free-brands-svg-icons";
import { sign } from "web3-token";

const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;

export const StyledButton = styled.button`
  padding: 10px;
  border-radius: 15px;
  border: none;
  background-color: var(--secondary);
  padding: 5px 10px 5px 10px;
  margin: 10px;
  font-size: 20px;
  font-family: "CloneRounded";
  color: var(--secondary-text);
  width: 120px;
  height: 60px;
  cursor: pointer;
`;
export const StyledPassButton = styled.button`
  padding: 10px;
  border-radius: 15px;
  border: none;
  background-color: var(--secondary);
  padding: 5px 10px 5px 10px;
  margin: 10px;
  font-size: 20px;
  font-family: "CloneRounded";
  color: var(--secondary-text);
  width: 150px;
  height: 60px;
  cursor: pointer;
`;
export const NavButton = styled.button`
  padding: 10px;
  border-radius: 15px;
  border: none;
  background-color: var(--nav-button);
  padding: 5px 10px 5px 10px;
  margin: 5px;
  font-size: 20px;
  font-family: "CloneRounded";
  color: var(--nav-button-text);
  width: 160px;
  height: 60px;
  cursor: pointer;
`;

export const ResponsiveWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: stretched;
  align-items: stretched;
  width: 100%;
  @media (min-width: 767px) {
    flex-direction: row;
  }
`;

export const StyledLogo = styled.img`
  width: 200px;
  @media (min-width: 767px) {
    width: 300px;
  }
  transition: width 0.5s;
  transition: height 0.5s;
`;

export const StyledLink = styled.a`
  color: var(--secondary-text);
  text-decoration: none;
`;

export const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  width: 100%;
`;

export const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

export const NavContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: center;
  align-items: flex-end;
  flex-wrap: wrap;
  width: 100%;
`;

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const dog = useSelector((state) => state.dog);
  const pass = useSelector((state) => state.pass);
  const stats = useSelector((state) => state.stats);
  const [currentPage, setCurrentPage] = useState('BUY');
  const [txPending, setTXPending] = useState(false);
  const [feedback, setFeedback] = useState(``);
  const [costToRent, setCostToRent] = useState(0);
  const [totalCostToRent, setTotalCostToRent] = useState("0");
  const [baycIds, setBaycIds] = useState(new Array(10000).fill(false));
  const [maycIds, setMaycIds] = useState(new Array(40000).fill(false));
  const [dogIds, setDogIds] = useState(new Array(10000).fill(false));
  const [rentPassIds, setRentPassIds] = useState(new Array(30000).fill(false));
  const [currentPassIdToRent, setCurrentPassIdToRent] = useState(-1);
  const [passCostToPurchase, setPassCostToPurchase] = useState(0);
  const [passCostToRent, setPassCostToRent] = useState(0);
  const [passPurchaseAllowed, setPassPurchaseAllowed] = useState(false);
  const [passRentalAllowed, setPassRentalAllowed] = useState(false);
  const [currentPassPurchaseAllowed, setCurrentPassPurchaseAllowed] = useState(false);
  const [currentPassRentalAllowed, setCurrentPassRentalAllowed] = useState(false);
  const [currentPassPurchaseCost, setCurrentPassPurchaseCost] = useState(0);
  const [currentPassRentalCost, setCurrentPassRentalCost] = useState(0);
  const [currentPassRentalHours, setCurrentPassRentalHours] = useState(0);
  const [currentPassRentalCostTotal, setCurrentPassRentalCostTotal] = useState(0);
  const [currentPassMode, setCurrentPassMode] = useState(-1);
  const [CONFIG, SET_CONFIG] = useState({
    RENTADOG_CONTRACT_ADDRESS: "0xb0bFF1a7D2Eb226f2DEBfA89F28A543c0a645D9c",
    HELPER_CONTRACT_ADDRESS: "0x81311e6cdDEF848ea32190a903F7d904faB4B6A2",
    PLAY_MY_PASS_CONTRACT_ADDRESS: "0x2FEdf7c571544d1c04F9c4643082d01a2c81C2f1",
    DELEGATE_CASH_CONTRACT_ADDRESS: "0x00000000000076A84feF008CDAbe6409d2FE638B",
    SEWER_PASS_CONTRACT_ADDRESS: "0x764AeebcF425d56800eF2c84F2578689415a2DAa",
    NETWORK: {
      NAME: "Ethereum",
      SYMBOL: "ETH",
      ID: 1,
    },
    SHOW_BACKGROUND: true,
  });

  const PassMode = {
    Rent:  1,
    Deposit: 2,
    Update: 3,
    Withdraw: 4,
    Extend: 5
  };

  const params = new URLSearchParams(location.search);
  const ref = params.get("ref");

  if (ref) {
    localStorage.setItem("referral", ref);
    params.delete("ref");
    window.location.search = "";
  }

  const loanDogs = () => {
    let rentCostWEI = 0;
    try {
      rentCostWEI = Web3.utils.toWei(costToRent);
    } catch (err) {}
    setFeedback(
      "ALLOWING RENT-ING @ " +
        Math.floor(rentCostWEI / 10 ** 14) / 10 ** 4 +
        "E"
    );
    setTXPending(true);
    let dogsToLoan = [];
    for (let i = 0; i < dog.bakcTokens.length; i++) {
      if (dogIds[dog.bakcTokens[i].tokenId]) {
        dogsToLoan.push(dog.bakcTokens[i].tokenId);
      }
    }
    if (dogsToLoan.length == 0) {
      setFeedback("NOTHING SELECTED");
      setTXPending(false);
      return;
    }
    if (rentCostWEI == 0) {
      setFeedback("COST TO RENT MUST BE > 0");
      setTXPending(false);
      return;
    }
    try {
      blockchain.rentmydogContract.methods
        .loanDawgs(dogsToLoan, rentCostWEI)
        .send({
          to: CONFIG.RENTADOG_CONTRACT_ADDRESS,
          from: blockchain.account,
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("SORRY, SOMETHING WENT WRONG");
          setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(`DOGS LOAN-ABILITY ALLOWED`);
          setTXPending(false);
          dispatch(fetchDog(blockchain.account));
          resetSelections();
        });
    } catch (err) {
      console.log(err);
      setFeedback("SORRY, SOMETHING WENT WRONG");
      setTXPending(false);
    }
  };

  const unloanDogs = () => {
    setFeedback("UNLOAN-ING");
    setTXPending(true);
    let dogsToUnloan = [];
    for (let i = 0; i < dog.bakcTokens.length; i++) {
      if (dogIds[dog.bakcTokens[i].tokenId]) {
        dogsToUnloan.push(dog.bakcTokens[i].tokenId);
      }
    }
    if (dogsToUnloan.length == 0) {
      setFeedback("NOTHING SELECTED");
      setTXPending(false);
      return;
    }
    try {
      blockchain.rentmydogContract.methods
        .unloanDawgs(dogsToUnloan)
        .send({
          to: CONFIG.RENTADOG_CONTRACT_ADDRESS,
          from: blockchain.account,
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("SORRY, SOMETHING WENT WRONG");
          setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(`DOGS LOAN-ABILITY REVOKED`);
          setTXPending(false);
          dispatch(fetchDog(blockchain.account));
          resetSelections();
        });
    } catch (err) {
      console.log(err);
      setFeedback("SORRY, SOMETHING WENT WRONG");
      setTXPending(false);
    }
  };

  const delegateToRAD = () => {
    setFeedback("DELEGATING ACCESS...");
    setTXPending(true);
    try {
      blockchain.delegatecashContract.methods
        .delegateForAll(CONFIG.RENTADOG_CONTRACT_ADDRESS, true)
        .send({
          to: CONFIG.DELEGATE_CASH_CONTRACT_ADDRESS,
          from: blockchain.account,
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("SORRY, SOMETHING WENT WRONG");
          setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(`YOUR WALLET IS DELEGATED`);
          setTXPending(false);
          dispatch(fetchDog(blockchain.account));
        });
    } catch (err) {
      console.log(err);
      setFeedback("SORRY, SOMETHING WENT WRONG");
      setTXPending(false);
    }
  };

  const approveRMP = () => {
    setFeedback("SETTING APPROVAL...");
    setTXPending(true);
    try {
      blockchain.sewerpassContract.methods
        .setApprovalForAll(CONFIG.PLAY_MY_PASS_CONTRACT_ADDRESS, true)
        .send({
          to: CONFIG.SEWER_PASS_CONTRACT_ADDRESS,
          from: blockchain.account,
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("SORRY, SOMETHING WENT WRONG");
          setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(`YOUR WALLET IS APPROVED`);
          setTXPending(false);
          dispatch(fetchPass(blockchain.account));
        });
    } catch (err) {
      console.log(err);
      setFeedback("SORRY, SOMETHING WENT WRONG");
      setTXPending(false);
    }
  };

  const rentDogs = () => {
    setFeedback("RENT-ING");
    setTXPending(true);
    let totalCostWEI = 0;
    let rentDogIds = [];
    let myBaycIds = [];
    let myMaycIds = [];
    for (let i = 0; i < dog.availableDogs.length; i++) {
      if (dogIds[dog.availableDogs[i].dawgId]) {
        rentDogIds.push(dog.availableDogs[i].dawgId);
        totalCostWEI += getCurrentCost(dog.availableDogs[i].dawgId);
      }
    }
    for (let i = 0; i < dog.baycTokens.length; i++) {
      if (baycIds[dog.baycTokens[i].tokenId]) {
        myBaycIds.push(dog.baycTokens[i].tokenId);
      }
    }
    for (let i = 0; i < dog.maycTokens.length; i++) {
      if (maycIds[dog.maycTokens[i].tokenId]) {
        myMaycIds.push(dog.maycTokens[i].tokenId);
      }
    }
    if (myBaycIds.length + myMaycIds.length != rentDogIds.length) {
      setFeedback("MUST SELECT EQUAL NUMBER OF APES AND DOGS");
      setTXPending(false);
      return;
    }
    if (myBaycIds.length + myMaycIds.length == 0) {
      setFeedback("NOTHING SELECTED");
      setTXPending(false);
      return;
    }
    try {
      blockchain.rentmydogContract.methods
        .rentADawgs(myBaycIds, myMaycIds, rentDogIds)
        .send({
          to: CONFIG.RENTADOG_CONTRACT_ADDRESS,
          from: blockchain.account,
          value: totalCostWEI,
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("SORRY, SOMETHING WENT WRONG");
          setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(`SEWER PASSES MINTED!`);
          setTXPending(false);
          dispatch(fetchDog(blockchain.account));
          resetSelections();
        });
    } catch (err) {
      console.log(err);
      setFeedback("SORRY, SOMETHING WENT WRONG");
      setTXPending(false);
    }
  };

  const updatePasses = () => {
    let rentCostGWEI = 0;
    let purchaseCostGWEI = 0;
    try {
      rentCostGWEI = Web3.utils.fromWei(Web3.utils.toWei(passCostToRent), 'gwei');
      purchaseCostGWEI =Web3.utils.fromWei(Web3.utils.toWei(passCostToPurchase), 'gwei');
    } catch (err) {}
    setFeedback("UPDATING PASS RENTALS");
    setTXPending(true);
    let passIdsToUpdate = [];
    let purchasesAllowed = [];
    let rentalsAllowed = [];
    let purchasePrices = [];
    let rentalPrices = [];
    for (let i = 0; i < pass.myPassesForRent.length; i++) {
      if (rentPassIds[pass.myPassesForRent[i].passId]) {
        passIdsToUpdate.push(pass.myPassesForRent[i].passId);
      }
    }
    if (passIdsToUpdate.length == 0) {
      setFeedback("NOTHING SELECTED");
      setTXPending(false);
      return;
    }
    if (rentCostGWEI == 0 && passRentalAllowed) {
      setFeedback("COST TO RENT MUST BE > 0");
      setTXPending(false);
      return;
    }
    if (purchaseCostGWEI == 0 && passPurchaseAllowed) {
      setFeedback("COST TO PURCHASE MUST BE > 0");
      setTXPending(false);
      return;
    }
    for(let i = 0;i < passIdsToUpdate.length;i++) {
      purchasesAllowed.push(passPurchaseAllowed);
      rentalsAllowed.push(passRentalAllowed);
      purchasePrices.push(purchaseCostGWEI);
      rentalPrices.push(rentCostGWEI);
    }
    try {
      blockchain.playmypassContract.methods
        .updatePasses(passIdsToUpdate, purchasesAllowed, rentalsAllowed, purchasePrices, rentalPrices)
        .send({
          to: CONFIG.PLAY_MY_PASS_CONTRACT_ADDRESS,
          from: blockchain.account,
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("SORRY, SOMETHING WENT WRONG");
          setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(`PASSES UPDATED`);
          setTXPending(false);
          dispatch(fetchPass(blockchain.account));
          resetSelections();
        });
    } catch (err) {
      console.log(err);
      setFeedback("SORRY, SOMETHING WENT WRONG");
      setTXPending(false);
    }
  };

  const depositPasses = () => {
    let rentCostGWEI = 0;
    let purchaseCostGWEI = 0;
    try {
      rentCostGWEI = Web3.utils.fromWei(Web3.utils.toWei(passCostToRent), 'gwei');
      purchaseCostGWEI =Web3.utils.fromWei(Web3.utils.toWei(passCostToPurchase), 'gwei');
    } catch (err) {}
    setFeedback("DEPOSITING PASSES");
    setTXPending(true);
    let passIdsToDeposit = [];
    let purchasesAllowed = [];
    let purchasePrices = [];
    let rentalPrices = [];
    for (let i = 0; i < pass.spTokens.length; i++) {
      if (rentPassIds[pass.spTokens[i]]) {
        passIdsToDeposit.push(pass.spTokens[i]);
      }
    }
    if (passIdsToDeposit.length == 0) {
      setFeedback("NOTHING SELECTED");
      setTXPending(false);
      return;
    }
    if (rentCostGWEI == 0) {
      setFeedback("COST TO RENT MUST BE > 0");
      setTXPending(false);
      return;
    }
    if (purchaseCostGWEI == 0 && passPurchaseAllowed) {
      setFeedback("COST TO PURCHASE MUST BE > 0");
      setTXPending(false);
      return;
    }
    for(let i = 0;i < passIdsToDeposit.length;i++) {
      purchasesAllowed.push(passPurchaseAllowed);
      purchasePrices.push(purchaseCostGWEI);
      rentalPrices.push(rentCostGWEI);
    }
    try {
      blockchain.playmypassContract.methods
        .depositPasses(passIdsToDeposit, purchasesAllowed, purchasePrices, rentalPrices)
        .send({
          to: CONFIG.PLAY_MY_PASS_CONTRACT_ADDRESS,
          from: blockchain.account,
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("SORRY, SOMETHING WENT WRONG");
          setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(`PASSES DEPOSITED`);
          setTXPending(false);
          dispatch(fetchPass(blockchain.account));
          resetSelections();
        });
    } catch (err) {
      console.log(err);
      setFeedback("SORRY, SOMETHING WENT WRONG");
      setTXPending(false);
    }
  };

  const withdrawPasses = () => {
    setFeedback("WITHDRAWING PASSES");
    setTXPending(true);
    let passIdsToWithdraw = [];
    let currentlyRentedCount = 0;
    for (let i = 0; i < pass.myPassesForRent.length; i++) {
      if (rentPassIds[pass.myPassesForRent[i].passId]) {
        let passIsRented = false;
        for(let j = 0;j < pass.myPassesRented.length;j++) {
          if(pass.myPassesForRent[i].passId == pass.myPassesRented[j].passId) {
            currentlyRentedCount++;
            passIsRented = true;
            break;
          }
        }
        if(!passIsRented) {
          passIdsToWithdraw.push(pass.myPassesForRent[i].passId);
        }
      }
    }
    if (passIdsToWithdraw.length == 0 && currentlyRentedCount == 0) {
      setFeedback("NOTHING SELECTED");
      setTXPending(false);
      return;
    }
    if(currentlyRentedCount > 0) {
      setFeedback("WITHDRAWING UNRENTED PASSES");
    }
    try {
      blockchain.playmypassContract.methods
        .withdrawPasses(passIdsToWithdraw)
        .send({
          to: CONFIG.PLAY_MY_PASS_CONTRACT_ADDRESS,
          from: blockchain.account,
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("SORRY, SOMETHING WENT WRONG");
          setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(`PASSES WITHDRAWN`);
          setTXPending(false);
          dispatch(fetchPass(blockchain.account));
          resetSelections();
        });
    } catch (err) {
      console.log(err);
      setFeedback("SORRY, SOMETHING WENT WRONG");
      setTXPending(false);
    }
  };

  const rentPass = () => {
    setFeedback("RENTING PASS");
    setTXPending(true);

    let rentalCostWEI = 0;
    try {
      rentalCostWEI = Web3.utils.toWei(currentPassRentalCostTotal.toString(), 'gwei');
    } catch(err) {}

    if(currentPassIdToRent == -1) {
      setFeedback("NO PASS SELECTED");
      setTXPending(false);
      return;
    }
    if(currentPassRentalHours == 0) {
      setFeedback("RENTAL HOURS MUST BE > 0");
      setTXPending(false);
      return;
    }
    if (rentalCostWEI == 0) {
      setFeedback("INVALID RENTAL COST");
      setTXPending(false);
      return;
    }
    try {
      blockchain.playmypassContract.methods
        .rentPass(currentPassIdToRent, currentPassRentalHours)
        .send({
          to: CONFIG.PLAY_MY_PASS_CONTRACT_ADDRESS,
          from: blockchain.account,
          value: rentalCostWEI
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("SORRY, SOMETHING WENT WRONG");
          setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(`PASS RENTED - GO PLAY SOME DOOKEY!`);
          setTXPending(false);
          dispatch(fetchPass(blockchain.account));
          resetSelections();
        });
    } catch (err) {
      console.log(err);
      setFeedback("SORRY, SOMETHING WENT WRONG");
      setTXPending(false);
    }
  };

  const purchasePass = () => {
    setFeedback("PURCHASING PASS");
    setTXPending(true);

    let purchaseCostWEI = 0;
    try {
      purchaseCostWEI = Web3.utils.toWei(currentPassPurchaseCost.toString(), 'gwei');
    } catch(err) {}

    if(currentPassIdToRent == -1) {
      setFeedback("NO PASS SELECTED");
      setTXPending(false);
      return;
    }
    if (purchaseCostWEI == 0) {
      setFeedback("INVALID PURCHASE COST");
      setTXPending(false);
      return;
    }
    try {
      blockchain.playmypassContract.methods
        .purchasePass(currentPassIdToRent)
        .send({
          to: CONFIG.PLAY_MY_PASS_CONTRACT_ADDRESS,
          from: blockchain.account,
          value: purchaseCostWEI
        })
        .once("error", (err) => {
          console.log(err);
          setFeedback("SORRY, SOMETHING WENT WRONG");
          setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(`PASS PURCHASED - GO PLAY SOME DOOKEY!`);
          setTXPending(false);
          dispatch(fetchPass(blockchain.account));
          resetSelections();
        });
    } catch (err) {
      console.log(err);
      setFeedback("SORRY, SOMETHING WENT WRONG");
      setTXPending(false);
    }
  };

  const toggleDogId = (position) => {
    position = parseInt(position);
    const updateTokens = dogIds.map((item, index) =>
      index === position ? !item : item
    );
    if (currentPage == "BUY") {
      let totalCostWEI = 0;
      for (let i = 0; i < dog.availableDogs.length; i++) {
        if (updateTokens[dog.availableDogs[i].dawgId]) {
          totalCostWEI += parseInt(dog.availableDogs[i].rentACost);
        }
      }
      setTotalCostToRent(totalCostWEI);
    }
    setDogIds(updateTokens);
  };

  const toggleBaycId = (position) => {
    position = parseInt(position);
    const updateTokens = baycIds.map((item, index) =>
      index === position ? !item : item
    );
    setBaycIds(updateTokens);
  };

  const toggleMaycId = (position) => {
    position = parseInt(position);
    const updateTokens = maycIds.map((item, index) =>
      index === position ? !item : item
    );
    setMaycIds(updateTokens);
  };

  const toggleRentPassId = (position, passMode, singlePass = false) => {
    let passId = parseInt(position);
    const updateTokens = rentPassIds.map((item, index) =>
      index === passId ? !item : (singlePass ? false : item)
    );
    setRentPassIds(updateTokens);

    if(passMode == PassMode.Rent) {
      setCurrentPassIdToRent((updateTokens[passId] ? passId : -1));
      for(let i = 0;i < pass.availableToRent.length;i++) {
        if(parseInt(pass.availableToRent[i].passId) == passId) {
          setCurrentPassPurchaseAllowed(pass.availableToRent[i].purchaseAllowed);
          setCurrentPassRentalAllowed(pass.availableToRent[i].rentalAllowed);
          setCurrentPassPurchaseCost(parseInt(pass.availableToRent[i].purchasePrice));
          setCurrentPassRentalCost(parseInt(pass.availableToRent[i].hourlyRentalPrice));
          setCurrentPassRentalCostTotal(parseInt(pass.availableToRent[i].hourlyRentalPrice) * currentPassRentalHours);
          break;
        }
      }
    } else if(passMode == PassMode.Extend) {
      setCurrentPassIdToRent((updateTokens[passId] ? passId : -1));
      for(let i = 0;i < pass.myRentals.length;i++) {
        if(parseInt(pass.myRentals[i].passId) == passId) {
          setCurrentPassRentalAllowed(!pass.myRentals[i].cannotExtend);
          setCurrentPassRentalCost(parseInt(pass.myRentals[i].hourlyRentalPrice));
          setCurrentPassRentalCostTotal(parseInt(pass.myRentals[i].hourlyRentalPrice) * currentPassRentalHours);
          break;
        }
      }
      setCurrentPassPurchaseAllowed(pass.rentalPurchasePrice[position].purchaseAllowed);
      setCurrentPassPurchaseCost(parseInt(pass.rentalPurchasePrice[position].purchasePrice));
    } else {
      setCurrentPassIdToRent(-1);
    }
    setCurrentPassMode(passMode);
  };

  const resetSelections = () => {
    setDogIds(new Array(10000).fill(false));
    setBaycIds(new Array(10000).fill(false));
    setMaycIds(new Array(40000).fill(false));
    setRentPassIds(new Array(30000).fill(false));
    setTotalCostToRent(0);
    setCostToRent(0);
    setCurrentPassIdToRent(-1);
    setCurrentPassPurchaseAllowed(false);
    setCurrentPassRentalAllowed(false);
    setCurrentPassPurchaseCost(0);
    setCurrentPassRentalCost(0);
    setCurrentPassRentalCostTotal(0);
    setCurrentPassRentalHours(0);
    setFeedback("");
  };

  const isRented = (passId) => {
    for (let i = 0; i < pass.myPassesRented.length; i++) {
      if(passId === pass.myPassesRented[i].passId) { return true; }
    }
    return false;
  };

  const myPassRentalEnd = (passId) => {
    for (let i = 0; i < pass.myPassesRented.length; i++) {
      if(passId === pass.myPassesRented[i].passId) { return parseInt(pass.myPassesRented[i].rentalEnd); }
    }
    return 0;
  };

  const getCurrentCost = (dogId) => {
    for (let i = 0; i < dog.availableDogs.length; i++) {
      if (dog.availableDogs[i].dawgId == dogId) {
        return parseInt(dog.availableDogs[i].rentACost);
      }
    }
    return 0;
  };

  const getDogs = () => {
    if (blockchain.account !== "" && blockchain.helperContract !== null) {
      resetSelections();
      dispatch(fetchDog(blockchain.account));
    } else if(blockchain.account == "" && blockchain.helperContract !== null) {
      dispatch(fetchDog());
    }
  };

  const getPasses = () => {
    if (blockchain.account !== "" && blockchain.playmypassContract !== null) {
      resetSelections();
      dispatch(fetchPass(blockchain.account));
    } else if(blockchain.account == "" && blockchain.playmypassContract !== null) {
      dispatch(fetchPass());
    }
  };

  const getStats = () => {
    dispatch(fetchStats());
  };

  const updateRentCost = (e) => {
    const cost = e.target.value;
    if (!cost || cost.match(/^\d{1,}(\.\d{0,4})?$/)) {
      setCostToRent(cost);
    }
  };

  const updatePassRentCost = (e) => {
    const cost = e.target.value;
    if (!cost || cost.match(/^\d{1,}(\.\d{0,4})?$/)) {
      setPassCostToRent(cost);
    }
  };

  const updatePassPurchaseCost = (e) => {
    const cost = e.target.value;
    if (!cost || cost.match(/^\d{1,}(\.\d{0,4})?$/)) {
      setPassCostToPurchase(cost);
    }
  };

  const updatePassRentHours = (e) => {
    const hours = e.target.value;
    if (!hours || hours.match(/^\d+$/)) {
      setCurrentPassRentalHours(hours);
      setCurrentPassRentalCostTotal(currentPassRentalCost * hours);
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  const signReferral = (ref) =>
    sign(
      (message) =>
        blockchain.web3.eth.personal.sign(message, blockchain.account),
      {
        statement: `I am signing this message to prove that I am the owner of the Ethereum address ${blockchain.account} and that I am authorizing the use of this address as a referral code for ${ref}, so that they can receive some of the fees for transactions I make with the Rent-A-Dawg application.`,
        expires_in: "1m",
        nonce: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
        request_id: Date.now(),
      }
    ).then((signature) => {
      fetch(`/.netlify/functions/referral?referrer=${ref}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${signature}`,
        },
        method: "POST",
      });
      localStorage.removeItem("referral");
    });

  useEffect(() => {
    getConfig();
    getStats();
    dispatch(lightConnect());
  }, []);

  useEffect(() => {
    if (blockchain.account) {
      const ref = localStorage.getItem("referral");
      if (ref) signReferral(ref);
    }
    getDogs();
    getPasses();
  }, [blockchain.account]);

  useEffect(() => {}, [currentPage]);
  useEffect(() => {}, [stats]);

  return (
    <s.Screen>
      <s.Container
        flex={1}
        ai={"center"}
        style={{ padding: 24, backgroundColor: "var(--primary)" }}
        image={CONFIG.SHOW_BACKGROUND ? "/config/images/bg.png" : null}
      >
        <HeaderContainer style={{ paddingLeft: 48, paddingRight: 48 }}>
          <LogoContainer>
            <StyledLogo alt={"logo"} src={"/config/images/logo.png"} />
          </LogoContainer>
          <LogoContainer>
            <div id="w-s2-footer">
              <div id="w-s2-footer-socials">
                <a
                  className="socialicon"
                  href="https://www.instagram.com/layerrxyz/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-socialinner">
                    <FontAwesomeIcon icon={faInstagram} size="1x" />
                  </div>
                </a>
                <a
                  className="socialicon"
                  href="https://twitter.com/Layerrxyz"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-socialinner">
                    <FontAwesomeIcon icon={faTwitter} size="1x" />
                  </div>
                </a>
                <a
                  className="socialicon"
                  href="https://discord.gg/d84gxvthmj"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-socialinner">
                    <FontAwesomeIcon icon={faDiscord} size="1x" />
                  </div>
                </a>
                <a
                  className="socialicon"
                  href="https://www.linkedin.com/company/layerrxyz/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-socialinner">
                    <FontAwesomeIcon icon={faLinkedin} size="1x" />
                  </div>
                </a>
              </div>
            </div>
          </LogoContainer>

          { currentPage == "BUY" || currentPage == "SELL" ?
          <LogoContainer>
            <s.TextTitle>
              Contracts audited by
              <a href="https://twitter.com/0xQuit"> @0xQuit</a> of 
              <a href="https://boringsecurity.com"> @BoringSecDAO</a>
            </s.TextTitle>
          </LogoContainer>
          : null}

          <NavContainer>
            <NavButton
              onClick={() => {
                resetSelections();
                setCurrentPage("BUY");
              }}
              style={{
                backgroundColor: currentPage == "BUY"
                  ? "var(--nav-button-selected)"
                  : "var(--nav-button)",
              }}
            >
              RENT DOGS
            </NavButton>
            <NavButton
              onClick={() => {
                resetSelections();
                setCurrentPage("SELL");
              }}
              style={{
                backgroundColor: currentPage == "SELL"
                  ? "var(--nav-button-selected)"
                  : "var(--nav-button)",
              }}
            >
              SELL BOOSTS
            </NavButton>
            { true ? 
            <NavButton
              onClick={() => {
                resetSelections();
                setCurrentPage("PLAY");
              }}
              style={{
                backgroundColor: currentPage == "PLAY"
                  ? "var(--nav-button-selected)"
                  : "var(--nav-button)",
              }}
            >
              PASS RENTAL
            </NavButton>
            : null }
            <NavButton onClick={() => { if(currentPage == "BUY" || currentPage == "SELL") { getStats(); getDogs(); } else { getPasses(); } }} style={{ backgroundColor: "var(--nav-button)" }} >
              REFRESH
            </NavButton>
          </NavContainer>
        </HeaderContainer>
        <ResponsiveWrapper flex={1} style={{ padding: 24 }} test>
          <s.SpacerLarge />
          <s.Container
            flex={2}
            jc={"center"}
            ai={"center"}
            style={{
              backgroundColor: "var(--accent)",
              padding: 24,
              borderRadius: 24,
              border: false ? "0px" : "4px var(--secondary)",
              boxShadow: false ? "0px" : "0px 5px 11px 2px rgba(0,0,0,0.7)",
            }}
          >
            {currentPage != "PLAY" && !stats.loading && !stats.error ? <>
              <s.Container ai={"center"} jc={"center"} fd={"column"}>
                <s.TextDescription style={{color: "#FFFFFF", fontSize: "30px", textAlign: "center"}}>
                  TIER 4 IN TOP 100: <span style={{paddingLeft: "10px", color: "#CCCCFF", fontSize: "30px"}}>{stats.tier4Top100}</span>
                </s.TextDescription>
                <s.TextDescription style={{color: "#FFFFFF", fontSize: "30px", textAlign: "center"}}>
                  TOP RANK NON-T4: <span style={{paddingLeft: "10px", color: "#CCCCFF", fontSize: "30px"}}>{stats.topRankNonTier4 == 0 ? ">500" : "#" + stats.topRankNonTier4 + " (T" + stats.topNonTier4Tier + ")"}</span>
                </s.TextDescription>
                <s.TextDescription style={{color: "#FFFFFF", fontSize: "30px", textAlign: "center"}}>
                  BOOST VALUE: <span style={{paddingLeft: "10px", color: "#CCCCFF", fontSize: "30px"}}>{Math.floor((stats.lastT4Sale - stats.lastT3Sale)*100)/100}E</span>
                </s.TextDescription>
                { currentPage == "SELL" ? 
                  <>
                    <s.TextDescription style={{color: "#FFFFFF", fontSize: "30px", textAlign: "center"}}>
                      FLOOR DIFF FOR UNCLAIMED: <span style={{paddingLeft: "10px", color: "#CCCCFF", fontSize: "30px"}}>{Math.floor((stats.floorUnclaimed - stats.floorClaimed)*100)/100}E</span>
                    </s.TextDescription>
                  </> :
                  <>
                    <s.TextDescription style={{color: "#FFFFFF", fontSize: "30px", textAlign: "center"}}>
                      UNCLAIMED DOG FLOOR: <span style={{paddingLeft: "10px", color: "#CCCCFF", fontSize: "30px"}}>{Math.floor((stats.floorUnclaimed)*100)/100}E</span>
                    </s.TextDescription>
                  </>
                }
              </s.Container>
              <s.SpacerLarge />
            </> : null}
                {
                  {
                    "SELL": (
                      <>
                        {
                          blockchain.account === "" || blockchain.rentmydogContract === null ? (
                            <>
                              <s.SpacerMedium />
                              <s.Container ai={"center"} jc={"center"}>
                                <s.TextDescription style={{textAlign: "center", color: "var(--accent-text)", fontSize: "30px", }}>
                                  Connect to the {CONFIG.NETWORK.NAME} network
                                </s.TextDescription>
                                <s.SpacerSmall />
                                <StyledButton onClick={(e) => { e.preventDefault(); dispatch(connect()); getDogs(); }}>
                                  CONNECT
                                </StyledButton>
                                {blockchain.errorMsg !== "" ? (
                                  <>
                                    <s.SpacerSmall />
                                    <s.TextDescription style={{textAlign: "center", color: "var(--accent-text)", }}>
                                      {blockchain.errorMsg}
                                    </s.TextDescription>
                                  </>
                                ) : null}
                              </s.Container>
                            </>
                        ) : (
                          <>
                            {dog.loading ? (
                              <>
                                <s.Container ai={"center"} jc={"center"} fd={"column"} fw={"wrap"}>
                                  <s.Container ai={"center"} jc={"center"} fd={"row"} fw={"wrap"}>
                                    <s.TextDescription style={{ color: "#FFFFFF", fontSize: "30px" }}>
                                      LOADING...
                                    </s.TextDescription>
                                  </s.Container>
                                </s.Container>
                              </>
                            ) : (
                              <>
                                <s.Container ai={"center"} jc={"center"} fd={"column"} fw={"wrap"}>
                                  {dog.bakcTokens.filter((obj) => !obj.claimed && obj.delegated).length > 0 ? (
                                    <>
                                      <s.TextDescription style={{ color: "#FFFFFF", fontSize: "40px", textAlign: "center", }} >
                                        DOGS WITH BOOST TO SELL
                                      </s.TextDescription>
                                      <s.SpacerMedium />
                                      <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                        style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                        {dog.bakcTokens &&
                                        dog.bakcTokens.length > 0 ? (
                                          <>
                                            {dog.bakcTokens.filter((obj) => !obj.claimed && obj.delegated).map((obj) => (
                                                <s.Container ai={"center"} jc={"center"}
                                                  style={{padding: "10px", margin: "5px", backgroundColor: dogIds[obj.tokenId] ? "#33AA55FF" : "#FFFFFF00", borderRadius: "10px",}}
                                                  onClick={(e) => { toggleDogId(obj.tokenId); }}>
                                                  {getCurrentCost(obj.tokenId) > 0 ? (
                                                    <>
                                                      <s.TextDescription style={{color: "#FFFFFF",fontSize: "20px",}}>
                                                        COST: {Math.floor(getCurrentCost(obj.tokenId) / 10 ** 16) / 10**2}E
                                                      </s.TextDescription>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <s.TextDescription style={{color: "#FFFFFF", fontSize: "20px", }}>
                                                        NOT LISTED
                                                      </s.TextDescription>
                                                    </>
                                                  )}
                                                  <s.SpacerSmall />
                                                  <StyledButton>
                                                    DOG #{obj.tokenId}
                                                  </StyledButton>
                                                </s.Container>
                                              ))}
                                          </>
                                        ) : (
                                          <></>
                                        )}
                                      </s.Container>
                                      <s.SpacerMedium />
                                      <s.Container
                                        ai={"center"} jc={"center"} fd="column" fw={"wrap"}
                                        style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                        <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                          style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                          <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                            RENT COST:{" "}
                                          </s.TextDescription>
                                          <s.SpacerSmall />
                                          <input defaultValue={"0"} value={costToRent} type="text" 
                                            style={{ width: "150px", height: "30px", fontSize: "25px", textAlign: "center", }} 
                                            onChange={(e) => { updateRentCost(e); }} />
                                        </s.Container>
                                        <s.Container 
                                          ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                          style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                            <StyledButton disabled={txPending} onClick={(e) => { e.preventDefault(); loanDogs(); }}>
                                              {txPending ? "BUSY" : "LIST BOOSTS"}
                                            </StyledButton>
                                            <s.SpacerSmall />
                                            <StyledButton disabled={txPending} onClick={(e) => { e.preventDefault(); unloanDogs(); }}>
                                              {txPending ? "BUSY" : "DELIST BOOSTS"}
                                            </StyledButton>
                                        </s.Container>
                                        <s.Container
                                          ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                          style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                            <s.TextDescription style={{ color: "#FFFFFF", fontSize: "30px", }}>
                                              {feedback}
                                            </s.TextDescription>
                                        </s.Container>
                                      </s.Container>
                                    </>
                                  ) : (
                                    <>
                                      <s.TextDescription style={{ color: "#FFFFFF", fontSize: "40px", }}>
                                        NO DOG BOOSTS TO SELL
                                      </s.TextDescription>
                                    </>
                                  )}
                                  {dog.bakcTokens.filter((obj) => !obj.claimed && !obj.delegated).length > 0 ? (
                                    <>
                                      <s.SpacerLarge />
                                      <s.TextDescription style={{ color: "#DFAA13", fontSize: "40px", textAlign: "center", }}>
                                        YOUR DOGS NEED TO BE DELEGATED
                                      </s.TextDescription>
                                      <s.SpacerSmall />
                                      <s.TextDescription style={{ color: "#DFAA13", fontSize: "20px", textAlign: "center", }}>
                                        TO SELL DOGS BOOSTS, USE DELEGATE.CASH TO
                                        DELEGATE FROM YOUR DOG WALLET TO THE
                                        RENTMYDOG CONTRACT OR CLICK THE DELEGATE ALL BUTTON BELOW
                                      </s.TextDescription>
                                      <s.TextDescription style={{ color: "#DFAA13", fontSize: "20px", textAlign: "center", }}>
                                        RENTMYDOG ADDRESS:{" "}
                                        {CONFIG.RENTADOG_CONTRACT_ADDRESS}
                                      </s.TextDescription>
                                      <s.SpacerSmall />
                                      <StyledButton
                                        disabled={txPending}
                                        onClick={(e) => { e.preventDefault(); delegateToRAD(); }}>
                                          {txPending ? "BUSY" : "DELEGATE ALL"}
                                      </StyledButton>
                                    </>
                                  ) : null}
                                </s.Container>
                              </>
                            )}
                          </>
                        ) } </>
                    ),
                    "BUY": (
                      <>
                        {dog.loading ? (
                          <>
                            <s.Container ai={"center"} jc={"center"} fd={"column"} fw={"wrap"}>
                              <s.Container ai={"center"} jc={"center"} fd={"row"} fw={"wrap"}>
                                <s.TextDescription style={{ color: "#FFFFFF", fontSize: "30px" }}>
                                  LOADING...
                                </s.TextDescription>
                              </s.Container>
                            </s.Container>
                          </>
                        ) : (
                          <>
                            <s.Container ai={"center"} jc={"center"} fd={"column"} fw={"wrap"}>
                              {dog.baycTokens.filter((obj) => !obj.claimed && obj.delegated).length > 0 ? (
                                <>
                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "40px", textAlign: "center", }}>
                                    BAYC TO CLAIM WITH BOOST
                                  </s.TextDescription>
                                  <s.SpacerMedium />
                                  <s.Container
                                    ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                    style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                    {dog.baycTokens && dog.baycTokens.length > 0 ? (
                                      <>
                                        {dog.baycTokens.filter((obj) => !obj.claimed && obj.delegated).map((obj) => (
                                            <s.Container ai={"center"} jc={"center"}
                                              style={{ padding: "10px", margin: "5px", backgroundColor: baycIds[obj.tokenId] ? "#33AA55FF" : "#FFFFFF00", borderRadius: "10px", }}
                                              onClick={(e) => { toggleBaycId(obj.tokenId); }}>
                                              <StyledButton>
                                                BAYC #{obj.tokenId}
                                              </StyledButton>
                                            </s.Container>
                                          ))}
                                      </>
                                    ) : (
                                      <></>
                                    )}
                                  </s.Container>
                                  <s.SpacerMedium />
                                </>
                              ) : null}

                              {dog.maycTokens.filter((obj) => !obj.claimed && obj.delegated).length > 0 ? (
                                <>
                                  <s.TextDescription style={{color: "#FFFFFF", fontSize: "40px", textAlign: "center", }}>
                                    MAYC TO CLAIM WITH BOOST
                                  </s.TextDescription>
                                  <s.SpacerMedium />
                                  <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                    style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                    {dog.maycTokens && dog.maycTokens.length > 0 ? (
                                      <>
                                        {dog.maycTokens.filter((obj) => !obj.claimed && obj.delegated).map((obj) => (
                                            <s.Container ai={"center"} jc={"center"}
                                              style={{ padding: "10px", margin: "5px", backgroundColor: maycIds[obj.tokenId] ? "#33AA55FF" : "#FFFFFF00", borderRadius: "10px",}}
                                              onClick={(e) => { toggleMaycId(obj.tokenId); }}>
                                              <StyledButton>
                                                MAYC #{obj.tokenId}
                                              </StyledButton>
                                            </s.Container>
                                          ))}
                                      </>
                                    ) : (
                                      <></>
                                    )}
                                  </s.Container>
                                  <s.SpacerMedium />
                                </>
                              ) : null}

                              <s.TextDescription style={{ color: "#FFFFFF", fontSize: "40px", textAlign: "center", }}>
                                DOG BOOSTS FOR SALE
                              </s.TextDescription>
                              <s.SpacerMedium />
                              <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                {dog.availableDogs && dog.availableDogs.length > 0 ? (
                                  <>
                                    {dog.availableDogs.map((obj) => (
                                        <s.Container ai={"center"} jc={"center"}
                                          style={{padding: "10px", margin: "5px", backgroundColor: dogIds[obj.dawgId] ? "#33AA55FF" : "#FFFFFF00", borderRadius: "10px",}}
                                          onClick={(e) => { toggleDogId(obj.dawgId); }}>
                                          <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                            COST: {Math.floor(getCurrentCost(obj.dawgId) / 10**16) / 10**2}E
                                          </s.TextDescription>
                                          <s.SpacerSmall />
                                          <StyledButton>
                                            DOG #{obj.dawgId}
                                          </StyledButton>
                                        </s.Container>
                                      ))}
                                  </>
                                  ) : (
                                    <>
                                      <s.TextDescription
                                        style={{
                                          color: "#FFFFFF",
                                          fontSize: "30px",
                                          textAlign: "center",
                                        }}
                                      >
                                        NO DOGS AVAILABLE
                                      </s.TextDescription>
                                    </>
                                  )}
                              </s.Container>


                              {blockchain.account === "" || blockchain.rentmydogContract === null ? (
                                <>
                                  <s.SpacerMedium />
                                  <s.Container ai={"center"} jc={"center"}>
                                    <s.TextDescription style={{ textAlign: "center", color: "var(--accent-text)", fontSize: "30px", }} >
                                      Connect to the {CONFIG.NETWORK.NAME} network
                                    </s.TextDescription>
                                    <s.SpacerSmall />
                                    <StyledButton onClick={(e) => { e.preventDefault(); dispatch(connect()); getDogs(); }}>
                                      CONNECT
                                    </StyledButton>
                                    {blockchain.errorMsg !== "" ? (
                                      <>
                                        <s.SpacerSmall />
                                        <s.TextDescription style={{ textAlign: "center", color: "var(--accent-text)", }}>
                                          {blockchain.errorMsg}
                                        </s.TextDescription>
                                      </>
                                    ) : null}
                                  </s.Container>
                                </>
                                ) : (
                                  <>

                              <s.SpacerMedium />
                              <s.Container ai={"center"} jc={"center"} fd="column" fw={"wrap"}
                                style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content",}}>
                                <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                  style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content",}}>
                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                    RENT COST: {Math.floor(totalCostToRent / 10**16) / 10**2}E
                                  </s.TextDescription>
                                </s.Container>
                                <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                  style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                  <StyledButton disabled={txPending} onClick={(e) => { e.preventDefault(); rentDogs(); }}>
                                    {txPending ? "BUSY" : "RENT & MINT"}
                                  </StyledButton>
                                </s.Container>
                                <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                  style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "30px", }}>
                                    {feedback}
                                  </s.TextDescription>
                                </s.Container>
                              </s.Container>

                              {dog.baycTokens.filter((obj) => !obj.claimed && !obj.delegated).length > 0 ||
                                dog.maycTokens.filter((obj) => !obj.claimed && !obj.delegated).length > 0 ? (
                                <>
                                  <s.SpacerLarge />
                                  <s.TextDescription style={{ color: "#DFAA13", fontSize: "40px", textAlign: "center", }}>
                                    YOU HAVE APES THAT ARE NOT DELEGATED
                                  </s.TextDescription>
                                  <s.SpacerSmall />
                                  <s.TextDescription style={{color: "#DFAA13", fontSize: "20px", textAlign: "center", }}>
                                    TO USE RENTMYDOG FOR SEWER PASS BOOSTS, USE
                                    DELEGATE.CASH TO DELEGATE CLAIMS TO THE
                                    RENTMYDOG CONTRACT ADDRESS OR CLICK THE DELEGATE ALL BUTTON BELOW
                                  </s.TextDescription>
                                  <s.TextDescription style={{ color: "#DFAA13", fontSize: "20px", textAlign: "center", }} >
                                    RENTMYDOG ADDRESS: {CONFIG.RENTADOG_CONTRACT_ADDRESS}
                                  </s.TextDescription>
                                  <s.SpacerSmall />
                                  <StyledButton disabled={txPending} onClick={(e) => { e.preventDefault(); delegateToRAD(); }} >
                                    {txPending ? "BUSY" : "DELEGATE ALL"}
                                  </StyledButton>
                                  <s.SpacerMedium />
                                </>) : null}
                              </> ) }

                            </s.Container>
                          </>
                        )}
                      </>
                    ),
                    "PLAY": (
                      <>
                        {pass.loading ? (
                          <>
                            <s.Container ai={"center"} jc={"center"} fd={"column"} fw={"wrap"}>
                              <s.Container ai={"center"} jc={"center"} fd={"row"} fw={"wrap"}>
                                <s.TextDescription style={{ color: "#FFFFFF", fontSize: "30px" }}>
                                  LOADING...
                                </s.TextDescription>
                              </s.Container>
                            </s.Container>
                          </>
                        ) : (
                          <>
                          
                            <s.Container ai={"center"} jc={"center"} fd={"column"} fw={"wrap"}>
                              {pass.availableToRent.length > 0 ? (
                                <>
                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "40px", textAlign: "center", }}>
                                    PASSES TO RENT
                                  </s.TextDescription>
                                  <s.SpacerMedium />
                                  <s.Container
                                    ai={"flex-start"} jc={"center"} fd="row" fw={"wrap"}
                                    style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                    {pass.availableToRent && pass.availableToRent.length > 0 ? (
                                      <>
                                        {pass.availableToRent.map((obj) => (
                                            <s.Container ai={"center"} jc={"center"}
                                              style={{ padding: "10px", margin: "5px", backgroundColor: rentPassIds[obj.passId] && (currentPassMode == PassMode.Rent) ? "#33AA55FF" : "#FFFFFF00", borderRadius: "10px", }}
                                              onClick={(e) => { toggleRentPassId(obj.passId,PassMode.Rent,true); }}>
                                              <StyledPassButton>
                                                PASS #{obj.passId}<br />TIER {((obj.boredPass ? 3 : 1) + (obj.dogPass ? 1 : 0))}
                                              </StyledPassButton>
                                              <s.SpacerSmall />
                                              { obj.rentalAllowed ? 
                                                <>
                                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                                    RENT: {Math.floor(parseInt(obj.hourlyRentalPrice) / 10**6) / 10**3}E / HR
                                                  </s.TextDescription>
                                                </> : null
                                              }
                                              { obj.purchaseAllowed ? 
                                                <>
                                                  <s.SpacerSmall />
                                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                                    BUY: {Math.floor(parseInt(obj.purchasePrice) / 10**6) / 10**3}E
                                                  </s.TextDescription>
                                                </> : null
                                              }
                                            </s.Container>
                                          ))}
                                      </>
                                    ) : (
                                      <></>
                                    )}
                                  </s.Container>
                                  <s.SpacerMedium />
                                </>
                              ) : 
                                    <>
                                      <s.TextDescription
                                        style={{
                                          color: "#FFFFFF",
                                          fontSize: "30px",
                                          textAlign: "center",
                                        }}
                                      >
                                        NO PASSES AVAILABLE TO RENT
                                      </s.TextDescription>
                                    </>
                                }
                              
                              {pass.myRentals.length > 0 ? (
                                <>
                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "40px", textAlign: "center", }}>
                                    MY RENTALS
                                  </s.TextDescription>
                                  <s.SpacerMedium />
                                  <s.Container
                                    ai={"flex-start"} jc={"center"} fd="row" fw={"wrap"}
                                    style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                    {pass.myRentals && pass.myRentals.length > 0 ? (
                                      <>
                                        {pass.myRentals.map((obj) => (
                                            <s.Container ai={"center"} jc={"center"}
                                              style={{ padding: "10px", margin: "5px", backgroundColor: rentPassIds[obj.passId] && (currentPassMode == PassMode.Extend) ? "#33AA55FF" : "#FFFFFF00", borderRadius: "10px", }}
                                              onClick={(e) => { toggleRentPassId(obj.passId,PassMode.Extend,true); }}>
                                              <StyledPassButton>
                                                PASS #{obj.passId}<br />TIER {((obj.boredPass ? 3 : 1) + (obj.dogPass ? 1 : 0))}
                                              </StyledPassButton>
                                              <s.SpacerSmall />
                                              <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                                EXPIRES: {(new Date(parseInt(obj.rentalEnd)*1000)).toLocaleString('en-US')}
                                              </s.TextDescription>
                                              <s.SpacerSmall />
                                              { !obj.cannotExtend ? 
                                                <>
                                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                                    EXTEND: {Math.floor(parseInt(obj.hourlyRentalPrice) / 10**6) / 10**3}E / HR
                                                  </s.TextDescription>
                                                </> : null
                                              }
                                              { pass.rentalPurchasePrice[obj.passId].purchaseAllowed ? 
                                                <>
                                                  <s.SpacerSmall />
                                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                                    BUY: {Math.floor(parseInt(pass.rentalPurchasePrice[obj.passId].purchasePrice) / 10**6) / 10**3}E
                                                  </s.TextDescription>
                                                </> : null
                                              }
                                            </s.Container>
                                          ))}
                                      </>
                                    ) : (
                                      <></>
                                    )}
                                  </s.Container>
                                  <s.SpacerMedium />
                                </>
                              ) : null}
                              
                              {pass.myPassesForRent.length > 0 ? (
                                <>
                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "40px", textAlign: "center", }}>
                                    MY PASSES FOR RENT
                                  </s.TextDescription>
                                  <s.SpacerMedium />
                                  <s.Container
                                    ai={"flex-start"} jc={"center"} fd="row" fw={"wrap"}
                                    style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                    {pass.myPassesForRent && pass.myPassesForRent.length > 0 ? (
                                      <>
                                        {pass.myPassesForRent.map((obj) => (
                                            <s.Container ai={"center"} jc={"center"}
                                              style={{ padding: "10px", margin: "5px", backgroundColor: rentPassIds[obj.passId] && (currentPassMode == PassMode.Update) ? "#33AA55FF" : "#FFFFFF00", borderRadius: "10px", }}
                                              onClick={(e) => { toggleRentPassId(obj.passId,PassMode.Update,false); }}>
                                              <StyledPassButton>
                                                PASS #{obj.passId}<br />TIER {((obj.boredPass ? 3 : 1) + (obj.dogPass ? 1 : 0))}
                                              </StyledPassButton>
                                              { obj.rentalAllowed ? 
                                                <>
                                                  <s.SpacerSmall />
                                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                                    RENT PRICE: {Math.floor(parseInt(obj.hourlyRentalPrice) / 10**6) / 10**3}E / HR
                                                  </s.TextDescription>
                                                </> : null
                                              }
                                              { obj.purchaseAllowed ? 
                                                <>
                                                  <s.SpacerSmall />
                                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                                    SELL PRICE: {Math.floor(parseInt(obj.purchasePrice) / 10**6) / 10**3}E
                                                  </s.TextDescription>
                                                </> : null
                                              }
                                              { isRented(obj.passId) ? 
                                                <>
                                                  <s.SpacerSmall />
                                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                                    PASS ON RENT
                                                  </s.TextDescription>
                                                  <s.SpacerSmall />
                                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                                    EXPIRES: {(new Date(myPassRentalEnd(obj.passId)*1000)).toLocaleString('en-US')}
                                                  </s.TextDescription>
                                                </> : null
                                              }
                                            </s.Container>
                                          ))}
                                      </>
                                    ) : (
                                      <></>
                                    )}
                                  </s.Container>
                                  <s.SpacerMedium />
                                </>
                              ) : null}
                              
                              {pass.spTokens.length > 0 && pass.approvedForAll ? (
                                <>
                                  <s.TextDescription style={{ color: "#FFFFFF", fontSize: "40px", textAlign: "center", }}>
                                    MY PASSES TO DEPOSIT
                                  </s.TextDescription>
                                  <s.SpacerMedium />
                                  <s.Container
                                    ai={"flex-start"} jc={"center"} fd="row" fw={"wrap"}
                                    style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                    {pass.spTokens && pass.spTokens.length > 0 ? (
                                      <>
                                        {pass.spTokens.map((obj) => (
                                            <s.Container ai={"center"} jc={"center"}
                                              style={{ padding: "10px", margin: "5px", backgroundColor: rentPassIds[obj] && (currentPassMode == PassMode.Deposit) ? "#33AA55FF" : "#FFFFFF00", borderRadius: "10px", }}
                                              onClick={(e) => { toggleRentPassId(obj,PassMode.Deposit,false); }}>
                                              <StyledPassButton>
                                                PASS #{obj}<br />TIER {pass.spTokenTiers[obj]}
                                              </StyledPassButton>
                                            </s.Container>
                                          ))}
                                      </>
                                    ) : (
                                      <></>
                                    )}
                                  </s.Container>
                                  <s.SpacerMedium />
                                </>
                              ) : null}
                          
                              {blockchain.account === "" || blockchain.playmypassContract === null ? (
                                <>
                                  <s.SpacerMedium />
                                  <s.Container ai={"center"} jc={"center"}>
                                    <s.TextDescription style={{ textAlign: "center", color: "var(--accent-text)", fontSize: "30px", }} >
                                      Connect to the {CONFIG.NETWORK.NAME} network
                                    </s.TextDescription>
                                    <s.SpacerSmall />
                                    <StyledButton onClick={(e) => { e.preventDefault(); dispatch(connect()); getDogs(); }}>
                                      CONNECT
                                    </StyledButton>
                                    {blockchain.errorMsg !== "" ? (
                                      <>
                                        <s.SpacerSmall />
                                        <s.TextDescription style={{ textAlign: "center", color: "var(--accent-text)", }}>
                                          {blockchain.errorMsg}
                                        </s.TextDescription>
                                      </>
                                    ) : null}
                                  </s.Container>
                                </>
                                ) : (
                                  <>

                                    <s.SpacerMedium />


                                    { currentPassMode == PassMode.Deposit || currentPassMode == PassMode.Update ? <>
                                      <s.Container
                                        ai={"center"} jc={"center"} fd="column" fw={"wrap"}
                                        style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                        { currentPassMode == PassMode.Update ? <>
                                          <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                            style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                            <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                              RENT ALLOWED: 
                                            </s.TextDescription>
                                            <s.SpacerSmall />
                                            <input type="checkbox" checked={passRentalAllowed} onChange={() => setPassRentalAllowed(!passRentalAllowed)} style={{height: '20px', width: '20px'}} />
                                          </s.Container>
                                        </> : null}
                                        <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                          style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                          <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                            RENT COST PER HOUR: 
                                          </s.TextDescription>
                                          <s.SpacerSmall />
                                          <input defaultValue={"0"} value={passCostToRent} type="text" 
                                            style={{ width: "150px", height: "30px", fontSize: "25px", textAlign: "center", }} 
                                            onChange={(e) => { updatePassRentCost(e); }} />
                                        </s.Container>
                                        <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                          style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                          <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                            PURCHASE ALLOWED: 
                                          </s.TextDescription>
                                          <s.SpacerSmall />
                                          <input type="checkbox" checked={passPurchaseAllowed} onChange={() => setPassPurchaseAllowed(!passPurchaseAllowed)} style={{height: '20px', width: '20px'}} />
                                        </s.Container>
                                        <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                          style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                          <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                            PURCHASE COST: 
                                          </s.TextDescription>
                                          <s.SpacerSmall />
                                          <input defaultValue={"0"} value={passCostToPurchase} type="text" 
                                            style={{ width: "150px", height: "30px", fontSize: "25px", textAlign: "center", }} 
                                            onChange={(e) => { updatePassPurchaseCost(e); }} />
                                        </s.Container>
                                        <s.Container 
                                          ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                          style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                            { currentPassMode == PassMode.Update ? <>
                                              <StyledButton disabled={txPending} onClick={(e) => { e.preventDefault(); updatePasses(); }}>
                                                {txPending ? "BUSY" : "UPDATE"}
                                              </StyledButton>
                                              <s.SpacerSmall />
                                              <StyledButton disabled={txPending} onClick={(e) => { e.preventDefault(); withdrawPasses(); }}>
                                                {txPending ? "BUSY" : "WITHDRAW"}
                                              </StyledButton>
                                            </> : 
                                            <>
                                              <StyledButton disabled={txPending} onClick={(e) => { e.preventDefault(); depositPasses(); }}>
                                                {txPending ? "BUSY" : "DEPOSIT"}
                                              </StyledButton>
                                            </> }
                                        </s.Container>
                                        <s.Container
                                          ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                          style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                            <s.TextDescription style={{ color: "#FFFFFF", fontSize: "30px", }}>
                                              {feedback}
                                            </s.TextDescription>
                                        </s.Container>
                                      </s.Container>
                                    </> : null}


                                    { (currentPassMode == PassMode.Rent || currentPassMode == PassMode.Extend) && (currentPassRentalAllowed || currentPassPurchaseAllowed) ? <>
                                      <s.Container
                                        ai={"center"} jc={"center"} fd="column" fw={"wrap"}
                                        style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                        { currentPassRentalAllowed ? <>
                                          <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                            style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                            <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                              HOURS TO RENT: 
                                            </s.TextDescription>
                                            <s.SpacerSmall />
                                            <input defaultValue={"0"} value={currentPassRentalHours} type="text" 
                                              style={{ width: "150px", height: "30px", fontSize: "25px", textAlign: "center", }} 
                                              onChange={(e) => { updatePassRentHours(e); }} />
                                          </s.Container>
                                          <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                            style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                            <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                              RENTAL COST / HR: {currentPassRentalCost / 10**6 / 10**3}E
                                            </s.TextDescription>
                                          </s.Container>
                                          <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                            style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                            <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                              RENTAL COST TOTAL: {currentPassRentalCostTotal / 10**6 / 10**3}E
                                            </s.TextDescription>
                                          </s.Container>
                                        </> : null }
                                        { currentPassPurchaseAllowed ? <>
                                          <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                            style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }} >
                                            <s.TextDescription style={{ color: "#FFFFFF", fontSize: "20px", }}>
                                              PURCHASE COST: {currentPassPurchaseCost / 10**6 / 10**3}E
                                            </s.TextDescription>
                                          </s.Container>
                                        </> : null }
                                        <s.Container 
                                          ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                          style={{ display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                            <StyledButton disabled={txPending} onClick={(e) => { e.preventDefault(); rentPass(); }}>
                                              {txPending ? "BUSY" : "RENT"}
                                            </StyledButton>
                                            { currentPassPurchaseAllowed ? <>
                                              <s.SpacerSmall />
                                              <StyledButton disabled={txPending} onClick={(e) => { e.preventDefault(); purchasePass(); }}>
                                                {txPending ? "BUSY" : "PURCHASE"}
                                              </StyledButton>
                                            </> : null }
                                        </s.Container>
                                        <s.Container
                                          ai={"center"} jc={"center"} fd="row" fw={"wrap"}
                                          style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content", }}>
                                            <s.TextDescription style={{ color: "#FFFFFF", fontSize: "30px", }}>
                                              {feedback}
                                            </s.TextDescription>
                                        </s.Container>
                                      </s.Container>
                                    </> : null}
                              </> ) }

                              {pass.spTokens.length > 0 && !pass.approvedForAll ? (
                                <>
                                  <s.SpacerLarge />
                                  <s.TextDescription style={{ color: "#DFAA13", fontSize: "40px", textAlign: "center", }}>
                                    YOU HAVE PASSES THAT COULD BE RENTED
                                  </s.TextDescription>
                                  <s.SpacerSmall />
                                  <s.TextDescription style={{color: "#DFAA13", fontSize: "20px", textAlign: "center", }}>
                                    TO USE THE PASS RENTAL SYSTEM EITHER SET APPROVAL FOR ALL USING THE BUTTON BELOW OR 
                                    DEPOSIT YOUR PASSES BY SENDING THEM TO THE RENT MY PASS CONTRACT WITH 'safeTransferFrom' ON
                                    THE SEWER PASS CONTRACT
                                  </s.TextDescription>
                                  <s.TextDescription style={{ color: "#DFAA13", fontSize: "20px", textAlign: "center", }} >
                                    SEWER PASS ADDRESS: {CONFIG.SEWER_PASS_CONTRACT_ADDRESS}
                                  </s.TextDescription>
                                  <s.TextDescription style={{ color: "#DFAA13", fontSize: "20px", textAlign: "center", }} >
                                    RENTMYPASS ADDRESS: {CONFIG.PLAY_MY_PASS_CONTRACT_ADDRESS}
                                  </s.TextDescription>
                                  <s.SpacerSmall />
                                  <StyledButton disabled={txPending} onClick={(e) => { e.preventDefault(); approveRMP(); }} >
                                    {txPending ? "BUSY" : "APPROVE FOR ALL"}
                                  </StyledButton>
                                  <s.SpacerMedium />
                                </>) : null}
                            </s.Container>
                          </>
                        )}
                      </>
                    ),
                  }[currentPage]
                }
            <s.SpacerMedium />
          </s.Container>
          <s.SpacerLarge />
        </ResponsiveWrapper>
        <s.SpacerMedium />
      </s.Container>
      {blockchain.account && (
        <div id="w-s2-footer-container">
          <p id="w-s2-footer-smoltext">
            Use this referral code to share with your friends for fun and
            profit!
          </p>
          <p id="w-s2-footer-text">Your Referral Code:</p>
          <p id="w-s2-footer-text">
            <a href={`https://rad.layerr.xyz?ref=${blockchain.account}`}>
              {`https://rad.layerr.xyz?ref=${blockchain.account}`}
            </a>
          </p>
        </div>
      )}

      <LogoContainer>
        <div id="w-s2-footer-text">Layerr Inc. © 2023 All Rights Reserved</div>
      </LogoContainer>
    </s.Screen>
  );
}

export default App;