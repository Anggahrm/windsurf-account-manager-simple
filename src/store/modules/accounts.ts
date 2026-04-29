import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Account, AccountFilter, PaginationConfig, AccountStatusType, SortConfig, SortField, SortDirection } from '@/types';
import { accountApi, apiService, settingsApi } from '@/api';
import dayjs from 'dayjs';

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([]);
  const selectedAccounts = ref<Set<string>>(new Set());
  const currentFilter = ref<AccountFilter>({});
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Batch Updatequeue（used foroptimallarge量AccountUpdatewhenpropertycan）
  const pendingUpdates = ref<Map<string, Account>>(new Map());
  let batchUpdateTimer: ReturnType<typeof setTimeout> | null = null;

  // Pagination status
  const pagination = ref<PaginationConfig>({
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100]
  });

  // sort config
  const sortConfig = ref<SortConfig>({
    field: 'created_at',
    direction: 'asc'
  });

  // helper functioncount：calculateRemaining Quota
  function getRemainingQuota(account: Account): number {
    if (!account.total_quota || account.used_quota === undefined) return 0;
    return Math.max(0, account.total_quota - account.used_quota);
  }

  // helper functioncount：calculateDays Remaining
  function getDaysUntilExpiry(account: Account): number | null {
    if (!account.subscription_expires_at) return null;
    const now = dayjs();
    const expiry = dayjs(account.subscription_expires_at);
    return expiry.diff(now, 'day');
  }

  // helper functioncount：check if it is paid plan
  function isPaidPlan(account: Account): boolean {
    const planName = account.plan_name?.toLowerCase();
    return !!planName && planName !== 'free';
  }

  // helper functioncount：fetchAccountStatustype
  function getAccountStatusType(account: Account): AccountStatusType {
    // ErrorStatus（PasswordErroretc.）
    if (account.status === 'error' || (typeof account.status === 'object' && 'error' in account.status)) {
      return 'error';
    }
    // Inactive（paidplanandSubscription inactive）- prioritylevelhigher thanDisabled
    if (isPaidPlan(account) && account.subscription_active === false) {
      return 'inactive';
    }
    // Disabled（Disabled by Windsurf）
    if (account.is_disabled === true) {
      return 'disabled';
    }
    // Offline（Token invalid）
    if (!account.token_expires_at || dayjs(account.token_expires_at).isBefore(dayjs())) {
      return 'offline';
    }
    // Normal
    return 'normal';
  }

  // fetchalluniqueTags
  const allTags = computed(() => {
    const tagSet = new Set<string>();
    accounts.value.forEach(acc => {
      acc.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  });

  // fetchalluniquePlanName
  const allPlanNames = computed(() => {
    const planSet = new Set<string>();
    accounts.value.forEach(acc => {
      if (acc.plan_name) planSet.add(acc.plan_name);
    });
    return Array.from(planSet).sort();
  });

  // fetchalluniqueDomain
  const allDomains = computed(() => {
    const domainSet = new Set<string>();
    accounts.value.forEach(acc => {
      const domain = acc.email.split('@')[1];
      if (domain) domainSet.add(domain);
    });
    return Array.from(domainSet).sort();
  });

  // Computed
  const filteredAccounts = computed(() => {
    let result = [...accounts.value];
    
    // byGroupfilter
    if (currentFilter.value.group) {
      result = result.filter(acc => acc.group === currentFilter.value.group);
    }
    
    // byTagsfilter
    if (currentFilter.value.tags && currentFilter.value.tags.length > 0) {
      result = result.filter(acc => 
        currentFilter.value.tags!.some(tag => acc.tags.includes(tag))
      );
    }
    
    // Search
    if (currentFilter.value.search) {
      const query = currentFilter.value.search.toLowerCase();
      result = result.filter(acc => 
        acc.email.toLowerCase().includes(query) ||
        acc.nickname.toLowerCase().includes(query) ||
        acc.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Advanced Filter：Remaining Quotarange（Userinputisdisplayvalue，need*100convert toactualvalue）
    if (currentFilter.value.remainingQuotaMin !== undefined) {
      const minValue = currentFilter.value.remainingQuotaMin * 100;
      result = result.filter(acc => getRemainingQuota(acc) >= minValue);
    }
    if (currentFilter.value.remainingQuotaMax !== undefined) {
      const maxValue = currentFilter.value.remainingQuotaMax * 100;
      result = result.filter(acc => getRemainingQuota(acc) <= maxValue);
    }

    // Advanced Filter：Total Quotarange（Userinputisdisplayvalue，need*100convert toactualvalue）
    if (currentFilter.value.totalQuotaMin !== undefined) {
      const minValue = currentFilter.value.totalQuotaMin * 100;
      result = result.filter(acc => (acc.total_quota || 0) >= minValue);
    }
    if (currentFilter.value.totalQuotaMax !== undefined) {
      const maxValue = currentFilter.value.totalQuotaMax * 100;
      result = result.filter(acc => (acc.total_quota || 0) <= maxValue);
    }

    // Advanced Filter：Days Remainingrange
    if (currentFilter.value.expiryDaysMin !== undefined) {
      result = result.filter(acc => {
        const days = getDaysUntilExpiry(acc);
        return days !== null && days >= currentFilter.value.expiryDaysMin!;
      });
    }
    if (currentFilter.value.expiryDaysMax !== undefined) {
      result = result.filter(acc => {
        const days = getDaysUntilExpiry(acc);
        return days !== null && days <= currentFilter.value.expiryDaysMax!;
      });
    }

    // Advanced Filter：Daily Quota Remainingpercentagerange（only  QUOTA Billing StrategyAccountparticipate；field缺失i.e.exclude）
    if (currentFilter.value.dailyQuotaPercentMin !== undefined) {
      result = result.filter(acc => {
        const pct = acc.daily_quota_remaining_percent;
        return pct !== undefined && pct !== null && pct >= currentFilter.value.dailyQuotaPercentMin!;
      });
    }
    if (currentFilter.value.dailyQuotaPercentMax !== undefined) {
      result = result.filter(acc => {
        const pct = acc.daily_quota_remaining_percent;
        return pct !== undefined && pct !== null && pct <= currentFilter.value.dailyQuotaPercentMax!;
      });
    }

    // Advanced Filter：Weekly Quota Remainingpercentagerange（only  QUOTA Billing StrategyAccountparticipate；field缺失i.e.exclude）
    if (currentFilter.value.weeklyQuotaPercentMin !== undefined) {
      result = result.filter(acc => {
        const pct = acc.weekly_quota_remaining_percent;
        return pct !== undefined && pct !== null && pct >= currentFilter.value.weeklyQuotaPercentMin!;
      });
    }
    if (currentFilter.value.weeklyQuotaPercentMax !== undefined) {
      result = result.filter(acc => {
        const pct = acc.weekly_quota_remaining_percent;
        return pct !== undefined && pct !== null && pct <= currentFilter.value.weeklyQuotaPercentMax!;
      });
    }

    // Advanced Filter：PlanName
    if (currentFilter.value.planNames && currentFilter.value.planNames.length > 0) {
      result = result.filter(acc => 
        acc.plan_name && currentFilter.value.planNames!.includes(acc.plan_name)
      );
    }

    // Advanced Filter：Domain
    if (currentFilter.value.domains && currentFilter.value.domains.length > 0) {
      result = result.filter(acc => {
        const domain = acc.email.split('@')[1];
        return domain && currentFilter.value.domains!.includes(domain);
      });
    }

    // Advanced Filter：Status
    if (currentFilter.value.statuses && currentFilter.value.statuses.length > 0) {
      result = result.filter(acc => 
        currentFilter.value.statuses!.includes(getAccountStatusType(acc))
      );
    }
    
    return result;
  });

  // PaginationafterAccountList
  const paginatedAccounts = computed(() => {
    const start = (pagination.value.currentPage - 1) * pagination.value.pageSize;
    const end = start + pagination.value.pageSize;
    return filteredAccounts.value.slice(start, end);
  });

  // Totalpagecount
  const totalPages = computed(() => {
    return Math.ceil(filteredAccounts.value.length / pagination.value.pageSize);
  });

  // Totalrecordcount
  const totalCount = computed(() => filteredAccounts.value.length);

  const selectedAccountsList = computed(() => {
    return accounts.value.filter(acc => selectedAccounts.value.has(acc.id));
  });

  const activeAccountsCount = computed(() => {
    return accounts.value.filter(acc => acc.status === 'active').length;
  });

  // Actions
  async function loadAccounts() {
    loading.value = true;
    error.value = null;
    try {
      accounts.value = await accountApi.getAllAccounts();
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function addAccount(data: {
    email: string;
    password: string;
    nickname: string;
    tags: string[];
    group?: string;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const account = await accountApi.addAccount(data);
      accounts.value.push(account);
      return account;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateAccount(account: Account) {
    // single accountsUpdatenottriggergloballoading，avoidPage闪烁
    error.value = null;
    try {
      await accountApi.updateAccount(account);
      const index = accounts.value.findIndex(a => a.id === account.id);
      if (index !== -1) {
        // usespliceensuretriggerresponsiveUpdate
        accounts.value.splice(index, 1, account);
      }
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    }
  }

  /**
   * willAccountjoinBatch Updatequeue（notimmediatelytriggerUIUpdate）
   * used forlarge量AccountRefreshwhenpropertycanoptimal
   */
  function queueAccountUpdate(account: Account) {
    pendingUpdates.value.set(account.id, account);
    
    // usedebounce，300msinsideUpdatemergeasonce
    if (batchUpdateTimer) {
      clearTimeout(batchUpdateTimer);
    }
    batchUpdateTimer = setTimeout(() => {
      flushPendingUpdates();
    }, 300);
  }

  /**
   * immediatelyapplyallwaitUpdateAccount（oncepropertyUpdateUI）
   */
  async function flushPendingUpdates() {
    if (pendingUpdates.value.size === 0) return;
    
    const updates = Array.from(pendingUpdates.value.values());
    console.log(`[Batch Update] oncepropertyUpdate ${updates.length}  accountstoUI`);
    
    // Clearqueue
    pendingUpdates.value.clear();
    if (batchUpdateTimer) {
      clearTimeout(batchUpdateTimer);
      batchUpdateTimer = null;
    }
    
    // buildIDtoUpdatedatamapping
    const updateMap = new Map(updates.map(acc => [acc.id, acc]));
    
    // oncepropertyUpdateallAccount（onlytriggeronceresponsiveUpdate）
    accounts.value = accounts.value.map(acc => {
      const updated = updateMap.get(acc.id);
      return updated || acc;
    });
    
    // batchSavetobackend（use Promise.all butnotwait）
    // 这infirstUpdateUI，after台异stepSave
    Promise.all(updates.map(acc => accountApi.updateAccount(acc).catch(e => {
      console.error(`[Batch Update] SaveAccount ${acc.email} failed:`, e);
    })));
  }

  async function deleteAccount(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await accountApi.deleteAccount(id);
      accounts.value = accounts.value.filter(a => a.id !== id);
      selectedAccounts.value.delete(id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deleteSelectedAccounts() {
    if (selectedAccounts.value.size === 0) return;
    
    loading.value = true;
    error.value = null;
    try {
      const ids = Array.from(selectedAccounts.value);
      const result = await accountApi.deleteAccountsBatch(ids);
      
      // removeSuccessfully deletedAccount
      accounts.value = accounts.value.filter(a => !ids.includes(a.id) || result.failed_ids.includes(a.id));
      
      // ClearselectedStatus
      selectedAccounts.value.clear();
      
      return result;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function toggleAccountSelection(id: string) {
    if (selectedAccounts.value.has(id)) {
      selectedAccounts.value.delete(id);
    } else {
      selectedAccounts.value.add(id);
    }
  }

  function selectAll() {
    filteredAccounts.value.forEach(acc => {
      selectedAccounts.value.add(acc.id);
    });
  }

  function clearSelection() {
    selectedAccounts.value.clear();
  }

  function setFilter(filter: AccountFilter) {
    currentFilter.value = filter;
    // Resetto#onepage
    pagination.value.currentPage = 1;
  }

  function clearFilter() {
    currentFilter.value = {};
    // Resetto#onepage
    pagination.value.currentPage = 1;
  }

  // PaginationOperation
  function setCurrentPage(page: number) {
    pagination.value.currentPage = page;
  }

  function setPageSize(size: number) {
    pagination.value.pageSize = size;
    pagination.value.currentPage = 1; // Resetto#onepage
  }

  // Auto RefreshTokenFeature
  const autoRefreshTimerId = ref<number | null>(null);
  const refreshingAccounts = ref<Set<string>>(new Set()); // 跟踪RefreshingAccount

  /**
   * checkTokenwhetherExpired or Expiring soon（5minutesinside）
   */
  function isTokenExpiredOrExpiring(account: Account): boolean {
    if (!account.token_expires_at) return true;
    
    const expiresAt = dayjs(account.token_expires_at);
    const now = dayjs();
    const fiveMinutesLater = now.add(5, 'minute');
    
    // TokenExpired or will5minutesinsideExpired
    return expiresAt.isBefore(fiveMinutesLater);
  }

  /**
   * fetchneedRefreshTokenAccountList
   */
  function getAccountsNeedingRefresh(): Account[] {
    return accounts.value.filter(account => {
      // skipStatusas inactive  or  error Account
      if (account.status === 'inactive' || account.status === 'error') {
        return false;
      }
      
      // skipRefreshingAccount
      if (refreshingAccounts.value.has(account.id)) {
        return false;
      }
      
      // checkTokenwhetherneedRefresh
      return isTokenExpiredOrExpiring(account);
    });
  }

  /**
   * Refreshsingle accountsToken
   * @param useBatchUpdate whetheruseBatch Update（large量Refreshwhensetastrue提uppropertycan）
   */
  async function refreshAccountToken(account: Account, useBatchUpdate: boolean = false): Promise<{ success: boolean; error?: string }> {
    // markasRefreshing
    refreshingAccounts.value.add(account.id);
    
    try {
      const result = await apiService.refreshToken(account.id);
      
      if (result.success) {
        // Update account info
        const updatedAccount = { ...account, status: 'active' as const };
        
        // Updatenew token
        if (result.token) {
          updatedAccount.token = result.token;
        }
        if (result.expires_at) {
          updatedAccount.token_expires_at = result.expires_at;
        }
        if (result.plan_name) {
          updatedAccount.plan_name = result.plan_name;
        }
        if (result.used_quota !== undefined) {
          updatedAccount.used_quota = result.used_quota;
        }
        if (result.total_quota !== undefined) {
          updatedAccount.total_quota = result.total_quota;
        }
        if (result.subscription_expires_at) {
          updatedAccount.subscription_expires_at = result.subscription_expires_at;
        }
        // UpdateAccountDisableStatus
        if (result.is_disabled !== undefined) {
          updatedAccount.is_disabled = result.is_disabled;
        }
        // UpdateTeamall者Status
        if (result.is_team_owner !== undefined) {
          updatedAccount.is_team_owner = result.is_team_owner;
        }
        // UpdateQuotapercentagefield
        if (result.billing_strategy !== undefined) {
          updatedAccount.billing_strategy = result.billing_strategy;
        }
        if (result.daily_quota_remaining_percent !== undefined) {
          updatedAccount.daily_quota_remaining_percent = result.daily_quota_remaining_percent;
        }
        if (result.weekly_quota_remaining_percent !== undefined) {
          updatedAccount.weekly_quota_remaining_percent = result.weekly_quota_remaining_percent;
        }
        if (result.daily_quota_reset_at_unix !== undefined) {
          updatedAccount.daily_quota_reset_at_unix = result.daily_quota_reset_at_unix;
        }
        if (result.weekly_quota_reset_at_unix !== undefined) {
          updatedAccount.weekly_quota_reset_at_unix = result.weekly_quota_reset_at_unix;
        }
        if (result.overage_balance_micros !== undefined) {
          updatedAccount.overage_balance_micros = result.overage_balance_micros;
        }
        updatedAccount.last_quota_update = dayjs().toISOString();
        
        // based onModeselectUpdatemethod
        if (useBatchUpdate) {
          // batchMode：joinqueue，lateroncepropertyUpdateUI
          queueAccountUpdate(updatedAccount);
        } else {
          // singleMode：immediatelyUpdate
          await updateAccount(updatedAccount);
        }
        
        console.log(`[Auto Refresh] ${account.email} TokenRefreshsuccessful`);
        return { success: true };
      } else {
        // Refresh failed，UpdateAccountStatusaserror
        const updatedAccount = { ...account, status: 'error' as const };
        if (useBatchUpdate) {
          queueAccountUpdate(updatedAccount);
        } else {
          await updateAccount(updatedAccount);
        }
        
        console.error(`[Auto Refresh] ${account.email} TokenRefresh failed`);
        return { success: false, error: 'TokenRefresh failed' };
      }
    } catch (error) {
      // Refresh failed，UpdateAccountStatusaserror
      const updatedAccount = { ...account, status: 'error' as const };
      if (useBatchUpdate) {
        queueAccountUpdate(updatedAccount);
      } else {
        await updateAccount(updatedAccount);
      }
      
      console.error(`[Auto Refresh] ${account.email} TokenRefreshexception:`, error);
      return { success: false, error: String(error) };
    } finally {
      // removeRefreshingmark
      refreshingAccounts.value.delete(account.id);
    }
  }

  /**
   * Batch refreshToken（useoptimalbatch API，backend onlySaveonce）
   */
  async function batchRefreshTokens(accountsToRefresh?: Account[], _concurrentLimit: number = 3): Promise<{
    total: number;
    success: number;
    failed: number;
    results: Array<{ id: string; email: string; success: boolean; error?: string }>;
  }> {
    const targetAccounts = accountsToRefresh || getAccountsNeedingRefresh();
    
    if (targetAccounts.length === 0) {
      return { total: 0, success: 0, failed: 0, results: [] };
    }
    
    console.log(`[Auto Refresh] startBatch refresh ${targetAccounts.length}  accountsToken（useoptimalAPI）`);
    
    // markallAccountasRefreshing
    targetAccounts.forEach(a => refreshingAccounts.value.add(a.id));
    
    try {
      // useoptimalBatch refresh API（backend onlySaveonce）
      const ids = targetAccounts.map(a => a.id);
      const apiResult = await apiService.batchRefreshTokens(ids);
      
      const results: Array<{ id: string; email: string; success: boolean; error?: string }> = [];
      
      // handleresult，directlyuseBackdataUpdatelocal store
      if (apiResult.results) {
        for (const item of apiResult.results) {
          const idx = accounts.value.findIndex(a => a.id === item.id);
          if (idx === -1) continue;
          
          const account = targetAccounts.find(a => a.id === item.id);
          if (!account) continue;
          
          if (item.success && item.data) {
            // usebackendBackcompletedataUpdatelocal store
            // use splice 替换wholeforobjecttoensuretrigger Vue responsiveUpdate
            const updatedAcc = { ...accounts.value[idx] };
            if (item.data.plan_name) updatedAcc.plan_name = item.data.plan_name;
            if (item.data.used_quota !== undefined) updatedAcc.used_quota = item.data.used_quota;
            if (item.data.total_quota !== undefined) updatedAcc.total_quota = item.data.total_quota;
            if (item.data.expires_at) updatedAcc.token_expires_at = item.data.expires_at;
            if (item.data.windsurf_api_key) updatedAcc.windsurf_api_key = item.data.windsurf_api_key;
            if (item.data.is_disabled !== undefined) updatedAcc.is_disabled = item.data.is_disabled;
            if (item.data.is_team_owner !== undefined) updatedAcc.is_team_owner = item.data.is_team_owner;
            if (item.data.subscription_active !== undefined) updatedAcc.subscription_active = item.data.subscription_active;
            if (item.data.subscription_expires_at) updatedAcc.subscription_expires_at = dayjs.unix(item.data.subscription_expires_at).toISOString();
            if (item.data.last_quota_update) updatedAcc.last_quota_update = item.data.last_quota_update;
            updatedAcc.status = 'active';
            accounts.value.splice(idx, 1, updatedAcc);
            
            results.push({ id: account.id, email: account.email, success: true });
          } else {
            // Refresh failed，use splice ensureresponsiveUpdate
            const failedAcc = { ...accounts.value[idx], status: 'error' as const };
            accounts.value.splice(idx, 1, failedAcc);
            results.push({ id: account.id, email: account.email, success: false, error: item.error });
          }
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      
      console.log(`[Auto Refresh] Batch refreshDone: successful ${successCount}/${targetAccounts.length}, failed ${failedCount}`);
      
      return {
        total: targetAccounts.length,
        success: successCount,
        failed: failedCount,
        results
      };
    } finally {
      // removeRefreshingmark
      targetAccounts.forEach(a => refreshingAccounts.value.delete(a.id));
    }
  }

  /**
   * check and Auto RefreshExpiredToken（供externalcall）
   */
  async function checkAndRefreshExpiredTokens(settingsStore?: any): Promise<void> {
    // check ifenabledAuto Refresh
    if (settingsStore && !settingsStore.settings.auto_refresh_token) {
      return;
    }
    
    const accountsToRefresh = getAccountsNeedingRefresh();
    
    if (accountsToRefresh.length === 0) {
      return;
    }
    
    console.log(`[Auto Refresh] Detected ${accountsToRefresh.length}  accountsneedRefreshToken`);
    
    // fetchconcurrentlimit
    // ifenabledfull concurrentRefresh，thennotlimitconcurrentcount（useAccountCountmakeasconcurrentcount）
    const unlimitedConcurrent = settingsStore?.settings.unlimitedConcurrentRefresh;
    const concurrentLimit = unlimitedConcurrent 
      ? accountsToRefresh.length 
      : (settingsStore?.settings.concurrent_limit || 3);
    
    if (unlimitedConcurrent) {
      console.log(`[Auto Refresh] full concurrentMode，samewhenRefresh ${accountsToRefresh.length}  accounts`);
    }
    
    await batchRefreshTokens(accountsToRefresh, concurrentLimit);
  }

  /**
   * launch定whenround询（every10minutescheckonce）
   */
  function startAutoRefreshTimer(settingsStore?: any) {
    // firstClearoldtimer
    stopAutoRefreshTimer();
    
    // check ifenabledAuto Refresh
    if (settingsStore && !settingsStore.settings.auto_refresh_token) {
      console.log('[Auto Refresh] Auto RefreshTokenFeaturealready disabled');
      return;
    }
    
    console.log('[Auto Refresh] launch定whenround询，间陔10minutes');
    
    // immediatelyexecuteoncecheck
    checkAndRefreshExpiredTokens(settingsStore);
    
    // Settingstimer，every10minutesexecuteonce
    autoRefreshTimerId.value = window.setInterval(() => {
      checkAndRefreshExpiredTokens(settingsStore);
    }, 10 * 60 * 1000); // 10minutes
  }

  /**
   * Stop定whenround询
   */
  function stopAutoRefreshTimer() {
    if (autoRefreshTimerId.value !== null) {
      clearInterval(autoRefreshTimerId.value);
      autoRefreshTimerId.value = null;
      console.log('[Auto Refresh] 定whenround询already Stop');
    }
  }

  // ==================== sortFeature ====================

  /**
   * Loadingsort config
   */
  async function loadSortConfig() {
    try {
      const config = await settingsApi.getSortConfig();
      sortConfig.value = config;
    } catch (e) {
      console.error('Loadingsort configfailed:', e);
    }
  }

  /**
   * Updatesort config and re-sort
   */
  async function setSortConfig(field: SortField, direction: SortDirection) {
    sortConfig.value = { field, direction };
    try {
      await settingsApi.updateSortConfig(sortConfig.value);
      await applySorting();
    } catch (e) {
      console.error('Updatesort configfailed:', e);
    }
  }

  /**
   * applyCurrentsort config
   */
  async function applySorting() {
    try {
      const sortedAccounts = await settingsApi.getSortedAccounts(
        sortConfig.value.field,
        sortConfig.value.direction
      );
      accounts.value = sortedAccounts;
    } catch (e) {
      console.error('applysortfailed:', e);
    }
  }

  /**
   * UpdateAccountorder（used forDrag to reorder）
   */
  async function updateAccountsOrder(accountIds: string[]) {
    try {
      await settingsApi.updateAccountsOrder(accountIds);
      // Updatelocalorder
      const newAccounts: Account[] = [];
      for (const id of accountIds) {
        const account = accounts.value.find(a => a.id === id);
        if (account) {
          newAccounts.push(account);
        }
      }
      // AddnotinListinAccount（ifhas话）
      for (const account of accounts.value) {
        if (!accountIds.includes(account.id)) {
          newAccounts.push(account);
        }
      }
      accounts.value = newAccounts;
    } catch (e) {
      console.error('UpdateAccountorderfailed:', e);
      throw e;
    }
  }

  return {
    // State
    accounts,
    selectedAccounts,
    currentFilter,
    loading,
    error,
    pagination,
    sortConfig,
    
    // Computed
    filteredAccounts,
    paginatedAccounts,
    selectedAccountsList,
    activeAccountsCount,
    totalPages,
    totalCount,
    allTags,
    allPlanNames,
    allDomains,
    
    // Actions
    loadAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    deleteSelectedAccounts,
    toggleAccountSelection,
    selectAll,
    clearSelection,
    setFilter,
    clearFilter,
    setCurrentPage,
    setPageSize,
    
    // helper functioncount
    getRemainingQuota,
    getDaysUntilExpiry,
    
    // Auto RefreshToken
    isTokenExpiredOrExpiring,
    getAccountsNeedingRefresh,
    refreshAccountToken,
    batchRefreshTokens,
    checkAndRefreshExpiredTokens,
    startAutoRefreshTimer,
    stopAutoRefreshTimer,
    
    // Batch Updateoptimal
    flushPendingUpdates,
    
    // sortFeature
    loadSortConfig,
    setSortConfig,
    applySorting,
    updateAccountsOrder,
  };
});
