const initialState = {
  loading: false,
  tier4Top50: 0,
  tier4Top100: 0,
  tier4Top500: 0,
  topRankNonTier4: 0,
  topNonTier4Tier: 0,
  lastT1Sale: 0,
  lastT2Sale: 0,
  lastT3Sale: 0,
  lastT4Sale: 0,
  error: false,
  errorMsg: "",
};


const statsReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CHECK_STATS_REQUEST":
      return {
        ...state,
        loading: true,
        error: false,
        errorMsg: "",
      };
    case "CHECK_STATS_SUCCESS":
      return {
        ...state,
        loading: false,
        tier4Top50: action.payload.tier4Top50,
        tier4Top100: action.payload.tier4Top100,
        tier4Top500: action.payload.tier4Top500,
        topRankNonTier4: action.payload.topRankNonTier4,
        topNonTier4Tier: action.payload.topNonTier4Tier,
        lastT1Sale: action.payload.lastT1Sale,
        lastT2Sale: action.payload.lastT2Sale,
        lastT3Sale: action.payload.lastT3Sale,
        lastT4Sale: action.payload.lastT4Sale,
        error: false,
        errorMsg: "",
      };
    case "CHECK_STATS_FAILED":
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

export default statsReducer;
