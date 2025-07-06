mod declarations {
    pub mod ckbtc {
        include!("../../declarations/ckbtc/ckbtc.rs");
    }
    pub mod iusd {
        include!("../../declarations/iusd/iusd.rs");
    }
}

use declarations::ckbtc::{Account as BtcAccount, TransferArg as BtcTransferArg};
use declarations::iusd::{Account as IUsdAccount, TransferArg as IUsdTransferArg, TransferFromArgs as IUsdTransferFromArgs};

use ic_cdk::{api::{caller, id as canister_id, time}, call, spawn};
use ic_cdk_macros::*;
use candid::{CandidType, Principal};
use serde::Deserialize;
use std::cell::RefCell;
use std::collections::HashMap;

const MAX_LTV: f64 = 0.7;
const INTEREST_RATE_PER_SEC: f64 = 0.10 / 31_536_000.0; // 10% APR

const ORACLE_CANISTER_ID: &str = "ulvla-h7777-77774-qaacq-cai";
const BTC_CANISTER_ID: &str = "uzt4z-lp777-77774-qaabq-cai";
const IUSD_CANISTER_ID: &str = "umunu-kh777-77774-qaaca-cai";

#[derive(Clone, Default)]
struct Loan {
    btc_locked: u64,
    iusd_borrowed: u64,
    last_accrued_timestamp: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
struct LoanEvent {
    action: String,
    amount: u64,
    timestamp: u64,
}

#[derive(CandidType, Deserialize)]
struct ProtocolStats {
    total_btc_locked: u64,
    total_iusd_borrowed: u64,
}

thread_local! {
    static LOANS: RefCell<HashMap<Principal, Loan>> = RefCell::new(HashMap::new());
    static LOAN_HISTORY: RefCell<HashMap<Principal, Vec<LoanEvent>>> = RefCell::new(HashMap::new());
}

fn accrue_interest(loan: &mut Loan) {
    let now = time();
    if loan.last_accrued_timestamp == 0 || loan.iusd_borrowed == 0 {
        loan.last_accrued_timestamp = now;
        return;
    }

    let elapsed_secs = ((now - loan.last_accrued_timestamp) / 1_000_000_000) as u64;
    if elapsed_secs == 0 {
        return;
    }

    let interest = (loan.iusd_borrowed as f64) * INTEREST_RATE_PER_SEC * (elapsed_secs as f64);
    loan.iusd_borrowed += interest.round() as u64;
    loan.last_accrued_timestamp = now;
}

fn record_event(user: Principal, action: &str, amount: u64) {
    let event = LoanEvent {
        action: action.to_string(),
        amount,
        timestamp: time(),
    };
    LOAN_HISTORY.with(|hist| {
        hist.borrow_mut().entry(user).or_default().push(event);
    });
}

#[update]
async fn deposit_btc(sats: u64) {
    let user = caller();

    let arg = BtcTransferArg {
        from_subaccount: None,
        to: BtcAccount {
            owner: canister_id(),
            subaccount: None,
        },
        amount: sats.into(),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let (res,): (Result<u128, String>,) = call(
        Principal::from_text(BTC_CANISTER_ID).unwrap(),
        "icrc1_transfer_from",
        (user, arg)
    ).await.unwrap();

    match res {
        Ok(_) => {
            LOANS.with(|loans| {
                let mut loans = loans.borrow_mut();
                loans.entry(user).or_default().btc_locked += sats;
            });
            record_event(user, "deposit_btc", sats);
        },
        Err(e) => ic_cdk::trap(&format!("BTC deposit failed: {}", e)),
    }
}

#[update]
async fn borrow_iusd() -> u64 {
    let user = caller();

    let (price,): (u64,) = call(
        Principal::from_text(ORACLE_CANISTER_ID).unwrap(),
        "get_price",
        ()
    ).await.unwrap();

    let borrow_amount = LOANS.with(|loans| {
        let mut loans = loans.borrow_mut();
        let loan = loans.entry(user).or_default();
        accrue_interest(loan);

        let usd_value = (loan.btc_locked as u128 * price as u128) / 100_000_000;
        let max_borrowable = (usd_value as f64 * MAX_LTV) as u64;
        let amount = max_borrowable.saturating_sub(loan.iusd_borrowed);
        amount
    });

    if borrow_amount == 0 {
        ic_cdk::trap("Nothing to borrow: already at max LTV or insufficient collateral.");
    }

    let transfer = IUsdTransferArg {
        from_subaccount: None,
        to: IUsdAccount { owner: user, subaccount: None },
        amount: borrow_amount.into(),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let (res,): (Result<u128, String>,) = call(
        Principal::from_text(IUSD_CANISTER_ID).unwrap(),
        "icrc1_transfer",
        (transfer,)
    ).await.unwrap();

    match res {
        Ok(_) => {
            LOANS.with(|loans| {
                let mut loans = loans.borrow_mut();
                let loan = loans.entry(user).or_default();
                loan.iusd_borrowed += borrow_amount;
                loan.last_accrued_timestamp = time();
            });

            record_event(user, "borrow_iusd", borrow_amount);
            borrow_amount
        },
        Err(e) => ic_cdk::trap(&format!("iUSD borrow transfer failed: {}", e)),
    }
}

#[update]
async fn repay_iusd(amount: u64) {
    let user = caller();

    let burn_arg = IUsdTransferFromArgs {
        spender_subaccount: None,
        from: IUsdAccount {
            owner: user,
            subaccount: None,
        },
        to: IUsdAccount {
            owner: canister_id(),
            subaccount: None,
        },
        amount: amount.into(),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let (res,): (Result<u128, String>,) = call(
        Principal::from_text(IUSD_CANISTER_ID).unwrap(),
        "icrc1_transfer_from",
        (burn_arg,),
    ).await.unwrap();

    if let Err(e) = res {
        ic_cdk::trap(&format!("iUSD repay transfer failed: {}", e));
    }

    LOANS.with(|loans| {
        let mut loans = loans.borrow_mut();
        if let Some(loan) = loans.get_mut(&user) {
            accrue_interest(loan);
            loan.iusd_borrowed = loan.iusd_borrowed.saturating_sub(amount);

            if loan.iusd_borrowed == 0 {
                let btc_locked = loan.btc_locked;
                loan.btc_locked = 0;

                spawn(async move {
                    let transfer_back = BtcTransferArg {
                        from_subaccount: None,
                        to: BtcAccount { owner: user, subaccount: None },
                        amount: btc_locked.into(),
                        fee: None,
                        memo: None,
                        created_at_time: None,
                    };

                    let (res,): (Result<u128, String>,) = call(
                        Principal::from_text(BTC_CANISTER_ID).unwrap(),
                        "icrc1_transfer",
                        (transfer_back,)
                    ).await.unwrap();

                    if let Err(e) = res {
                        ic_cdk::println!("Refund BTC failed: {}", e);
                    }
                });
            }
        }
    });

    record_event(user, "repay_iusd", amount);
}

#[query]
fn get_loan() -> (u64, u64) {
    let user = caller();
    LOANS.with(|loans| {
        let mut loans = loans.borrow_mut();
        if let Some(loan) = loans.get_mut(&user) {
            accrue_interest(loan);
            (loan.btc_locked, loan.iusd_borrowed)
        } else {
            (0, 0)
        }
    })
}

#[update]
async fn get_max_borrowable_auto() -> u64 {
    let user = caller();

    let (price,): (u64,) = call(
        Principal::from_text(ORACLE_CANISTER_ID).unwrap(),
        "get_price",
        ()
    ).await.unwrap();

    LOANS.with(|loans| {
        let mut loans = loans.borrow_mut();
        if let Some(loan) = loans.get_mut(&user) {
            accrue_interest(loan);
            let usd_value = loan.btc_locked as u128 * price as u128 / 100_000_000;
            let max_borrowable = (usd_value as f64 * MAX_LTV) as u64;
            max_borrowable.saturating_sub(loan.iusd_borrowed)
        } else {
            0
        }
    })
}

#[query]
fn get_accrued_interest() -> u64 {
    let user = caller();
    LOANS.with(|loans| {
        let loans = loans.borrow();
        if let Some(loan) = loans.get(&user) {
            if loan.last_accrued_timestamp == 0 || loan.iusd_borrowed == 0 {
                return 0;
            }

            let now = time();
            let elapsed_secs = ((now - loan.last_accrued_timestamp) / 1_000_000_000) as u64;

            if elapsed_secs == 0 {
                return 0;
            }

            let interest = (loan.iusd_borrowed as f64) * INTEREST_RATE_PER_SEC * (elapsed_secs as f64);
            interest.round() as u64
        } else {
            0
        }
    })
}

#[query]
fn get_loan_history() -> Vec<LoanEvent> {
    let user = caller();
    LOAN_HISTORY.with(|hist| {
        hist.borrow().get(&user).cloned().unwrap_or_default()
    })
}

#[query]
fn get_protocol_stats() -> ProtocolStats {
    LOANS.with(|loans| {
        let loans = loans.borrow();
        let mut total_btc = 0;
        let mut total_iusd = 0;

        for loan in loans.values() {
            total_btc += loan.btc_locked;
            total_iusd += loan.iusd_borrowed;
        }

        ProtocolStats {
            total_btc_locked: total_btc,
            total_iusd_borrowed: total_iusd,
        }
    })
}

#[update]
async fn get_btc_price_from_oracle() -> u64 {
    let (price,): (u64,) = call(
        Principal::from_text(ORACLE_CANISTER_ID).unwrap(),
        "get_price",
        ()
    ).await.unwrap();
    price
}

