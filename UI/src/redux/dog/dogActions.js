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

export const fetchDog = (blockchainAccount = "", retryCount = 0) => {
  return async (dispatch) => {
    dispatch(fetchDogRequest());

    try {
      let baycTokens = [];
      let maycTokens = [];
      let bakcTokens = [];

      if(blockchainAccount != "") {
        baycTokens = await store
          .getState()
          .blockchain.helperContract.methods.baycTokens(blockchainAccount)
          .call();
        maycTokens = await store
          .getState()
          .blockchain.helperContract.methods.maycTokens(blockchainAccount)
          .call();
        bakcTokens = await store
          .getState()
          .blockchain.helperContract.methods.bakcTokens(blockchainAccount)
          .call();
      }
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
      if(retryCount < 3) {
        dispatch(fetchDog(blockchainAccount, (retryCount + 1)));
      } else {
        dispatch(fetchDogFailed("Could not load data from contract."));
      }
    }
  };
};
