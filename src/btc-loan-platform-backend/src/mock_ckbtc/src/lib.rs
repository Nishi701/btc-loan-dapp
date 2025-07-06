use candid::{CandidType, Principal};
use ic_cdk_macros::*;
use ic_cdk::println;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

type Tokens = u128;

#[derive(CandidType, Deserialize, Serialize, Clone, PartialEq, Eq, Hash)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct TransferArg {
    pub from_subaccount: Option<Vec<u8>>,
    pub to: Account,
    pub amount: Tokens,
    pub fee: Option<Tokens>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

thread_local! {
    static BALANCES: RefCell<HashMap<(Principal, Option<Vec<u8>>), Tokens>> = RefCell::new(HashMap::new());
    static ALLOWANCES: RefCell<HashMap<(Principal, Principal), Tokens>> = RefCell::new(HashMap::new());
}

fn get_account_key(owner: Principal, subaccount: Option<Vec<u8>>) -> (Principal, Option<Vec<u8>>) {
    (owner, subaccount)
}

#[update]
fn icrc1_transfer(arg: TransferArg) -> Result<Tokens, String> {
    let from = ic_cdk::caller();
    let from_key = get_account_key(from, arg.from_subaccount.clone());
    let to_key = get_account_key(arg.to.owner, arg.to.subaccount.clone());
    let amount = arg.amount;

    println!("[TRANSFER] From: {:?}, To: {:?}, Amount: {}", from_key, to_key, amount);

    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();
        let sender_balance = balances.entry(from_key).or_insert(0);

        if *sender_balance < amount {
            return Err("❌ Insufficient funds".into());
        }

        *sender_balance -= amount;
        let recipient_balance = balances.entry(to_key).or_insert(0);
        *recipient_balance += amount;

        Ok(amount)
    })
}

#[update]
fn icrc1_transfer_from(from_principal: Principal, arg: TransferArg) -> Result<Tokens, String> {
    let caller = ic_cdk::caller();
    let from_key = get_account_key(from_principal, arg.from_subaccount.clone());
    let to_key = get_account_key(arg.to.owner, arg.to.subaccount.clone());
    let amount = arg.amount;

    println!("[TRANSFER_FROM] Caller: {}, From: {}, To: {}, Amount: {}", caller, from_principal, arg.to.owner, amount);

    // Check if caller is allowed
    ALLOWANCES.with(|a| {
        let mut allowances = a.borrow_mut();
        let key = (from_principal, caller);
        let allowance = allowances.get(&key).copied().unwrap_or(0);

        println!("[ALLOWANCE] For {:?} -> {:?} = {}", from_principal, caller, allowance);

        if caller != from_principal && allowance < amount {
            return Err("❌ Not enough allowance".into());
        }

        if caller != from_principal {
            allowances.insert(key, allowance.saturating_sub(amount));
        }

        Ok::<(), String>(())
    })?;

    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();
        let sender_balance = balances.entry(from_key).or_insert(0);

        if *sender_balance < amount {
            return Err("❌ Insufficient funds".into());
        }

        *sender_balance -= amount;
        let recipient_balance = balances.entry(to_key).or_insert(0);
        *recipient_balance += amount;

        Ok(amount)
    })
}

// Removed icrc1_approve update method completely

#[query]
fn icrc1_balance_of(account: Account) -> Tokens {
    let key = get_account_key(account.owner, account.subaccount);
    BALANCES.with(|b| {
        let balances = b.borrow();
        *balances.get(&key).unwrap_or(&0)
    })
}

#[query]
fn allowance(owner: Principal, spender: Principal) -> Tokens {
    ALLOWANCES.with(|a| {
        *a.borrow().get(&(owner, spender)).unwrap_or(&0)
    })
}

#[update]
fn mint(to: Principal, amount: Tokens) {
    let key = get_account_key(to, None);
    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();
        let entry = balances.entry(key).or_insert(0);
        *entry += amount;
        println!("[MINT] {} received {} tokens", to, amount);
    });
}
