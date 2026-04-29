<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { useAccountsStore, useSettingsStore, useUIStore } from './store';
import MainLayout from './views/MainLayout.vue';
// import WelcomeDialog from './components/WelcomeDialog.vue';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

const accountsStore = useAccountsStore();
const settingsStore = useSettingsStore();
const uiStore = useUIStore();

// const showWelcomeDialog = ref(true);

// eventlistenCancelfunctioncount
let tokenRefreshedUnlisten: UnlistenFn | null = null;

// used forElement Plusnamednamespace，supportDark Mode
const elNamespace = computed(() => 'el');

// Disableright click menusingle
const disableContextMenu = (e: MouseEvent) => {
  e.preventDefault();
  return false;
};

// Disablecalltry shortcut
const disableDebugKeys = (e: KeyboardEvent) => {
  // DisableF12
  if (e.key === 'F12') {
    e.preventDefault();
    return false;
  }
  
  // DisableCtrl+Shift+I (developertool)
  if (e.ctrlKey && e.shiftKey && e.key === 'I') {
    e.preventDefault();
    return false;
  }
  
  // DisableCtrl+Shift+J (控制台)
  if (e.ctrlKey && e.shiftKey && e.key === 'J') {
    e.preventDefault();
    return false;
  }
  
  // DisableCtrl+Shift+C (reviewelement)
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    return false;
  }
  
  // DisableCtrl+U (View源codecode)
  if (e.ctrlKey && e.key === 'u') {
    e.preventDefault();
    return false;
  }
  
  // DisableCtrl+S (SavePage)
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    return false;
  }
  
  return true;
};

onMounted(async () => {
  // Disableright click menusingle
  document.addEventListener('contextmenu', disableContextMenu);
  
  // Disablecalltry shortcut
  document.addEventListener('keydown', disableDebugKeys);
  
  // fetch and Settingsapplytitle（containsVersion）
  try {
    const title = await invoke<string>('get_app_title');
    document.title = title;
  } catch (error) {
    console.error('Failed to get app title:', error);
  }
  
  // initializeapplydata
  await Promise.all([
    accountsStore.loadAccounts(),
    settingsStore.initialize()
  ]);
  
  // ifSettingsinhasprimarytopicandandCurrentnotsame，thenapplySettingsinprimarytopic
  const settingsTheme = settingsStore.settings.theme;
  if (settingsTheme && settingsTheme !== uiStore.theme) {
    uiStore.setTheme(settingsTheme as 'light' | 'dark');
  } else {
    // ensureCurrentprimarytopicwasapply
    uiStore.setTheme(uiStore.theme);
  }
  
  // launchAuto RefreshTokenFeature
  accountsStore.startAutoRefreshTimer(settingsStore);
  
  // listenbackend token Refreshevent，autoUpdatebeforesideAccountdata
  tokenRefreshedUnlisten = await listen<{ account_id: string; token: string; token_expires_at: string }>('token-refreshed', (event) => {
    const { account_id, token, token_expires_at } = event.payload;
    console.log('[TokenRefreshevent] backendalready RefreshAccount token:', account_id);
    
    // UpdatecorrespondingAccount token  and ExpiredTime
    const idx = accountsStore.accounts.findIndex(acc => acc.id === account_id);
    if (idx !== -1) {
      const updatedAccount = { 
        ...accountsStore.accounts[idx], 
        token, 
        token_expires_at, 
        status: 'active' as const 
      };
      accountsStore.accounts.splice(idx, 1, updatedAccount);
      console.log('[TokenRefreshevent] already UpdateAccount:', updatedAccount.email);
    }
  });
});

// on component unmountStoptimer and removeeventlisten
onUnmounted(() => {
  accountsStore.stopAutoRefreshTimer();
  document.removeEventListener('contextmenu', disableContextMenu);
  document.removeEventListener('keydown', disableDebugKeys);
  // Cancel Tauri eventlisten
  if (tokenRefreshedUnlisten) {
    tokenRefreshedUnlisten();
    tokenRefreshedUnlisten = null;
  }
});

</script>

<template>
  <el-config-provider :locale="zhCn" :namespace="elNamespace">
    <MainLayout />
  </el-config-provider>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  font-family: 'Microsoft YaHei', '微软elegant黑', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* scrollitemsstyle */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Element Plus stylecover */
