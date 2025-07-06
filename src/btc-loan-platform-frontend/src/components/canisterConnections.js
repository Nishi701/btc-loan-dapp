import { HttpAgent, Actor } from '@dfinity/agent';
import { idlFactory as loanIDL } from '../../../declarations/loan_canister';
import { idlFactory as oracleIDL } from '../../../declarations/oracle_canister';
import { idlFactory as ckbtcIDL } from '../../../declarations/mock_ckbtc';
import { idlFactory as iusdIDL } from '../../../declarations/mock_iusd';
import canisterIds from "../../../../.dfx/local/canister_ids.json";
import { Principal } from '@dfinity/principal';

// ====== CONFIGURATION ======
const LOCAL_HOST = "http://127.0.0.1:4943";

export const loanCanisterId = Principal.fromText(canisterIds.loan_canister.local);
const oracleCanisterId = Principal.fromText(canisterIds.oracle_canister.local);
const ckbtcCanisterId = Principal.fromText(canisterIds.mock_ckbtc.local);
const iusdCanisterId = Principal.fromText(canisterIds.mock_iusd.local);

// ====== AGENT SETUP ======
const agent = new HttpAgent({ host: LOCAL_HOST });

if (LOCAL_HOST.includes('127.0.0.1') || LOCAL_HOST.includes('localhost')) {
  agent.fetchRootKey().catch(err => {
    console.warn('Unable to fetch root key. This is expected if not running locally.', err);
  });
}

// ====== ACTORS ======
export const loanActor = Actor.createActor(loanIDL, {
  agent,
  canisterId: loanCanisterId,
});

export const oracleActor = Actor.createActor(oracleIDL, {
  agent,
  canisterId: oracleCanisterId,
});

export const ckbtcActor = Actor.createActor(ckbtcIDL, {
  agent,
  canisterId: ckbtcCanisterId,
});

export const iusdActor = Actor.createActor(iusdIDL, {
  agent,
  canisterId: iusdCanisterId,
});

// ====== UTILITIES ======

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

// MINT FUNCTION — REQUIRED TO FUND USER ACCOUNT
export const mintBtcTokens = async (principalText, amount) => {
  try {
    const principal = Principal.fromText(principalText);
    await ckbtcActor.mint(principal, BigInt(amount));
    return true;
  } catch (err) {
    console.error("Error minting BTC tokens:", err);
    throw err;
  }
};

// CHECK BALANCE FUNCTION (optional debug)
export const getBtcBalance = async (principalText) => {
  try {
    const principal = Principal.fromText(principalText);
    const account = { owner: principal, subaccount: [] };
    const balance = await ckbtcActor.icrc1_balance_of(account);
    return Number(balance);
  } catch (err) {
    console.error("Error fetching BTC balance:", err);
    return 0;
  }
};

export const getUserLoanData = async () => {
  try {
    const [btcLocked, iusdBorrowed] = await loanActor.get_loan();
    return {
      btcLocked: Number(btcLocked),
      iusdBorrowed: Number(iusdBorrowed),
    };
  } catch (err) {
    console.error("Error fetching user loan data:", err);
    return { btcLocked: 0, iusdBorrowed: 0 };
  }
};
