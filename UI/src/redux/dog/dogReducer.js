const initialState = {
  loading: false,
  baycTokens: [],
  maycTokens: [],
  bakcTokens: [],
  availableDogs: [],
  error: false,
  errorMsg: "",
};


const dogReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CHECK_DOG_REQUEST":
      return {
        ...state,
        loading: true,
        error: false,
        errorMsg: "",
      };
    case "CHECK_DOG_SUCCESS":
      return {
        ...state,
        loading: false,
        baycTokens: action.payload.baycTokens,
        maycTokens: action.payload.maycTokens,
        bakcTokens: action.payload.bakcTokens,
        availableDogs: action.payload.availableDogs,
        error: false,
        errorMsg: "",
      };
    case "CHECK_DOG_FAILED":
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

export default dogReducer;