.el-button-group {
  display: flex;
}

/* callwholemessageNoticeset，avoid遮挡topbutton */
.el-message {
  top: 60px !important;
}

/* Dark Modestyle */
html.dark {
  background-color: #0c0d0e;
  color-scheme: dark;
}

html.dark body {
  background-color: #0c0d0e;
  color: #cfd3dc;
}

/* Element Plus Dark ModeDialog */
html.dark .el-dialog {
  background-color: #1d1e1f !important;
  border: 1px solid #4c4d4f;
}

html.dark .el-dialog__wrapper {
  background-color: rgba(0, 0, 0, 0.7);
}

html.dark .el-dialog__header {
  border-bottom: 1px solid #4c4d4f;
  background-color: #1d1e1f !important;
}

html.dark .el-dialog__title {
  color: #e5eaf3;
}

html.dark .el-dialog__body {
  color: #cfd3dc;
  background-color: #1d1e1f !important;
}

html.dark .el-dialog__footer {
  background-color: #1d1e1f !important;
  border-top: 1px solid #4c4d4f;
}

/* Dialoginsideform and Tagspage */
html.dark .el-dialog .el-form {
  background-color: transparent;
}

html.dark .el-dialog .el-tabs__header {
  background-color: #1d1e1f;
}

html.dark .el-dialog .el-tabs__content {
  background-color: #1d1e1f;
  padding: 20px;
}

html.dark .el-dialog .el-tabs__nav-wrap {
  background-color: transparent;
}

html.dark .el-dialog .el-tabs__item {
  color: #cfd3dc;
}

html.dark .el-dialog .el-tabs__item.is-active {
  color: #409eff;
  background-color: transparent;
}

/* Dialoginside描述text */
html.dark .el-dialog .el-form-item > div {
  color: #94a3b8 !important;
}

html.dark .el-table {
  background-color: #1d1e1f !important;
  color: #cfd3dc;
}

html.dark .el-table__header-wrapper {
  background-color: #262729 !important;
}

html.dark .el-table th.el-table__cell {
  background-color: #262729 !important;
  color: #e5eaf3;
  border-bottom: 1px solid #4c4d4f;
}

html.dark .el-table tr {
  background-color: #1d1e1f !important;
}

html.dark .el-table td.el-table__cell {
  border-bottom: 1px solid #4c4d4f;
  color: #cfd3dc;
}

html.dark .el-table__empty-block {
  background-color: #1d1e1f !important;
}

html.dark .el-input__wrapper {
  background-color: #262729 !important;
  border-color: #4c4d4f;
}

html.dark .el-input__inner {
  background-color: transparent !important;
  color: #cfd3dc;
}

html.dark .el-select-dropdown {
  background-color: #1d1e1f !important;
  border: 1px solid #4c4d4f;
}

html.dark .el-select-dropdown__item {
  color: #cfd3dc;
}

html.dark .el-select-dropdown__item:hover {
  background-color: #262729;
}

html.dark .el-select-dropdown__item.selected {
  color: #409eff;
}

html.dark .el-popper {
  background-color: #1d1e1f !important;
  border: 1px solid #4c4d4f;
  color: #cfd3dc;
}

html.dark .el-form-item__label {
  color: #cfd3dc;
}

html.dark .el-checkbox__inner {
  background-color: #262729;
  border-color: #4c4d4f;
}

html.dark .el-radio__inner {
  background-color: #262729;
  border-color: #4c4d4f;
}

html.dark .el-switch__core {
  background-color: #4c4d4f !important;
  border-color: #4c4d4f !important;
}

html.dark .el-switch.is-checked .el-switch__core {
  background-color: #409eff !important;
  border-color: #409eff !important;
}

html.dark .el-switch__core .el-switch__inner {
  color: #fff !important;
}

html.dark .el-switch__core .el-switch__action {
  background-color: #fff !important;
}

/* ensuretoggleinDisableStatusunderalsocansee */
html.dark .el-switch.is-disabled .el-switch__core {
  background-color: #303133 !important;
  border-color: #303133 !important;
}

html.dark .el-switch.is-disabled.is-checked .el-switch__core {
  background-color: rgba(64, 158, 255, 0.5) !important;
  border-color: rgba(64, 158, 255, 0.5) !important;
}

html.dark .el-message-box {
  background-color: #1d1e1f !important;
  border: 1px solid #4c4d4f;
}

