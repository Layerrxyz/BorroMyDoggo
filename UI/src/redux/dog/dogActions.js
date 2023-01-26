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

      availableDogs = [...availableDogs].sort((a, b) => {
                                        if (
                                          parseInt(a.rentACost) >
                                          parseInt(b.rentACost)
                                        ) {
                                          return 1;
                                        }
                                        if (
                                          parseInt(a.rentACost) <
                                          parseInt(b.rentACost)
                                        ) {
                                          return -1;
                                        }
                                        return 0;
                                      });

      dispatch(
        fetchDogSuccess({
          baycTokens,
          maycTokens,
          bakcTokens,
          availableDogs
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(fetchDogFailed("Could not load data from contract."));
    }
  };
};
