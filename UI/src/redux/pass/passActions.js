// log
import store from "../store";


const fetchPassRequest = () => {
  return {
    type: "CHECK_PASS_REQUEST",
  };
};

const fetchPassSuccess = (payload) => {
  return {
    type: "CHECK_PASS_SUCCESS",
    payload: payload,
  };
};

const fetchPassFailed = (payload) => {
  return {
    type: "CHECK_PASS_FAILED",
    payload: payload,
  };
};

export const fetchPass = (blockchainAccount = "", retryCount = 0) => {
  return async (dispatch) => {
    dispatch(fetchPassRequest());

    try {
      const configResponse = await fetch("/config/config.json", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const CONFIG = await configResponse.json();
      let approvedForAll = false;
      let spTokens = [];
      let myPassesForRent = [];
      let myPassesRented = [];
      let myRentals = [];
      let rentalPurchasePrice = {};
      let spTokenTiers = {};

      if(blockchainAccount != "") {
        approvedForAll = await store
          .getState()
          .blockchain.sewerpassContract.methods.isApprovedForAll(blockchainAccount, CONFIG.PLAY_MY_PASS_CONTRACT_ADDRESS)
          .call();
        spTokens = await store
          .getState()
          .blockchain.playmypassContract.methods.sewerpassTokenIds(blockchainAccount)
          .call();
        myPassesForRent = await store
          .getState()
          .blockchain.playmypassContract.methods.myPassesForRent(blockchainAccount)
          .call();
        myPassesRented = await store
          .getState()
          .blockchain.playmypassContract.methods.myPassesRented(blockchainAccount)
          .call();
        myRentals = await store
          .getState()
          .blockchain.playmypassContract.methods.myRentals(blockchainAccount)
          .call();
        for(let i = 0;i < spTokens.length;i++) {
          let passData = await store
            .getState()
            .blockchain.sewerpassContract.methods.getMintDataByTokenId(spTokens[i])
            .call();
          spTokenTiers[spTokens[i]] = passData.tier;
        }
        for(let i = 0;i < myRentals.length;i++) {
          let passData = await store
            .getState()
            .blockchain.playmypassContract.methods.passData(myRentals[i].passId)
            .call();
          rentalPurchasePrice[passData.passId] = {purchaseAllowed: passData.purchaseAllowed, purchasePrice: passData.purchasePrice };
        }
      }
      let availableToRent = await store
        .getState()
        .blockchain.playmypassContract.methods.availableToRent()
        .call();

      availableToRent = [...availableToRent].sort((a, b) => {
                                        if (
                                          parseInt(a.hourlyRentalPrice) >
                                          parseInt(b.hourlyRentalPrice)
                                        ) {
                                          return 1;
                                        }
                                        if (
                                          parseInt(a.hourlyRentalPrice) <
                                          parseInt(b.hourlyRentalPrice)
                                        ) {
                                          return -1;
                                        }
                                        return 0;
                                      });

      dispatch(
        fetchPassSuccess({
          approvedForAll,
          spTokens,
          availableToRent,
          myPassesForRent,
          myPassesRented,
          myRentals,
          rentalPurchasePrice,
          spTokenTiers
        })
      );
    } catch (err) {
      console.log(err);
      if(retryCount < 3) {
        dispatch(fetchPass(blockchainAccount, (retryCount + 1)));
      } else {
        dispatch(fetchPassFailed("Could not load data from contract."));
      }
    }
  };
};
