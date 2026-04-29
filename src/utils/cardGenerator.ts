import { invoke } from '@tauri-apps/api/core';

export interface VirtualCard {
  card_number: string;
  expiry_date: string;
  cvv: string;
  cardholder_name: string;
  billing_address: BillingAddress;
}

export interface BillingAddress {
  street_address: string;
  street_address_line2: string;  // Address#二row
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

/**
 * generate虚拟Credit CardInfo
 */
export async function generateVirtualCard(): Promise<VirtualCard> {
  return await invoke<VirtualCard>('generate_virtual_card');
}

/**
 * VerifyCard Numberwhether符合Luhnalgorithm
 */
export async function validateCardNumber(cardNumber: string): Promise<boolean> {
  return await invoke<boolean>('validate_card_number', { cardNumber });
}

/**
 * fetchtrialpaymentlink（enhanceversion）
 */
export async function getTrialPaymentLink(
  accountName: string,
  token: string,
  autoOpen: boolean,
  teamsTier: number,
  paymentPeriod: number,
  startTrial: boolean,
  teamName?: string,
  seatCount?: number,
  turnstileToken?: string
): Promise<any> {
  return await invoke('get_trial_payment_link_enhanced', {
    accountName,
    token,
    autoOpen,
    teamsTier,
    paymentPeriod,
    startTrial,
    teamName,
    seatCount,
    turnstileToken
  });
}

/**
 * openpaymentwindow
 */
export async function openPaymentWindow(
  url: string,
  accountName: string
): Promise<void> {
  return await invoke('open_payment_window', {
    url,
    accountName
  });
}

/**
 * autofill inpaymentform
 */
export async function autoFillPaymentForm(
  windowLabel: string,
  virtualCard?: VirtualCard
): Promise<void> {
  return await invoke('auto_fill_payment_form', {
    windowLabel,
    virtualCard
  });
}

/**
 * injectcardInfotospecifywindow
 */
export async function injectCardInfo(
  windowLabel: string,
  cardInfo: VirtualCard
): Promise<void> {
  return await invoke('inject_card_info', {
    windowLabel,
    cardInfo
  });
}
