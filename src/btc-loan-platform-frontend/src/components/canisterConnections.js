

import { HttpAgent, Actor } from '@dfinity/agent';
import { idlFactory as loanIDL } from '../../../declarations/loan_canister';
import { idlFactory as oracleIDL } from '../../../declarations/oracle_canister';
import { Principal } from '@dfinity/principal';


const LOCAL_HOST = "http://127.0.0.1:4943";
const loanCanisterId = "umunu-kh777-77774-qaaca-cai";
const oracleCanisterId = "uxrrr-q7777-77774-qaaaq-cai";

const agent = new HttpAgent({ host: LOCAL_HOST });

export const loanActor = Actor.createActor(loanIDL, {
  agent,
  canisterId: loanCanisterId,
});

export const oracleActor = Actor.createActor(oracleIDL, {
  agent,
  canisterId: oracleCanisterId,
});

// Utility Functions

export const getBtcPrice = async () => {
  try {
    const price = await oracleActor.get_price();
    return Number(price);
  } catch (err) {
    console.error("Error fetching BTC price:", err);
    return 0;
  }
};

export const getLoanData = async () => {
  try {
    const [btcLocked, iusdBorrowed] = await loanActor.get_loan();
    return [Number(btcLocked), Number(iusdBorrowed)];
  } catch (err) {
    console.error("Error fetching loan data:", err);
    return [0, 0];
  }
};

export const getProtocolStats = async () => {
  try {
    const stats = await loanActor.get_protocol_stats();
    return {
      total_btc_locked: Number(stats.total_btc_locked),
      total_iusd_borrowed: Number(stats.total_iusd_borrowed),
    };
  } catch (err) {
    console.error("Error fetching protocol stats:", err);
    return {
      total_btc_locked: 0,
      total_iusd_borrowed: 0,
    };
  }
};

export const getLoanHistory = async () => {
  try {
    const history = await loanActor.get_loan_history();
    return history.map(event => ({
      action: event.action,
      amount: Number(event.amount),
      timestamp: Number(event.timestamp),
    }));
  } catch (err) {
    console.error("Error fetching loan history:", err);
    return [];
  }
};
