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
        .blockchain.borromydogContract.methods.availableDogs()
        .call();

      dispatch(
        fetchDogSuccess({
          baycTokens,
          maycTokens,
          bakcTokens,
          availableDogs,
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(fetchDogFailed("Could not load data from contract."));
    }
  };
};
