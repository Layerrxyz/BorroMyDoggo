import { applyMiddleware, compose, createStore, combineReducers } from "redux";
import thunk from "redux-thunk";
import blockchainReducer from "./blockchain/blockchainReducer";
import dogReducer from "./dog/dogReducer";
import statsReducer from "./stats/statsReducer";
import passReducer from "./pass/passReducer";

const rootReducer = combineReducers({
  blockchain: blockchainReducer,
  dog: dogReducer,
  stats: statsReducer,
  pass: passReducer
});

const middleware = [thunk];
const composeEnhancers = compose(applyMiddleware(...middleware));

const configureStore = () => {
  return createStore(rootReducer, composeEnhancers);
};

const store = configureStore();

export default store;
