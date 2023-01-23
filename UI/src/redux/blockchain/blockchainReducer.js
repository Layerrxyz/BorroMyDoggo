const initialState = {
  loading: false,
  account: null,
  rentmydogContract: null,
  helperContract: null,
  playmypassContract: null,
  delegatecashContract: null,
  web3: null,
  errorMsg: "",
};

const blockchainReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CONNECTION_REQUEST":
      return {
        ...initialState,
        loading: true,
      };
    case "CONNECTION_SUCCESS":
      return {
        ...state,
        loading: false,
        account: action.payload.account,
        rentmydogContract: action.payload.rentmydogContract,
        helperContract: action.payload.helperContract,
        playmypassContract: action.payload.playmypassContract,
        delegatecashContract: action.payload.delegatecashContract,
        web3: action.payload.web3,
      };
    case "CONNECTION_FAILED":
      return {
        ...initialState,
        loading: false,
        errorMsg: action.payload,
      };
    case "UPDATE_ACCOUNT":
      return {
        ...state,
        account: action.payload.account,
      };
    default:
      return state;
  }
};

export default blockchainReducer;