html.dark .el-message-box__header {
  background-color: #1d1e1f !important;
}

html.dark .el-message-box__title {
  color: #e5eaf3;
}

html.dark .el-message-box__content {
  color: #cfd3dc;
}

html.dark .el-tabs__nav-wrap::after {
  background-color: #4c4d4f;
}

html.dark .el-tabs__active-bar {
  background-color: #409eff;
}

html.dark .el-tabs__item {
  color: #cfd3dc;
}

html.dark .el-tabs__item.is-active {
  color: #409eff;
}

html.dark .el-descriptions {
  background-color: #1d1e1f;
}

html.dark .el-descriptions__body {
  background-color: #1d1e1f;
}

html.dark .el-descriptions__cell {
  border-color: #4c4d4f !important;
}

html.dark .el-descriptions__label {
  background-color: #262729;
  color: #cfd3dc;
}

html.dark .el-descriptions__content {
  background-color: #1d1e1f;
  color: #e5eaf3;
}

/* Dark Modescrollitems */
html.dark ::-webkit-scrollbar-track {
  background: #262729;
}

html.dark ::-webkit-scrollbar-thumb {
  background: #4c4d4f;
}

html.dark ::-webkit-scrollbar-thumb:hover {
  background: #5a5b5d;
}

/* Dark Modeinputboxcountcharacterstep进manager */
html.dark .el-input-number__decrease,
html.dark .el-input-number__increase {
  background-color: #262729 !important;
  color: #cfd3dc;
  border-color: #4c4d4f;
}

html.dark .el-input-number__decrease:hover,
html.dark .el-input-number__increase:hover {
  background-color: #303133 !important;
  color: #409eff;
}

/* Dark Modesingleselectbuttongroup */
html.dark .el-radio-button__inner {
  background-color: #262729 !important;
  color: #cfd3dc;
  border-color: #4c4d4f;
}

html.dark .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background-color: #409eff !important;
  border-color: #409eff !important;
  color: #fff !important;
}

/* Dark ModeTagspage */
html.dark .el-tag {
  background-color: #262729;
  border-color: #4c4d4f;
  color: #cfd3dc;
}

