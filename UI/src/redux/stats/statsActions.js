// log
import store from "../store";


const fetchStatsRequest = () => {
  return {
    type: "CHECK_STATS_REQUEST",
  };
};

const fetchStatsSuccess = (payload) => {
  return {
    type: "CHECK_STATS_SUCCESS",
    payload: payload,
  };
};

const fetchStatsFailed = (payload) => {
  return {
    type: "CHECK_STATS_FAILED",
    payload: payload,
  };
};

export const fetchStats = () => {
  return async (dispatch) => {
    dispatch(fetchStatsRequest());
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const CONFIG = await configResponse.json();

    try {
      const leaderboardResponse = await fetch(CONFIG.LEADERBOARD_URI, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const leaderboard = await leaderboardResponse.json();
      const lastSaleResponse = await fetch(CONFIG.LAST_SALE_URI, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const lastSale = await lastSaleResponse.json();

      let tier4Top50 = 0;
      let topRankNonTier4 = 0;
      let topNonTier4Tier = 0;
      for(let i = 0;i < leaderboard["records"].length;i++) {
        if(leaderboard["records"][i]["character"]["tier"] == 4) { tier4Top50++; }
        else if(topRankNonTier4 == 0 || leaderboard["records"][i]["rank"] < topRankNonTier4) { 
          topRankNonTier4 = leaderboard["records"][i]["rank"]; 
          topNonTier4Tier = leaderboard["records"][i]["character"]["tier"];
        }
      }
      let lastT1Sale = 0;
      let lastT2Sale = 0;
      let lastT3Sale = 0;
      let lastT4Sale = 0;
      lastT1Sale = lastSale["lastSale"]["1"];
      lastT2Sale = lastSale["lastSale"]["2"];
      lastT3Sale = lastSale["lastSale"]["3"];
      lastT4Sale = lastSale["lastSale"]["4"];

      dispatch(
        fetchStatsSuccess({
          tier4Top50,
          topRankNonTier4,
          topNonTier4Tier,
          lastT1Sale,
          lastT2Sale,
          lastT3Sale,
          lastT4Sale,
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(fetchStatsFailed("Could not load data."));
    }
  };
};
