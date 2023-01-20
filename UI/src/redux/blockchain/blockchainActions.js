// constants
import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletLink from "walletlink";
import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";
import Web3Modal from "web3modal";

// log
import { fetchDog } from "../dog/dogActions";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: "<<INFURA_ID>>", // required
      rpc: {
        1: "https://mainnet.infura.io/v3/<<INFURA_ID>>"
      }
    }
  }, 
  walletlink: {
    package: WalletLink, // Required
    options: {
      appName: "BorroMyDog", // Required
      infuraId: "<<INFURA_ID>>", // Required unless you provide a JSON RPC url; see `rpc` below
      rpc: "https://mainnet.infura.io/v3/<<INFURA_ID>>", // Optional if `infuraId` is provided; otherwise it's required
      chainId: 1, // Optional. It defaults to 1 if not provided
      appLogoUrl: null, // Optional. Application logo image URL. favicon is used if unspecified
      darkMode: false // Optional. Use dark theme, defaults to false
    }
  }
};

const web3Modal = new Web3Modal({
  network: "mainnet", // optional
  providerOptions,
  theme: "dark"
});

const connectRequest = () => {
  return {
    type: "CONNECTION_REQUEST",
  };
};

const connectSuccess = (payload) => {
  return {
    type: "CONNECTION_SUCCESS",
    payload: payload,
  };
};

const connectFailed = (payload) => {
  return {
    type: "CONNECTION_FAILED",
    payload: payload,
  };
};

const updateAccountRequest = (payload) => {
  return {
    type: "UPDATE_ACCOUNT",
    payload: payload,
  };
};

export const connect = () => {
  return async (dispatch) => {
    dispatch(connectRequest());
    const borromydog_abiResponse = await fetch("/config/borromydog_abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const helper_abiResponse = await fetch("/config/helper_abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const borromydog_abi = await borromydog_abiResponse.json();
    const helper_abi = await helper_abiResponse.json();
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const CONFIG = await configResponse.json();
    web3Modal.clearCachedProvider();
    const provider = await web3Modal.connect();
    const web3 = new Web3(provider);

    const { ethereum } = web3;
      Web3EthContract.setProvider(provider);
      try {
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();
        if (networkId == CONFIG.NETWORK.ID) {
          const borromydog_SmartContractObj = new Web3EthContract(
            borromydog_abi,
            CONFIG.BORROMYDOG_CONTRACT_ADDRESS
          );
          const helper_SmartContractObj = new Web3EthContract(
            helper_abi,
            CONFIG.HELPER_CONTRACT_ADDRESS
          );
          dispatch(
            connectSuccess({
              account: accounts[0],
              borromydogContract: borromydog_SmartContractObj,
              helperContract: helper_SmartContractObj,
              web3: web3,
            })
          );
          // Add listeners start
          provider.on("accountsChanged", (accounts) => {
            dispatch(updateAccount(accounts[0]));
          });
          provider.on("chainChanged", () => {
            window.location.reload();
          });
          // Add listeners end
        } else {
          dispatch(connectFailed(`Change network to ${CONFIG.NETWORK.NAME}.`));
        }
      } catch (err) {
        dispatch(connectFailed("Something went wrong."));
      }
    }
};

export const updateAccount = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }));
    dispatch(fetchDog(account));
  };
};
