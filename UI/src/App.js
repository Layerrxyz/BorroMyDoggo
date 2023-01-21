import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchDog } from "./redux/dog/dogActions";
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
  @media (min-width: 1500px) {
    width: 600px;
  }
`;

export const NavContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: center;
  align-items: flex-end;
  flex-wrap: wrap;
  width: 100%;
  @media (min-width: 1500px) {
    width: 900px;
    justify-content: flex-end;
  }
`;

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const dog = useSelector((state) => state.dog);
  const [sellBoostMode, setSellBoostMode] = useState(true);
  const [txPending, setTXPending] = useState(false);
  const [feedback, setFeedback] = useState(``);
  const [costToRent, setCostToRent] = useState(0);
  const [totalCostToRent, setTotalCostToRent] = useState("0");
  const [baycIds, setBaycIds] = useState(new Array(10000).fill(false));
  const [maycIds, setMaycIds] = useState(new Array(40000).fill(false));
  const [dogIds, setDogIds] = useState(new Array(10000).fill(false));
  const [CONFIG, SET_CONFIG] = useState({
    RENTADOG_CONTRACT_ADDRESS: "0x56B61e063f0f662588655F27B1175F4aAEBD7251",
    HELPER_CONTRACT_ADDRESS: "0xC705aB148653B10f77A82af5002276127c84286A",
    NETWORK: {
      NAME: "Ethereum",
      SYMBOL: "ETH",
      ID: 1,
    },
    SHOW_BACKGROUND: true,
  });

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
        .loanDogs(dogsToLoan, rentCostWEI)
        .send({
          to: CONFIG.RENTMYDOG_CONTRACT_ADDRESS,
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
        .unloanDogs(dogsToUnloan)
        .send({
          to: CONFIG.RENTMYDOG_CONTRACT_ADDRESS,
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

  const rentDogs = () => {
    setFeedback("RENT-ING");
    setTXPending(true);
    let totalCostWEI = 0;
    let rentDogIds = [];
    let myBaycIds = [];
    let myMaycIds = [];
    for (let i = 0; i < dog.availableDogs.length; i++) {
      if (dogIds[dog.availableDogs[i].dogId]) {
        rentDogIds.push(dog.availableDogs[i].dogId);
        totalCostWEI += getCurrentCost(dog.availableDogs[i].dogId);
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
        .rentDogs(myBaycIds, myMaycIds, rentDogIds)
        .send({
          to: CONFIG.RENTMYDOG_CONTRACT_ADDRESS,
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

  const toggleDogId = (position) => {
    const updateTokens = dogIds.map((item, index) =>
      index === position ? !item : item
    );
    if (!sellBoostMode) {
      let totalCostWEI = 0;
      for (let i = 0; i < dog.availableDogs.length; i++) {
        if (updateTokens[dog.availableDogs[i].dogId]) {
          totalCostWEI += dog.availableDogs[i].rentCost;
        }
      }
      setTotalCostToRent(totalCostWEI);
    }
    setDogIds(updateTokens);
  };

  const toggleBaycId = (position) => {
    const updateTokens = baycIds.map((item, index) =>
      index === position ? !item : item
    );
    setBaycIds(updateTokens);
  };

  const toggleMaycId = (position) => {
    const updateTokens = maycIds.map((item, index) =>
      index === position ? !item : item
    );
    setMaycIds(updateTokens);
  };

  const resetSelections = () => {
    setDogIds(new Array(10000).fill(false));
    setBaycIds(new Array(10000).fill(false));
    setMaycIds(new Array(40000).fill(false));
    setTotalCostToRent(0);
    setCostToRent(0);
    setFeedback("");
  };

  const getCurrentCost = (dogId) => {
    for (let i = 0; i < dog.availableDogs.length; i++) {
      if (dog.availableDogs[i].dogId == dogId) {
        return dog.availableDogs[i].rentCost;
      }
    }
    return 0;
  };

  const getDogs = () => {
    if (blockchain.account !== "" && blockchain.helperContract !== null) {
      resetSelections();
      dispatch(fetchDog(blockchain.account));
    }
  };

  const updateRentCost = (e) => {
    const cost = e.target.value;
    if (!cost || cost.match(/^\d{1,}(\.\d{0,4})?$/)) {
      setCostToRent(cost);
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

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getDogs();
  }, [blockchain.account]);

  useEffect(() => {}, [sellBoostMode]);

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

          <LogoContainer>
            <s.TextTitle>
              Contracts audited by
              <a href="https://twitter.com/0xQuit">@0xQuit</a> of
              <a href="https://boringsecurity.com">@SECDAO</a>
            </s.TextTitle>
          </LogoContainer>

          <NavContainer>
            <NavButton
              onClick={() => {
                resetSelections();
                setSellBoostMode(false);
              }}
              style={{
                backgroundColor: !sellBoostMode
                  ? "var(--nav-button-selected)"
                  : "var(--nav-button)",
              }}
            >
              RENT DOGS
            </NavButton>
            <NavButton
              onClick={() => {
                resetSelections();
                setSellBoostMode(true);
              }}
              style={{
                backgroundColor: !sellBoostMode
                  ? "var(--nav-button)"
                  : "var(--nav-button-selected)",
              }}
            >
              SELL BOOSTS
            </NavButton>
            <NavButton
              onClick={() => {
                getDogs();
              }}
              style={{ backgroundColor: "var(--nav-button)" }}
            >
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
            {blockchain.account === "" ||
            blockchain.rentmydogContract === null ? (
              <s.Container ai={"center"} jc={"center"}>
                <s.TextDescription
                  style={{
                    textAlign: "center",
                    color: "var(--accent-text)",
                    fontSize: "30px",
                  }}
                >
                  Connect to the {CONFIG.NETWORK.NAME} network
                </s.TextDescription>
                <s.SpacerSmall />
                <StyledButton
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch(connect());
                    getDogs();
                  }}
                >
                  CONNECT
                </StyledButton>
                {blockchain.errorMsg !== "" ? (
                  <>
                    <s.SpacerSmall />
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--accent-text)",
                      }}
                    >
                      {blockchain.errorMsg}
                    </s.TextDescription>
                  </>
                ) : null}
              </s.Container>
            ) : (
              <>
                {
                  {
                    true: (
                      <>
                        {dog.loading ? (
                          <>
                            <s.Container
                              ai={"center"}
                              jc={"center"}
                              fd={"column"}
                              fw={"wrap"}
                            >
                              <s.Container
                                ai={"center"}
                                jc={"center"}
                                fd={"row"}
                                fw={"wrap"}
                              >
                                <s.TextDescription
                                  style={{ color: "#FFFFFF", fontSize: "30px" }}
                                >
                                  LOADING...
                                </s.TextDescription>
                              </s.Container>
                            </s.Container>
                          </>
                        ) : (
                          <>
                            <s.Container
                              ai={"center"}
                              jc={"center"}
                              fd={"column"}
                              fw={"wrap"}
                            >
                              {dog.bakcTokens.filter(
                                (obj) => !obj.claimed && obj.delegated
                              ).length > 0 ? (
                                <>
                                  <s.TextDescription
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: "40px",
                                      textAlign: "center",
                                    }}
                                  >
                                    DOGS WITH BOOST TO SELL
                                  </s.TextDescription>
                                  <s.SpacerMedium />
                                  <s.Container
                                    ai={"center"}
                                    jc={"center"}
                                    fd="row"
                                    fw={"wrap"}
                                    style={{
                                      display: "flex",
                                      backgroundColor: "#111111",
                                      padding: "10px",
                                      width: "fit-content",
                                    }}
                                  >
                                    {dog.bakcTokens &&
                                    dog.bakcTokens.length > 0 ? (
                                      <>
                                        {dog.bakcTokens
                                          .filter(
                                            (obj) =>
                                              !obj.claimed && obj.delegated
                                          )
                                          .map((obj) => (
                                            <s.Container
                                              ai={"center"}
                                              jc={"center"}
                                              style={{
                                                padding: "10px",
                                                margin: "5px",
                                                backgroundColor: dogIds[
                                                  obj.tokenId
                                                ]
                                                  ? "#33AA55FF"
                                                  : "#FFFFFF00",
                                                borderRadius: "10px",
                                              }}
                                              onClick={(e) => {
                                                toggleDogId(obj.tokenId);
                                              }}
                                            >
                                              {getCurrentCost(obj.tokenId) >
                                              0 ? (
                                                <>
                                                  <s.TextDescription
                                                    style={{
                                                      color: "#FFFFFF",
                                                      fontSize: "20px",
                                                    }}
                                                  >
                                                    COST:{" "}
                                                    {Math.floor(
                                                      getCurrentCost(
                                                        obj.tokenId
                                                      ) /
                                                        10 ** 16
                                                    ) /
                                                      10 ** 2}
                                                    E
                                                  </s.TextDescription>
                                                </>
                                              ) : (
                                                <>
                                                  <s.TextDescription
                                                    style={{
                                                      color: "#FFFFFF",
                                                      fontSize: "20px",
                                                    }}
                                                  >
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
                                    ai={"center"}
                                    jc={"center"}
                                    fd="column"
                                    fw={"wrap"}
                                    style={{
                                      display: "flex",
                                      backgroundColor: "#111111",
                                      padding: "10px",
                                      width: "fit-content",
                                    }}
                                  >
                                    <s.Container
                                      ai={"center"}
                                      jc={"center"}
                                      fd="row"
                                      fw={"wrap"}
                                      style={{
                                        display: "flex",
                                        backgroundColor: "#111111",
                                        padding: "10px",
                                        width: "fit-content",
                                      }}
                                    >
                                      <s.TextDescription
                                        style={{
                                          color: "#FFFFFF",
                                          fontSize: "20px",
                                        }}
                                      >
                                        RENT COST:{" "}
                                      </s.TextDescription>
                                      <s.SpacerSmall />
                                      <input
                                        defaultValue={"0"}
                                        value={costToRent}
                                        type="text"
                                        style={{
                                          width: "150px",
                                          height: "30px",
                                          fontSize: "25px",
                                          textAlign: "center",
                                        }}
                                        onChange={(e) => {
                                          updateRentCost(e);
                                        }}
                                      />
                                    </s.Container>
                                    <s.Container
                                      ai={"center"}
                                      jc={"center"}
                                      fd="row"
                                      fw={"wrap"}
                                      style={{
                                        display: "flex",
                                        backgroundColor: "#111111",
                                        padding: "10px",
                                        width: "fit-content",
                                      }}
                                    >
                                      <StyledButton
                                        disabled={txPending}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          loanDogs();
                                        }}
                                      >
                                        {txPending ? "BUSY" : "LIST BOOSTS"}
                                      </StyledButton>
                                      <s.SpacerSmall />
                                      <StyledButton
                                        disabled={txPending}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          unloanDogs();
                                        }}
                                      >
                                        {txPending ? "BUSY" : "DELIST BOOSTS"}
                                      </StyledButton>
                                    </s.Container>
                                    <s.Container
                                      ai={"center"}
                                      jc={"center"}
                                      fd="row"
                                      fw={"wrap"}
                                      style={{
                                        display: "flex",
                                        backgroundColor: "#111111",
                                        padding: "10px",
                                        width: "fit-content",
                                      }}
                                    >
                                      <s.TextDescription
                                        style={{
                                          color: "#FFFFFF",
                                          fontSize: "30px",
                                        }}
                                      >
                                        {feedback}
                                      </s.TextDescription>
                                    </s.Container>
                                  </s.Container>
                                </>
                              ) : (
                                <>
                                  <s.TextDescription
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: "40px",
                                    }}
                                  >
                                    NO DOG BOOSTS TO SELL
                                  </s.TextDescription>
                                </>
                              )}

                              {dog.bakcTokens.filter(
                                (obj) => !obj.claimed && !obj.delegated
                              ).length > 0 ? (
                                <>
                                  <s.SpacerLarge />
                                  <s.TextDescription
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: "40px",
                                      textAlign: "center",
                                    }}
                                  >
                                    YOUR DOGS NEED TO BE DELEGATED
                                  </s.TextDescription>
                                  <s.SpacerSmall />
                                  <s.TextDescription
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: "20px",
                                      textAlign: "center",
                                    }}
                                  >
                                    TO SELL DOGS BOOSTS, USE DELEGATE.CASH TO
                                    DELEGATE FROM YOUR DOG WALLET TO THE
                                    RENTMYDOG CONTRACT
                                  </s.TextDescription>
                                  <s.TextDescription
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: "20px",
                                      textAlign: "center",
                                    }}
                                  >
                                    RENTMYDOG ADDRESS:{" "}
                                    {CONFIG.RENTMYDOG_CONTRACT_ADDRESS}
                                  </s.TextDescription>
                                </>
                              ) : null}
                            </s.Container>
                          </>
                        )}
                      </>
                    ),
                    false: (
                      <>
                        {dog.loading ? (
                          <>
                            <s.Container
                              ai={"center"}
                              jc={"center"}
                              fd={"column"}
                              fw={"wrap"}
                            >
                              <s.Container
                                ai={"center"}
                                jc={"center"}
                                fd={"row"}
                                fw={"wrap"}
                              >
                                <s.TextDescription
                                  style={{ color: "#FFFFFF", fontSize: "30px" }}
                                >
                                  LOADING...
                                </s.TextDescription>
                              </s.Container>
                            </s.Container>
                          </>
                        ) : (
                          <>
                            <s.Container
                              ai={"center"}
                              jc={"center"}
                              fd={"column"}
                              fw={"wrap"}
                            >
                              {dog.baycTokens.filter(
                                (obj) => !obj.claimed && obj.delegated
                              ).length > 0 ? (
                                <>
                                  <s.TextDescription
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: "40px",
                                      textAlign: "center",
                                    }}
                                  >
                                    BAYC TO CLAIM WITH BOOST
                                  </s.TextDescription>
                                  <s.SpacerMedium />
                                  <s.Container
                                    ai={"center"}
                                    jc={"center"}
                                    fd="row"
                                    fw={"wrap"}
                                    style={{
                                      display: "flex",
                                      backgroundColor: "#111111",
                                      padding: "10px",
                                      width: "fit-content",
                                    }}
                                  >
                                    {dog.baycTokens &&
                                    dog.baycTokens.length > 0 ? (
                                      <>
                                        {dog.baycTokens
                                          .filter(
                                            (obj) =>
                                              !obj.claimed && obj.delegated
                                          )
                                          .map((obj) => (
                                            <s.Container
                                              ai={"center"}
                                              jc={"center"}
                                              style={{
                                                padding: "10px",
                                                margin: "5px",
                                                backgroundColor: baycIds[
                                                  obj.tokenId
                                                ]
                                                  ? "#33AA55FF"
                                                  : "#FFFFFF00",
                                                borderRadius: "10px",
                                              }}
                                              onClick={(e) => {
                                                toggleBaycId(obj.tokenId);
                                              }}
                                            >
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

                              {dog.maycTokens.filter(
                                (obj) => !obj.claimed && obj.delegated
                              ).length > 0 ? (
                                <>
                                  <s.TextDescription
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: "40px",
                                      textAlign: "center",
                                    }}
                                  >
                                    MAYC TO CLAIM WITH BOOST
                                  </s.TextDescription>
                                  <s.SpacerMedium />
                                  <s.Container
                                    ai={"center"}
                                    jc={"center"}
                                    fd="row"
                                    fw={"wrap"}
                                    style={{
                                      display: "flex",
                                      backgroundColor: "#111111",
                                      padding: "10px",
                                      width: "fit-content",
                                    }}
                                  >
                                    {dog.maycTokens &&
                                    dog.maycTokens.length > 0 ? (
                                      <>
                                        {dog.maycTokens
                                          .filter(
                                            (obj) =>
                                              !obj.claimed && obj.delegated
                                          )
                                          .map((obj) => (
                                            <s.Container
                                              ai={"center"}
                                              jc={"center"}
                                              style={{
                                                padding: "10px",
                                                margin: "5px",
                                                backgroundColor: maycIds[
                                                  obj.tokenId
                                                ]
                                                  ? "#33AA55FF"
                                                  : "#FFFFFF00",
                                                borderRadius: "10px",
                                              }}
                                              onClick={(e) => {
                                                toggleMaycId(obj.tokenId);
                                              }}
                                            >
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

                              <s.TextDescription
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: "40px",
                                  textAlign: "center",
                                }}
                              >
                                DOG BOOSTS FOR SALE
                              </s.TextDescription>
                              <s.SpacerMedium />
                              <s.Container
                                ai={"center"}
                                jc={"center"}
                                fd="row"
                                fw={"wrap"}
                                style={{
                                  display: "flex",
                                  backgroundColor: "#111111",
                                  padding: "10px",
                                  width: "fit-content",
                                }}
                              >
                                {dog.availableDogs &&
                                dog.availableDogs.length > 0 ? (
                                  <>
                                    {dog.availableDogs
                                      .sort((a, b) => {
                                        if (
                                          parseInt(a.rentCost) >
                                          parseInt(b.rentCost)
                                        ) {
                                          return 1;
                                        }
                                        if (
                                          parseInt(a.rentCost) <
                                          parseInt(b.rentCost)
                                        ) {
                                          return -1;
                                        }
                                        return 0;
                                      })
                                      .map((obj) => (
                                        <s.Container
                                          ai={"center"}
                                          jc={"center"}
                                          style={{
                                            padding: "10px",
                                            margin: "5px",
                                            backgroundColor: dogIds[obj.dogId]
                                              ? "#33AA55FF"
                                              : "#FFFFFF00",
                                            borderRadius: "10px",
                                          }}
                                          onClick={(e) => {
                                            toggleDogId(obj.dogId);
                                          }}
                                        >
                                          <s.TextDescription
                                            style={{
                                              color: "#FFFFFF",
                                              fontSize: "20px",
                                            }}
                                          >
                                            COST:{" "}
                                            {Math.floor(
                                              getCurrentCost(obj.dogId) /
                                                10 ** 16
                                            ) /
                                              10 ** 2}
                                            E
                                          </s.TextDescription>
                                          <s.SpacerSmall />
                                          <StyledButton>
                                            DOG #{obj.dogId}
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
                              <s.SpacerMedium />
                              <s.Container
                                ai={"center"}
                                jc={"center"}
                                fd="column"
                                fw={"wrap"}
                                style={{
                                  display: "flex",
                                  backgroundColor: "#111111",
                                  padding: "10px",
                                  width: "fit-content",
                                }}
                              >
                                <s.Container
                                  ai={"center"}
                                  jc={"center"}
                                  fd="row"
                                  fw={"wrap"}
                                  style={{
                                    display: "flex",
                                    backgroundColor: "#111111",
                                    padding: "10px",
                                    width: "fit-content",
                                  }}
                                >
                                  <s.TextDescription
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: "20px",
                                    }}
                                  >
                                    RENT COST:{" "}
                                    {Math.floor(totalCostToRent / 10 ** 16) /
                                      10 ** 2}
                                  </s.TextDescription>
                                </s.Container>
                                <s.Container
                                  ai={"center"}
                                  jc={"center"}
                                  fd="row"
                                  fw={"wrap"}
                                  style={{
                                    display: "flex",
                                    backgroundColor: "#111111",
                                    padding: "10px",
                                    width: "fit-content",
                                  }}
                                >
                                  <StyledButton
                                    disabled={txPending}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      rentDogs();
                                    }}
                                  >
                                    {txPending ? "BUSY" : "RENTW & MINT"}
                                  </StyledButton>
                                </s.Container>
                                <s.Container
                                  ai={"center"}
                                  jc={"center"}
                                  fd="row"
                                  fw={"wrap"}
                                  style={{
                                    display: "flex",
                                    backgroundColor: "#111111",
                                    padding: "10px",
                                    width: "fit-content",
                                  }}
                                >
                                  <s.TextDescription
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: "30px",
                                    }}
                                  >
                                    {feedback}
                                  </s.TextDescription>
                                </s.Container>
                              </s.Container>

                              {dog.baycTokens.filter(
                                (obj) => !obj.claimed && !obj.delegated
                              ).length > 0 ||
                              dog.maycTokens.filter(
                                (obj) => !obj.claimed && !obj.delegated
                              ).length > 0 ? (
                                <>
                                  <s.TextDescription
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: "40px",
                                      textAlign: "center",
                                    }}
                                  >
                                    YOU HAVE APES THAT ARE NOT DELEGATED
                                  </s.TextDescription>
                                  <s.SpacerMedium />
                                  <s.TextDescription
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: "20px",
                                      textAlign: "center",
                                    }}
                                  >
                                    TO USE RENTMYDOG FOR SEWER PASS BOOSTS, USE
                                    DELEGATE.CASH TO DELEGATE CLAIMS TO THE
                                    RENTMYDOG CONTRACT ADDRESS{" "}
                                    {CONFIG.RENTMYDOG_CONTRACT_ADDRESS}
                                  </s.TextDescription>
                                  <s.SpacerMedium />
                                </>
                              ) : null}
                            </s.Container>
                          </>
                        )}
                      </>
                    ),
                  }[sellBoostMode]
                }
              </>
            )}
            <s.SpacerMedium />
          </s.Container>
          <s.Container>
            <div id="w-s2-footer-text">
              Layerr Inc. © 2023 All Rights Reserved
            </div>
          </s.Container>
          <s.SpacerLarge />
        </ResponsiveWrapper>
        <s.SpacerMedium />
      </s.Container>
    </s.Screen>
  );
}

export default App;
