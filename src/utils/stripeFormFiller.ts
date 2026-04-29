import { VirtualCard } from './cardGenerator';

/**
 * Stripeform填充managerclass
 */
export class StripeFormFiller {
  private card: VirtualCard;

  constructor(card: VirtualCard) {
    this.card = card;
  }

  /**
   * start填充form
   */
  async fillForm(): Promise<void> {
    console.log('startautofill inStripepaymentform...');
    
    // waitPageLoading
    await this.waitForPageLoad();
    
    // fill in各field
    await this.fillCardNumber();
    await this.fillExpiry();
    await this.fillCVC();
    await this.fillBillingInfo();
    
    console.log('formfill inDone！');
  }

  /**
   * waitPageLoadingDone
   */
  private async waitForPageLoad(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        setTimeout(resolve, 1000); // extrawait1secondsensureformrenderDone
      } else {
        window.addEventListener('load', () => {
          setTimeout(resolve, 1000);
        });
      }
    });
  }

  /**
   * waitelementappear
   */
  private async waitForElement(selector: string, timeout: number = 10000): Promise<Element | null> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkElement = () => {
        const element = document.querySelector(selector);
        
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          console.warn(`element ${selector} notfind，timeout`);
          resolve(null);
        } else {
          setTimeout(checkElement, 100);
        }
      };
      
      checkElement();
    });
  }

  /**
   * 模拟Userinput
   */
  private simulateInput(element: HTMLInputElement, value: string): void {
    // 聚焦element
    element.focus();
    
    // Clearnowhasvalue
    element.value = '';
    
    // eachcharacterinputto模拟真实Userrowas
    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      element.value += char;
      
      // trigger各种event
      const keydownEvent = new KeyboardEvent('keydown', {
        key: char,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(keydownEvent);
      
      const inputEvent = new InputEvent('input', {
        data: char,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(inputEvent);
      
      const keyupEvent = new KeyboardEvent('keyup', {
        key: char,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(keyupEvent);
    }
    
    // triggerchange and blurevent
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  /**
   * fill inCard Number
   */
  private async fillCardNumber(): Promise<void> {
    const element = await this.waitForElement('#cardNumber') as HTMLInputElement;
    if (element) {
      // removespace，Stripeformwillautoformat
      const cardNumber = this.card.card_number.replace(/\s/g, '');
      this.simulateInput(element, cardNumber);
      console.log('✓ FilledCard Number');
    }
  }

  /**
   * fill inExpiry
   */
  private async fillExpiry(): Promise<void> {
    const element = await this.waitForElement('#cardExpiry') as HTMLInputElement;
    if (element) {
      this.simulateInput(element, this.card.expiry_date);
      console.log('✓ FilledExpiry');
    }
  }

  /**
   * fill inCVC
   */
  private async fillCVC(): Promise<void> {
    const element = await this.waitForElement('#cardCvc') as HTMLInputElement;
    if (element) {
      this.simulateInput(element, this.card.cvv);
      console.log('✓ FilledCVC');
    }
  }

  /**
   * fill inaccountsingleInfo
   */
  private async fillBillingInfo(): Promise<void> {
    // fill incardholderName
    const nameElement = await this.waitForElement('#billingName') as HTMLInputElement;
    if (nameElement) {
      this.simulateInput(nameElement, this.card.cardholder_name);
      console.log('✓ FilledcardholderName');
    }
    
    // select国家（beautiful国）
    const countryElement = await this.waitForElement('#billingCountry') as HTMLSelectElement;
    if (countryElement) {
      countryElement.value = this.card.billing_address.country;
      countryElement.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('✓ Selected国家');
      
      // wait州optionLoading
      await this.delay(500);
      
      // Select State
      const stateElement = await this.waitForElement('#billingAdministrativeArea') as HTMLSelectElement;
      if (stateElement) {
        // findmatch州option
        const options = Array.from(stateElement.options);
        const matchingOption = options.find(opt => 
          opt.value === this.card.billing_address.state || 
          opt.text.includes(this.card.billing_address.state)
        );
        
        if (matchingOption) {
          stateElement.value = matchingOption.value;
          stateElement.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('✓ already Select State');
        }
      }
    }
    
    // fill in邮编
    const postalElement = await this.waitForElement('#billingPostalCode') as HTMLInputElement;
    if (postalElement) {
      this.simulateInput(postalElement, this.card.billing_address.postal_code);
      console.log('✓ Filled邮编');
    }
    
    // fill inCity
    const cityElement = await this.waitForElement('#billingLocality') as HTMLInputElement;
    if (cityElement) {
      this.simulateInput(cityElement, this.card.billing_address.city);
      console.log('✓ FilledCity');
    }
    
    // fill inAddress
    const addressElement = await this.waitForElement('#billingAddressLine1') as HTMLInputElement;
    if (addressElement) {
      this.simulateInput(addressElement, this.card.billing_address.street_address);
      console.log('✓ FilledAddress');
    }
  }

  /**
   * delayfunctioncount
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 高亮Submitbutton（Optional）
   */
  async highlightSubmitButton(): Promise<void> {
    const submitButton = await this.waitForElement('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      // Add脉冲animation效果
      submitButton.style.animation = 'pulse 2s infinite';
      
      // AddCSSanimation
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(99, 217, 203, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(99, 217, 203, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 217, 203, 0); }
        }
      `;
      document.head.appendChild(style);
      
      console.log('✨ formalready prepareready，cantoclickSubmitbutton');
    }
  }

  /**
   * waitSubmitbuttonchangeascanclickStatus
   */
  private async waitForSubmitButtonReady(timeout: number = 30000): Promise<HTMLButtonElement | null> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkButton = () => {
        // findSubmitbutton
        const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        
        if (submitButton) {
          // checkbuttonwhethercontains complete class name
          const isComplete = submitButton.classList.contains('SubmitButton--complete');
          // checkbuttontextwhether it is"starttrial"
          const buttonText = submitButton.querySelector('.SubmitButton-Text--current')?.textContent;
          const isstartTrial = buttonText?.includes('starttrial') || buttonText?.includes('start trial');
          
          if (isComplete && isstartTrial && !submitButton.disabled) {
            console.log('✅ Submitbuttonalready ready：', buttonText);
            resolve(submitButton);
            return;
          } else if (isComplete && !submitButton.disabled) {
            // ifbuttonalready throughiscompleteStatusbuttextnotsame，alsocantoclick
            console.log('✅ Submitbuttonalready ready（completeStatus）');
            resolve(submitButton);
            return;
          } else {
            // 输outCurrentStatusused forcalltry
            if (!isComplete) {
              console.log('⏳ waitbuttonchangeascanclickStatus...');
            }
          }
        }
        
        // check iftimeout
        if (Date.now() - startTime > timeout) {
          console.error('❌ waitSubmitbuttontimeout');
          resolve(null);
        } else {
          setTimeout(checkButton, 500);
        }
      };
      
      checkButton();
    });
  }

  /**
   * autoSubmitform（carefuluse）
   */
  async autoSubmit(delay: number = 3000): Promise<void> {
    console.log(`will be ${delay/1000} secondsaftercheckSubmitbutton...`);
    await this.delay(delay);
    
    console.log('🔍 currentlywaitSubmitbuttonchangeascanclickStatus...');
    const submitButton = await this.waitForSubmitButtonReady();
    
    if (submitButton) {
      // scrolltobuttonset
      submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.delay(500);
      
      // clickSubmitbutton
      submitButton.click();
      console.log('✅ already autoclickSubmitbutton');
      
      // againtimeclicktoensureSubmit（haswhenneed）
      setTimeout(() => {
        if (submitButton && !submitButton.disabled) {
          submitButton.click();
          console.log('✅ againtimeConfirmclickSubmitbutton');
        }
      }, 1000);
    } else {
      console.error('❌ notfindcanuseSubmitbutton or waittimeout');
    }
  }
}

/**
 * create and executeform填充manager
 */
export async function autoFillStripeForm(card: VirtualCard, autoSubmit: boolean = false): Promise<void> {
  try {
    const filler = new StripeFormFiller(card);
    await filler.fillForm();
    await filler.highlightSubmitButton();
    
    if (autoSubmit) {
      await filler.autoSubmit();
    }
  } catch (error) {
    console.error('auto fill formfailed:', error);
  }
}

/**
 * check ifinStripepaymentPage
 */
export function isStripePaymentPage(): boolean {
  const url = window.location.href;
  return url.includes('checkout.stripe.com') || url.includes('stripe.com');
}
