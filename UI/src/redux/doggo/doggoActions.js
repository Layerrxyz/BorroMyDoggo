// log
import store from "../store";


const fetchDoggoRequest = () => {
  return {
    type: "CHECK_DOGGO_REQUEST",
  };
};

const fetchDoggoSuccess = (payload) => {
  return {
    type: "CHECK_DOGGO_SUCCESS",
    payload: payload,
  };
};

const fetchDoggoFailed = (payload) => {
  return {
    type: "CHECK_DOGGO_FAILED",
    payload: payload,
  };
};

export const fetchDoggo = (blockchainAccount) => {
  return async (dispatch) => {
    dispatch(fetchDoggoRequest());

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
      let availableDoggos = await store
        .getState()
        .blockchain.borromydoggoContract.methods.availableDoggos()
        .call();

      dispatch(
        fetchDoggoSuccess({
          baycTokens,
          maycTokens,
          bakcTokens,
          availableDoggos,
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(fetchDoggoFailed("Could not load data from contract."));
    }
  };
};
