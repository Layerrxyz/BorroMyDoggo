const initialState = {
  loading: false,
  baycTokens: [],
  maycTokens: [],
  bakcTokens: [],
  availableDoggos: [],
  error: false,
  errorMsg: "",
};


const doggoReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CHECK_DOGGO_REQUEST":
      return {
        ...state,
        loading: true,
        error: false,
        errorMsg: "",
      };
    case "CHECK_DOGGO_SUCCESS":
      return {
        ...state,
        loading: false,
        baycTokens: action.payload.baycTokens,
        maycTokens: action.payload.maycTokens,
        bakcTokens: action.payload.bakcTokens,
        availableDoggos: action.payload.availableDoggos,
        error: false,
        errorMsg: "",
      };
    case "CHECK_DOGGO_FAILED":
      return {
        ...initialState,
        loading: false,
        error: true,
        errorMsg: action.payload,
      };
    default:
      return state;
  }
};

export default doggoReducer;