html.dark .el-tag--primary {
  background-color: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

html.dark .el-tag--success {
  background-color: rgba(103, 194, 58, 0.1);
  border-color: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

html.dark .el-tag--warning {
  background-color: rgba(230, 162, 60, 0.1);
  border-color: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

html.dark .el-tag--danger {
  background-color: rgba(245, 108, 108, 0.1);
  border-color: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

html.dark .el-tag--info {
  background-color: rgba(144, 147, 153, 0.1);
  border-color: rgba(144, 147, 153, 0.2);
  color: #909399;
}

/* Dark ModeAlert */
html.dark .el-alert {
  background-color: #262729;
  border-color: #4c4d4f;
}

html.dark .el-alert--info {
  background-color: rgba(144, 147, 153, 0.1);
  border-color: rgba(144, 147, 153, 0.3);
}

html.dark .el-alert__title {
  color: #e5eaf3;
}

html.dark .el-alert__description {
  color: #cfd3dc;
}

/* Dark Modebutton - fullsidecoverallbuttontype */
html.dark .el-button--default {
  background-color: #262729;
  border-color: #4c4d4f;
  color: #cfd3dc;
}

html.dark .el-button--default:hover {
  background-color: #303133;
  border-color: #5a5b5d;
  color: #409eff;
}

html.dark .el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

html.dark .el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
  color: #fff;
}

html.dark .el-button--success {
  background-color: #67c23a;
  border-color: #67c23a;
  color: #fff;
}

html.dark .el-button--success:hover {
  background-color: #85ce61;
  border-color: #85ce61;
  color: #fff;
}

html.dark .el-button--warning {
  background-color: #e6a23c;
  border-color: #e6a23c;
  color: #fff;
}

html.dark .el-button--warning:hover {
  background-color: #ebb563;
  border-color: #ebb563;
  color: #fff;
}

html.dark .el-button--danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: #fff;
}

html.dark .el-button--danger:hover {
  background-color: #f78989;
  border-color: #f78989;
  color: #fff;
}

html.dark .el-button--info {
  background-color: #909399;
  border-color: #909399;
  color: #fff;
}

html.dark .el-button--info:hover {
  background-color: #a6a9ad;
  border-color: #a6a9ad;
  color: #fff;
}

/* plainButton Style */
html.dark .el-button--primary.is-plain {
  background-color: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.5);
  color: #409eff;
}

html.dark .el-button--primary.is-plain:hover {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

html.dark .el-button--danger.is-plain {
  background-color: rgba(245, 108, 108, 0.1);
  border-color: rgba(245, 108, 108, 0.5);
  color: #f56c6c;
}

html.dark .el-button--danger.is-plain:hover {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: #fff;
}

/* textButton Style */
html.dark .el-button--text {
  background-color: transparent;
  border-color: transparent;
  color: #409eff;
}

html.dark .el-button--text:hover {
  background-color: transparent;
  border-color: transparent;
  color: #66b1ff;
}

html.dark .el-button--text:active {
  background-color: transparent;
  border-color: transparent;
  color: #3a8ee6;
}

/* disabledButton Style */
html.dark .el-button.is-disabled,
html.dark .el-button.is-disabled:hover {
  background-color: #303133;
  border-color: #4c4d4f;
  color: #5a5b5d;
  cursor: not-allowed;
}

/* circlebutton */
html.dark .el-button.is-circle {
  background-color: #262729;
  border-color: #4c4d4f;
  color: #cfd3dc;
}

html.dark .el-button.is-circle:hover {
  background-color: #303133;
  border-color: #5a5b5d;
  color: #409eff;
}

/* loadingbutton */
html.dark .el-button.is-loading {
  opacity: 0.7;
}

/* buttongroup */
html.dark .el-button-group .el-button {
  border-left-color: #4c4d4f;
  border-right-color: #4c4d4f;
}

html.dark .el-button-group .el-button:first-child {
  border-left-color: #4c4d4f;
}

html.dark .el-button-group .el-button:last-child {
  border-right-color: #4c4d4f;
}

/* Dark Modeunderpullmenusingle */
html.dark .el-dropdown-menu {
  background-color: #1d1e1f !important;
  border: 1px solid #4c4d4f;
}

html.dark .el-dropdown-menu__item {
  color: #cfd3dc;
}

html.dark .el-dropdown-menu__item:hover {
  background-color: #262729;
  color: #409eff;
}

/* Dark Modemenusingle */
html.dark .el-menu {
  background-color: #1e1e1e !important;
  border-right-color: rgba(255, 255, 255, 0.08) !important;
}

html.dark .el-menu-item {
  background-color: transparent !important;
  color: #cfd3dc !important;
}

html.dark .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #409eff !important;
}

html.dark .el-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.1) !important;
  color: #409eff !important;
}

html.dark .el-menu-item i {
  color: inherit !important;
}

/* Dark Mode'scomplexselectboxgroup */
html.dark .el-checkbox-group {
  color: #cfd3dc;
}

html.dark .el-checkbox__label {
  color: #cfd3dc !important;
}

html.dark .el-checkbox.is-checked .el-checkbox__label {
  color: #409eff !important;
}

/* Dark Mode'stooltip */
html.dark .el-tooltip__popper {
  background-color: #303133 !important;
  border: 1px solid #4c4d4f;
  color: #cfd3dc !important;
}

html.dark .el-tooltip__popper[data-popper-placement^="top"] .el-tooltip__popper-arrow::before {
  background-color: #303133 !important;
  border-color: #4c4d4f !important;
}

/* Dark Mode'sinputboxappendbutton */
html.dark .el-input-group__append {
  background-color: #262729 !important;
  border-color: #4c4d4f !important;
  color: #cfd3dc !important;
}

html.dark .el-input-group__append .el-button {
  background-color: transparent !important;
  border: none !important;
  color: #409eff !important;
}

html.dark .el-input-group__append .el-button:hover {
  color: #66b1ff !important;
}

/* Dark Mode'scard - enhanceprioritylevel */
html.dark .el-card {
  background-color: #1d1e1f !important;
  border-color: #4c4d4f !important;
  color: #cfd3dc;
}

html.dark .el-card__header {
  background-color: #262729 !important;
  border-bottom-color: #4c4d4f !important;
  color: #e5eaf3;
}

html.dark .el-card__body {
  background-color: #1d1e1f !important;
  color: #cfd3dc;
}

/* nestcardDark Mode */
html.dark .el-card .el-card {
  background-color: #262729 !important;
}

