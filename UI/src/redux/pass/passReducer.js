const initialState = {
  loading: false,
  approvedForAll: false,
  spTokens: [],
  availableToRent: [],
  myPassesForRent: [],
  myPassesRented: [],
  myRentals: [],
  rentalPurchasePrice: {},
  spTokenTiers: {},
  error: false,
  errorMsg: "",
};


const passReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CHECK_PASS_REQUEST":
      return {
        ...state,
        loading: true,
        error: false,
        errorMsg: "",
      };
    case "CHECK_PASS_SUCCESS":
      return {
        ...state,
        loading: false,
        approvedForAll: action.payload.approvedForAll,
        spTokens: action.payload.spTokens,
        availableToRent: action.payload.availableToRent,
        myPassesForRent: action.payload.myPassesForRent,
        myPassesRented: action.payload.myPassesRented,
        myRentals: action.payload.myRentals,
        rentalPurchasePrice: action.payload.rentalPurchasePrice,
        spTokenTiers: action.payload.spTokenTiers,
        error: false,
        errorMsg: "",
      };
    case "CHECK_PASS_FAILED":
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

export default passReducer;
