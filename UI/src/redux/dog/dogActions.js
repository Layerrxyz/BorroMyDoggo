// log
import store from "../store";


const fetchDogRequest = () => {
  return {
    type: "CHECK_DOG_REQUEST",
  };
};

const fetchDogSuccess = (payload) => {
  return {
    type: "CHECK_DOG_SUCCESS",
    payload: payload,
  };
};

const fetchDogFailed = (payload) => {
  return {
    type: "CHECK_DOG_FAILED",
    payload: payload,
  };
};

export const fetchDog = (blockchainAccount) => {
  return async (dispatch) => {
    dispatch(fetchDogRequest());

    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const CONFIG = await configResponse.json();

    try {
      let baycTokens = await store
        .getState()
        .blockchain.helperContract.methods.baycTokens(blockchainAccount)
        .call();
      let maycTokens = await store
        .getState()
        .blockchain.helperContract.methods.maycTokens(blockchainAccount)
        .call();
      let bakcTokens = await store
        .getState()
        .blockchain.helperContract.methods.bakcTokens(blockchainAccount)
        .call();
      let availableDogs = await store
        .getState()
        .blockchain.rentmydogContract.methods.availableDawgs()
        .call();
      let playMyPassDelegated = await store
      .getState()
      .blockchain.delegatecashContract.methods.checkDelegateForAll(blockchainAccount, CONFIG.PLAY_MY_PASS_CONTRACT_ADDRESS)
      .call();
      let playMyPassBalance = await store
      .getState()
      .blockchain.sewerpassContract.methods.balanceOf(CONFIG.PLAY_MY_PASS_CONTRACT_ADDRESS)
      .call();

      dispatch(
        fetchDogSuccess({
          baycTokens,
          maycTokens,
          bakcTokens,
          availableDogs,
          playMyPassDelegated,
          playMyPassBalance,
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(fetchDogFailed("Could not load data from contract."));
    }
  };
};