html.dark .el-card .el-card__body {
  background-color: #262729 !important;
}

/* Dialoginsidecard */
html.dark .el-dialog .el-card {
  background-color: #262729 !important;
}

html.dark .el-dialog .el-card__body {
  background-color: #262729 !important;
}

/* SeatStatisticscard */
html.dark .el-col .el-card {
  background-color: #262729 !important;
}

html.dark .el-col .el-card__body {
  background-color: #262729 !important;
}

/* Dark Mode'sprogressitems */
html.dark .el-progress {
  background-color: transparent;
}

html.dark .el-progress-bar__outer {
  background-color: #262729 !important;
}

html.dark .el-progress-bar__inner {
  background-color: #409eff !important;
}

html.dark .el-progress__text {
  color: #cfd3dc !important;
}

/* Dark Mode'sTimeline */
html.dark .el-timeline-item__node {
  background-color: #262729 !important;
  border-color: #4c4d4f !important;
}

html.dark .el-timeline-item__wrapper {
  color: #cfd3dc;
}

html.dark .el-timeline-item__content {
  color: #cfd3dc;
}

html.dark .el-timeline-item__timestamp {
  color: #94a3b8;
}

/* Dark Mode's分割line */
html.dark .el-divider {
  background-color: #4c4d4f !important;
}

html.dark .el-divider__text {
  background-color: #1d1e1f !important;
  color: #94a3b8;
}

/* Dark Mode'sStatisticscountvalue */
html.dark .el-statistic {
  color: #cfd3dc;
}

html.dark .el-statistic__head {
  color: #94a3b8;
}

html.dark .el-statistic__content {
  color: #e5eaf3;
}

html.dark .el-statistic__value {
  color: #e5eaf3;
}

/* Dark Mode'sresultpage */
html.dark .el-result {
  background-color: transparent;
}

html.dark .el-result__title {
  color: #e5eaf3;
}

html.dark .el-result__subtitle {
  color: #cfd3dc;
}

/* Dark Mode'semptyStatus */
html.dark .el-empty {
  background-color: transparent;
}

html.dark .el-empty__description {
  color: #94a3b8;
}

/* Dark Mode's骨架screen */
html.dark .el-skeleton__item {
  background-color: #262729 !important;
}

/* Dark Mode'sLoading */
html.dark .el-loading-mask {
  background-color: rgba(0, 0, 0, 0.8) !important;
}

html.dark .el-loading-spinner .circular circle {
  stroke: #409eff !important;
}

html.dark .el-loading-text {
  color: #cfd3dc !important;
}

/* Dark Mode'sstepstepitems */
html.dark .el-steps {
  background-color: transparent;
}

html.dark .el-step__head {
  color: #94a3b8;
}

html.dark .el-step__title {
  color: #cfd3dc;
}

html.dark .el-step__description {
  color: #94a3b8;
}

html.dark .el-step__icon {
  background-color: #262729;
  border-color: #4c4d4f;
  color: #94a3b8;
}

