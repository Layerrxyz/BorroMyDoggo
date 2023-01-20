import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchDoggo } from "./redux/doggo/doggoActions";
import * as s from "./styles/globalStyles";
import styled from "styled-components";
import Web3 from "web3";

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
  const doggo = useSelector((state) => state.doggo);
  const [sellBoostMode, setSellBoostMode] = useState(true);
  const [txPending, setTXPending] = useState(false);
  const [feedback, setFeedback] = useState(``);
  const [costToBorro, setCostToBorro] = useState(0);
  const [totalCostToBorro, setTotalCostToBorro] = useState('0');
  const [baycIds, setBaycIds] = useState(new Array(10000).fill(false));
  const [maycIds, setMaycIds] = useState(new Array(40000).fill(false));
  const [doggoIds, setDoggoIds] = useState(new Array(10000).fill(false));
  const [CONFIG, SET_CONFIG] = useState({
    BORROMYDOGGO_CONTRACT_ADDRESS: "0x56B61e063f0f662588655F27B1175F4aAEBD7251",
    HELPER_CONTRACT_ADDRESS: "0xC705aB148653B10f77A82af5002276127c84286A",
    NETWORK: {
      NAME: "Ethereum",
      SYMBOL: "ETH",
      ID: 1
    },
    SHOW_BACKGROUND: true
  });

  
  const loanDoggos = () => {
    let borroCostWEI = 0;
    try {
      borroCostWEI = Web3.utils.toWei(costToBorro);
    } catch(err) {}
    setFeedback('ALLOWING BORRO-ING @ ' + (Math.floor(borroCostWEI/10**14)/10**4) + 'E');
    setTXPending(true);
    let doggosToLoan = [];
    for(let i = 0;i < doggo.bakcTokens.length;i++) {
      if(doggoIds[doggo.bakcTokens[i].tokenId]) {
        doggosToLoan.push(doggo.bakcTokens[i].tokenId);
      }
    }
    if(doggosToLoan.length == 0) {
      setFeedback('NOTHING SELECTED');  setTXPending(false); return;
    }
    if(borroCostWEI == 0) {
      setFeedback('COST TO BORRO MUST BE > 0');  setTXPending(false); return;
    }
    try { 
      blockchain.borromydoggoContract.methods
        .loanDoggos(doggosToLoan, borroCostWEI)
        .send({
          to: CONFIG.BORROMYDOGGO_CONTRACT_ADDRESS,
          from: blockchain.account,
        })
        .once("error", (err) => {
          console.log(err);
            setFeedback("SORRY, SOMETHING WENT WRONG");
            setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
            setFeedback(
              `DOGGOS LOAN-ABILITY ALLOWED`
            );
            setTXPending(false);
            dispatch(fetchDoggo(blockchain.account));
            resetSelections();
        });
      } catch (err) {
        console.log(err);
            setFeedback("SORRY, SOMETHING WENT WRONG");
            setTXPending(false);
      }
  };
  
  const unloanDoggos = () => {
    setFeedback('UNLOAN-ING');
    setTXPending(true);
    let doggosToUnloan = [];
    for(let i = 0;i < doggo.bakcTokens.length;i++) {
      if(doggoIds[doggo.bakcTokens[i].tokenId]) {
        doggosToUnloan.push(doggo.bakcTokens[i].tokenId);
      }
    }
    if(doggosToUnloan.length == 0) {
      setFeedback('NOTHING SELECTED');  setTXPending(false); return;
    }
    try { 
      blockchain.borromydoggoContract.methods
        .unloanDoggos(doggosToUnloan)
        .send({
          to: CONFIG.BORROMYDOGGO_CONTRACT_ADDRESS,
          from: blockchain.account,
        })
        .once("error", (err) => {
          console.log(err);
            setFeedback("SORRY, SOMETHING WENT WRONG");
            setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
            setFeedback(
              `DOGGOS LOAN-ABILITY REVOKED`
            );
            setTXPending(false);
            dispatch(fetchDoggo(blockchain.account));
            resetSelections();
        });
      } catch (err) {
        console.log(err);
            setFeedback("SORRY, SOMETHING WENT WRONG");
            setTXPending(false);
      }
  };

  
  const borroDoggos = () => {
    setFeedback('BORRO-ING');
    setTXPending(true);
    let totalCostWEI = 0;
    let borroDoggoIds = [];
    let myBaycIds = [];
    let myMaycIds = [];
    for(let i = 0;i < doggo.availableDoggos.length;i++) {
      if(doggoIds[doggo.availableDoggos[i].doggoId]) {
        borroDoggoIds.push(doggo.availableDoggos[i].doggoId);
        totalCostWEI += getCurrentCost(doggo.availableDoggos[i].doggoId);
      }
    }
    for(let i = 0;i < doggo.baycTokens.length;i++) {
      if(baycIds[doggo.baycTokens[i].tokenId]) {
        myBaycIds.push(doggo.baycTokens[i].tokenId);
      }
    }
    for(let i = 0;i < doggo.maycTokens.length;i++) {
      if(maycIds[doggo.maycTokens[i].tokenId]) {
        myMaycIds.push(doggo.maycTokens[i].tokenId);
      }
    }
    if((myBaycIds.length + myMaycIds.length) != borroDoggoIds.length) {
      setFeedback('MUST SELECT EQUAL NUMBER OF APES AND DOGGOS'); setTXPending(false); return;
    }
    if((myBaycIds.length + myMaycIds.length) == 0) {
      setFeedback('NOTHING SELECTED');  setTXPending(false); return;
    }
    try { 
      blockchain.borromydoggoContract.methods
        .borroDoggos(myBaycIds, myMaycIds, borroDoggoIds)
        .send({
          to: CONFIG.BORROMYDOGGO_CONTRACT_ADDRESS,
          from: blockchain.account,
          value: totalCostWEI
        })
        .once("error", (err) => {
          console.log(err);
            setFeedback("SORRY, SOMETHING WENT WRONG");
            setTXPending(false);
        })
        .then((receipt) => {
          console.log(receipt);
            setFeedback(
              `SEWER PASSES MINTED!`
            );
            setTXPending(false);
            dispatch(fetchDoggo(blockchain.account));
            resetSelections();
        });
      } catch (err) {
        console.log(err);
        setFeedback("SORRY, SOMETHING WENT WRONG");
        setTXPending(false);
      }
  };

  const toggleDoggoId = (position)=> {
    const updateTokens = doggoIds.map((item, index) => index === position ? !item : item);
    if(!sellBoostMode) {
      let totalCostWEI = 0;
      for(let i = 0;i < doggo.availableDoggos.length;i++) {
        if(updateTokens[doggo.availableDoggos[i].doggoId]) {
          totalCostWEI += doggo.availableDoggos[i].borroCost;
        }
      }
      setTotalCostToBorro(totalCostWEI);
    }
    setDoggoIds(updateTokens);
  };

  const toggleBaycId = (position)=> {
    const updateTokens = baycIds.map((item, index) => index === position ? !item : item);
    setBaycIds(updateTokens);
  };

  const toggleMaycId = (position)=> {
    const updateTokens = maycIds.map((item, index) => index === position ? !item : item);
    setMaycIds(updateTokens);
  };

  const resetSelections = () => {
      setDoggoIds(new Array(10000).fill(false));
      setBaycIds(new Array(10000).fill(false));
      setMaycIds(new Array(40000).fill(false));
      setTotalCostToBorro(0);
      setCostToBorro(0);
      setFeedback('');
  };

  const getCurrentCost = (doggoId) => {
    for(let i = 0;i < doggo.availableDoggos.length;i++) {
      if(doggo.availableDoggos[i].doggoId == doggoId) {
        return doggo.availableDoggos[i].borroCost;
      }
    }
    return 0;
  };


  const getDoggos = () => {
    if (blockchain.account !== "" && blockchain.helperContract !== null) {
      resetSelections();
      dispatch(fetchDoggo(blockchain.account));
    }
  };

  const updateBorroCost = (e) => {
    const cost = e.target.value;
    if(!cost || cost.match(/^\d{1,}(\.\d{0,4})?$/)) {
      setCostToBorro(cost);
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
    getDoggos();
  }, [blockchain.account]);

  useEffect(() => {
    
  }, [sellBoostMode]);

  return (
    <s.Screen>
      <s.Container
        flex={1}
        ai={"center"}
        style={{ padding: 24, backgroundColor: "var(--primary)" }}
        image={CONFIG.SHOW_BACKGROUND ? "/config/images/bg.png" : null}
      >
          <HeaderContainer style={{paddingLeft: 48, paddingRight: 48}}>
          <LogoContainer>
                <StyledLogo alt={"logo"} src={"/config/images/logo.png"} />
          </LogoContainer>
          <NavContainer>
            <NavButton onClick={() => {resetSelections(); setSellBoostMode(false);}} style={{backgroundColor: (!sellBoostMode ? 'var(--nav-button-selected)' : 'var(--nav-button)')}}>BORRO DOGGOS</NavButton>
            <NavButton onClick={() => {resetSelections(); setSellBoostMode(true);}} style={{backgroundColor: (!sellBoostMode ? 'var(--nav-button)' : 'var(--nav-button-selected)')}}>SELL BOOSTS</NavButton>
            <NavButton onClick={() => {getDoggos();}} style={{backgroundColor: 'var(--nav-button)'}}>REFRESH</NavButton>
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
              border: ((false ? '0px' :"4px var(--secondary)")),
              boxShadow: ((false ? '0px' : "0px 5px 11px 2px rgba(0,0,0,0.7)")),
            }}
          >
                {(blockchain.account === "" ||
                blockchain.borromydoggoContract === null) ? (
                  <s.Container ai={"center"} jc={"center"}>
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--accent-text)",
                        fontSize: "30px"
                      }}
                    >
                      Connect to the {CONFIG.NETWORK.NAME} network
                    </s.TextDescription>
                    <s.SpacerSmall />
                    <StyledButton
                      onClick={(e) => {
                        e.preventDefault();
                        dispatch(connect());
                        getDoggos();
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
                      true: 
                        <>
                          {
                            doggo.loading ? 
                            <>
                          <s.Container ai={"center"} jc={"center"} fd={"column"} fw={"wrap"}>
                            <s.Container ai={"center"} jc={"center"} fd={"row"} fw={"wrap"}>
                              <s.TextDescription style={{color: "#FFFFFF", fontSize: "30px"}}>LOADING...</s.TextDescription>
                            </s.Container>
                          </s.Container>
                            </> : 


                            <>
                          <s.Container ai={"center"} jc={"center"} fd={"column"} fw={"wrap"}>
                            {doggo.bakcTokens.filter(obj => (!obj.claimed && obj.delegated)).length > 0 ? <>
                            <s.TextDescription style={{color: "#FFFFFF", fontSize: "40px", textAlign: "center"}}>DOGGOS WITH BOOST TO SELL</s.TextDescription>
                            <s.SpacerMedium />
                            <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                                {
                                  (doggo.bakcTokens && doggo.bakcTokens.length > 0) ? (
                                    <>
                                      { doggo.bakcTokens.filter(obj => (!obj.claimed && obj.delegated)).map((obj) => 
                                        <s.Container ai={"center"} jc={"center"} style={{padding: "10px", margin: "5px", backgroundColor: (doggoIds[obj.tokenId] ? "#33AA55FF" : "#FFFFFF00"), borderRadius: "10px"}} onClick={(e) => { toggleDoggoId(obj.tokenId); }}>
                                          { getCurrentCost(obj.tokenId) > 0 ? 
                                            <><s.TextDescription style={{color: "#FFFFFF", fontSize: "20px"}}>COST: {Math.floor(getCurrentCost(obj.tokenId)/10**16)/10**2}E</s.TextDescription></> : 
                                            <><s.TextDescription style={{color: "#FFFFFF", fontSize: "20px"}}>NOT LISTED</s.TextDescription></>}
                                          <s.SpacerSmall />
                                          <StyledButton>
                                            DOGGO #{obj.tokenId}
                                          </StyledButton>
                                        </s.Container>) }
                                    </>
                                    ) : (<></>) 
                                }
                            </s.Container>
                            <s.SpacerMedium />
                            <s.Container ai={"center"} jc={"center"} fd="column" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                              <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                                <s.TextDescription style={{color: "#FFFFFF", fontSize: "20px"}}>BORRO COST: </s.TextDescription>
                                <s.SpacerSmall />
                                <input defaultValue={"0"} value={costToBorro} type="text" style={{width: "150px", height: "30px", fontSize: "25px", textAlign: "center"}} onChange={(e) => { updateBorroCost(e);}} />
                              </s.Container>
                              <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                                <StyledButton disabled={txPending} onClick={(e) => {e.preventDefault(); loanDoggos();}}>
                                  { txPending ? 'BUSY' : 'LIST BOOSTS' }
                                </StyledButton>
                                <s.SpacerSmall />
                                <StyledButton disabled={txPending} onClick={(e) => {e.preventDefault(); unloanDoggos();}}>
                                  { txPending ? 'BUSY' : 'DELIST BOOSTS' }
                                </StyledButton>
                              </s.Container>
                              <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                                <s.TextDescription style={{color: "#FFFFFF", fontSize: "30px"}}>{feedback}</s.TextDescription>
                              </s.Container>
                            </s.Container>
                            </> : <><s.TextDescription style={{color: "#FFFFFF", fontSize: "40px"}}>NO DOGGO BOOSTS TO SELL</s.TextDescription></> }

                            {doggo.bakcTokens.filter(obj => (!obj.claimed && !obj.delegated)).length > 0 ? <>
                            <s.SpacerLarge />
                            <s.TextDescription style={{color: "#FFFFFF", fontSize: "40px", textAlign: "center"}}>YOUR DOGGOS NEED TO BE DELEGATED</s.TextDescription>
                            <s.SpacerSmall />
                            <s.TextDescription style={{color: "#FFFFFF", fontSize: "20px", textAlign: "center"}}>TO SELL DOGGOS BOOSTS, USE DELEGATE.CASH TO DELEGATE FROM YOUR DOGGO WALLET TO THE BORROMYDOGGO CONTRACT</s.TextDescription>
                            <s.TextDescription style={{color: "#FFFFFF", fontSize: "20px", textAlign: "center"}}>BORROMYDOGGO ADDRESS: {CONFIG.BORROMYDOGGO_CONTRACT_ADDRESS}</s.TextDescription>
                            </> : null }
                          </s.Container>
                            </>
                          }
                        </>,
                      false: 
                        <>
                          {
                            doggo.loading ? 
                            <>
                          <s.Container ai={"center"} jc={"center"} fd={"column"} fw={"wrap"}>
                            <s.Container ai={"center"} jc={"center"} fd={"row"} fw={"wrap"}>
                              <s.TextDescription style={{color: "#FFFFFF", fontSize: "30px"}}>LOADING...</s.TextDescription>
                            </s.Container>
                          </s.Container>
                            </> : 


                            <>
                          <s.Container ai={"center"} jc={"center"} fd={"column"} fw={"wrap"}>

                            {doggo.baycTokens.filter(obj => (!obj.claimed && obj.delegated)).length > 0 ? <>
                            <s.TextDescription style={{color: "#FFFFFF", fontSize: "40px", textAlign: "center"}}>BAYC TO CLAIM WITH BOOST</s.TextDescription>
                            <s.SpacerMedium />
                            <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                                {
                                  (doggo.baycTokens && doggo.baycTokens.length > 0) ? (
                                    <>
                                      { doggo.baycTokens.filter(obj => (!obj.claimed && obj.delegated)).map((obj) => 
                                        <s.Container ai={"center"} jc={"center"} style={{padding: "10px", margin: "5px", backgroundColor: (baycIds[obj.tokenId] ? "#33AA55FF" : "#FFFFFF00"), borderRadius: "10px"}} onClick={(e) => { toggleBaycId(obj.tokenId); }}>
                                          <StyledButton>
                                            BAYC #{obj.tokenId}
                                          </StyledButton>
                                        </s.Container>) }
                                    </>
                                    ) : (<></>) 
                                }
                            </s.Container>
                            <s.SpacerMedium />
                            </> : null }

                            {doggo.maycTokens.filter(obj => (!obj.claimed && obj.delegated)).length > 0 ? <>
                            <s.TextDescription style={{color: "#FFFFFF", fontSize: "40px", textAlign: "center"}}>MAYC TO CLAIM WITH BOOST</s.TextDescription>
                            <s.SpacerMedium />
                            <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                                {
                                  (doggo.maycTokens && doggo.maycTokens.length > 0) ? (
                                    <>
                                      { doggo.maycTokens.filter(obj => (!obj.claimed && obj.delegated)).map((obj) => 
                                        <s.Container ai={"center"} jc={"center"} style={{padding: "10px", margin: "5px", backgroundColor: (maycIds[obj.tokenId] ? "#33AA55FF" : "#FFFFFF00"), borderRadius: "10px"}} onClick={(e) => { toggleMaycId(obj.tokenId); }}>
                                          <StyledButton>
                                            MAYC #{obj.tokenId}
                                          </StyledButton>
                                        </s.Container>) }
                                    </>
                                    ) : (<></>) 
                                }
                            </s.Container>
                            <s.SpacerMedium />
                            </> : null }

                            <s.TextDescription style={{color: "#FFFFFF", fontSize: "40px", textAlign: "center"}}>DOGGO BOOSTS FOR SALE</s.TextDescription>
                            <s.SpacerMedium />
                            <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                                {
                                  (doggo.availableDoggos && doggo.availableDoggos.length > 0) ? (
                                    <>
                                      { doggo.availableDoggos.sort((a, b) => {if(parseInt(a.borroCost) > parseInt(b.borroCost)) { return 1;} if(parseInt(a.borroCost) < parseInt(b.borroCost)) { return -1;} return 0;}).map((obj) => 
                                        <s.Container ai={"center"} jc={"center"} style={{padding: "10px", margin: "5px", backgroundColor: (doggoIds[obj.doggoId] ? "#33AA55FF" : "#FFFFFF00"), borderRadius: "10px"}} onClick={(e) => { toggleDoggoId(obj.doggoId); }}>
                                          <s.TextDescription style={{color: "#FFFFFF", fontSize: "20px"}}>COST: {Math.floor(getCurrentCost(obj.doggoId)/10**16)/10**2}E</s.TextDescription>
                                          <s.SpacerSmall />
                                          <StyledButton>
                                            DOGGO #{obj.doggoId}
                                          </StyledButton>
                                        </s.Container>) }
                                    </>
                                    ) : (<><s.TextDescription style={{color: "#FFFFFF", fontSize: "30px", textAlign: "center"}}>NO DOGGOS AVAILABLE</s.TextDescription></>) 
                                }
                            </s.Container>
                            <s.SpacerMedium />
                            <s.Container ai={"center"} jc={"center"} fd="column" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                              <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                                <s.TextDescription style={{color: "#FFFFFF", fontSize: "20px"}}>BORRO COST: {Math.floor(totalCostToBorro/10**16)/10**2}</s.TextDescription>
                              </s.Container>
                              <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                                <StyledButton disabled={txPending} onClick={(e) => {e.preventDefault(); borroDoggos();}}>
                                  { txPending ? 'BUSY' : 'BORROW & MINT' }
                                </StyledButton>
                              </s.Container>
                              <s.Container ai={"center"} jc={"center"} fd="row" fw={"wrap"} style={{display: "flex", backgroundColor: "#111111", padding: "10px", width: "fit-content"}}>
                                <s.TextDescription style={{color: "#FFFFFF", fontSize: "30px"}}>{feedback}</s.TextDescription>
                              </s.Container>
                            </s.Container>
                            
                            {doggo.baycTokens.filter(obj => (!obj.claimed && !obj.delegated)).length > 0 || doggo.maycTokens.filter(obj => (!obj.claimed && !obj.delegated)).length > 0 ?
                              <>
                                <s.TextDescription style={{color: "#FFFFFF", fontSize: "40px", textAlign: "center"}}>YOU HAVE APES THAT ARE NOT DELEGATED</s.TextDescription>
                                <s.SpacerMedium />
                                <s.TextDescription style={{color: "#FFFFFF", fontSize: "20px", textAlign: "center"}}>TO USE BORROMYDOGGO FOR SEWER PASS BOOSTS, USE DELEGATE.CASH TO DELEGATE CLAIMS TO THE BORROMYDOGGO CONTRACT ADDRESS {CONFIG.BORROMYDOGGO_CONTRACT_ADDRESS}</s.TextDescription>
                                <s.SpacerMedium />
                              </> : null}
                            
                          </s.Container>
                            </>
                          }
                        </>,
                    }[sellBoostMode]
                  }
                  </>
                )}
            <s.SpacerMedium />
          </s.Container>
          <s.SpacerLarge />
        </ResponsiveWrapper>
        <s.SpacerMedium />
      </s.Container>
    </s.Screen>
  );
}

export default App;