html.dark .el-step.is-finish .el-step__icon {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

html.dark .el-step.is-process .el-step__icon {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

/* Dark Mode'sPagination */
html.dark .el-pagination {
  color: #cfd3dc;
}

html.dark .el-pager li {
  background-color: #262729 !important;
  color: #cfd3dc !important;
}

html.dark .el-pager li:hover {
  color: #409eff !important;
}

html.dark .el-pager li.is-active {
  background-color: #409eff !important;
  color: #fff !important;
}

html.dark .el-pagination__total {
  color: #cfd3dc !important;
}

html.dark .el-pagination__jump {
  color: #cfd3dc !important;
}

/* Dark Mode'spopupConfirmbox */
html.dark .el-popconfirm__main {
  color: #cfd3dc !important;
}

/* Dark ModeundercustomInfoblock */
html.dark .info-card,
html.dark .info-block,
html.dark .data-card {
  background-color: #262729 !important;
  border: 1px solid #4c4d4f !important;
  color: #cfd3dc !important;
}

html.dark .info-card .label,
html.dark .info-block .label,
html.dark .data-card .label {
  color: #94a3b8 !important;
}

html.dark .info-card .value,
html.dark .info-block .value,
html.dark .data-card .value {
  color: #e5eaf3 !important;
}

/* Dark Mode'sListitem */
html.dark .list-item {
  background-color: #262729 !important;
  border-color: #4c4d4f !important;
  color: #cfd3dc !important;
}

html.dark .list-item:hover {
  background-color: #303133 !important;
}

/* Dark Mode'sbadge */
html.dark .el-badge__content {
  background-color: #f56c6c !important;
  color: #fff !important;
}

/* Dark Mode'sside包屑 */
html.dark .el-breadcrumb__inner {
  color: #cfd3dc !important;
}

html.dark .el-breadcrumb__inner:hover {
  color: #409eff !important;
}

html.dark .el-breadcrumb__separator {
  color: #94a3b8 !important;
}

/* Dark Mode'sscore */
html.dark .el-rate__icon {
  color: #4c4d4f !important;
}

html.dark .el-rate__icon.is-active {
  color: #f7ba2a !important;
}

/* forcefixDialoginsideallwhite background - most高prioritylevel */
html.dark .el-dialog * {
  background-color: transparent !important;
}

html.dark .el-dialog .el-dialog__body {
  background-color: #1d1e1f !important;
}

/* Statisticscomponentcontainer */
html.dark .el-statistic {
  background-color: #262729 !important;
  padding: 15px !important;
  border-radius: 4px !important;
}

html.dark .el-col > .el-statistic {
  background-color: #262729 !important;
}

/* fixel-row and el-colbackground */
html.dark .el-dialog .el-row {
  background-color: transparent !important;
}

html.dark .el-dialog .el-col {
  background-color: transparent !important;
}

html.dark .el-dialog .el-col > div:not(.el-statistic) {
  background-color: transparent !important;
}

/* SeatInfoblock */
html.dark .seats-section .el-col {
  background-color: transparent !important;
}

html.dark .seats-section .el-statistic {
  background-color: #262729 !important;
  border: 1px solid #4c4d4f !important;
  padding: 15px !important;
  border-radius: 4px !important;
}

/* Payment Info and billingInfotable */
html.dark .el-descriptions {
  background-color: #262729 !important;
}

html.dark .el-descriptions__body {
  background-color: #262729 !important;
}

html.dark .el-descriptions__label.el-descriptions__cell {
  background-color: #303133 !important;
  color: #94a3b8 !important;
}

html.dark .el-descriptions__content.el-descriptions__cell {
  background-color: #262729 !important;
  color: #e5eaf3 !important;
}

html.dark .el-descriptions--border .el-descriptions__cell {
  border-color: #4c4d4f !important;
}

/* ensurecardinsideallContentallisdark */
html.dark .billing-card,
html.dark .billing-card * {
  background-color: transparent !important;
}

html.dark .billing-card .el-card__body {
  background-color: #1d1e1f !important;
}

/* fixanypossibly遗漏white background */
html.dark .el-dialog [style*="background"],
html.dark .el-dialog [style*="background-color"] {
  background-color: inherit !important;
}

/* forcefixel-cardinlinestylewhite background */
html.dark .el-card[style*="background: #f8f9fa"] {
  background-color: #262729 !important;
}

html.dark .el-card[style*="background:#f8f9fa"] {
  background-color: #262729 !important;
}

/* forceallel-cardusedarkbackground */
html.dark .el-dialog .el-card {
  background-color: #1d1e1f !important;
}

html.dark .el-dialog .el-card__header {
  background: linear-gradient(135deg, #262729 0%, #2a2c2f 100%) !important;
}

html.dark .el-dialog .el-card__body {
  background-color: #1d1e1f !important;
}

/* nested inel-spaceincard */
html.dark .el-space .el-card {
  background-color: #262729 !important;
}

html.dark .el-space .el-card__body {
  background-color: #262729 !important;
}

/* ensureshadow="never"cardalsowascover */
html.dark .el-card[shadow="never"] {
  background-color: #1d1e1f !important;
  box-shadow: none !important;
}

/* forcecoverallpossibly白色inlinestyle */
html.dark [style*="background: white"],
html.dark [style*="background-color: white"],
html.dark [style*="background: #fff"],
html.dark [style*="background-color: #fff"],
html.dark [style*="background: #ffffff"],
html.dark [style*="background-color: #ffffff"],
html.dark [style*="background: #f8f9fa"],
html.dark [style*="background: #f5f7fa"] {
  background: #262729 !important;
  background-color: #262729 !important;
}
</style>