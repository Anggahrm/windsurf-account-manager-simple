<template>
  <el-dialog
    v-model="visible"
    title="TeamCredit History"
    width="80%"
    @close="handleClose"
    append-to-body
    destroy-on-close
  >
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" size="32"><Loading /></el-icon>
      <p>fetchingCredit History...</p>
    </div>

    <div v-else-if="creditEntries">
      <!-- Statistics -->
      <el-row :gutter="20" style="margin-bottom: 20px;" v-if="creditEntries.success">
        <el-col :span="6">
          <el-statistic title="Totalrecordcount" :value="creditEntries.total_entries || 0" />
        </el-col>
        <el-col :span="6">
          <el-statistic 
            title="Total Credits" 
            :value="totalCredits" 
            :precision="2"
            suffix="Credits"
          />
        </el-col>
        <el-col :span="6">
          <el-statistic 
            title="recommendCredits" 
            :value="referralCredits" 
            :precision="2"
            suffix="Credits"
          />
        </el-col>
        <el-col :span="6">
          <el-statistic 
            title="Purchase Credits" 
            :value="purchaseCredits" 
            :precision="2"
            suffix="Credits"
          />
        </el-col>
      </el-row>

      <!-- Credit Historytable -->
      <el-table 
        :data="creditEntries.entries" 
        v-if="creditEntries.success"
        stripe
        border
        max-height="500"
        @sort-change="handleSortChange"
      >
        <el-table-column 
          label="grantDate" 
          prop="grant_date"
          width="180"
          sortable="custom"
        >
          <template #default="{ row }">
            <el-text>
              <el-icon><Calendar /></el-icon>
              {{ row.grant_date || formatTimestamp(row.grant_date_timestamp) }}
            </el-text>
          </template>
        </el-table-column>

        <el-table-column 
          label="CreditsCount" 
          prop="num_credits"
          width="120"
          align="right"
          sortable="custom"
        >
          <template #default="{ row }">
            <el-text type="success" style="font-weight: bold; font-size: 16px;">
              +{{ formatNumber(row.num_credits) }}
            </el-text>
          </template>
        </el-table-column>

        <el-table-column 
          label="Creditstype" 
          prop="type"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="getCreditTypeColor(row.type)">
              {{ row.type || 'UNKNOWN' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column 
          label="fetchreason" 
          prop="reason"
          min-width="200"
        >
          <template #default="{ row }">
            <div v-if="row.reason">
              <el-tag v-if="row.reason.type === 'referrer'" type="success" size="small">
                <el-icon><UserFilled /></el-icon>
                recommend奖励
              </el-tag>
              <el-tag v-else-if="row.reason.type === 'purchase'" type="warning" size="small">
                <el-icon><ShoppingCart /></el-icon>
                Purchase Credits
              </el-tag>
              <el-tag v-else-if="row.reason.type === 'avery'" type="info" size="small">
                <el-icon><Present /></el-icon>
                system赠送
              </el-tag>
              <el-tag v-else size="small">
                {{ row.reason.type }}
              </el-tag>
              
              <!-- ReferrerDetails -->
              <div v-if="row.reason.referrer_email" style="margin-top: 5px;">
                <el-text size="small" type="info">
                  Referrer: {{ row.reason.referrer_email }}
                </el-text>
              </div>
              <div v-if="row.reason.referred_email" style="margin-top: 5px;">
                <el-text size="small" type="info">
                  Referree: {{ row.reason.referred_email }}
                </el-text>
              </div>
              
              <!-- AveryDetails -->
              <div v-if="row.reason.avery_email" style="margin-top: 5px;">
                <el-text size="small" type="info">
                  source: {{ row.reason.avery_email }}
                </el-text>
              </div>
              <div v-if="row.reason.target_email" style="margin-top: 5px;">
                <el-text size="small" type="info">
                  targetUser: {{ row.reason.target_email }}
                </el-text>
              </div>
            </div>
            <el-text v-else type="info">Unknown</el-text>
          </template>
        </el-table-column>

        <el-table-column 
          label="recommendID" 
          prop="referral_id"
          width="100"
        >
          <template #default="{ row }">
            <el-text v-if="row.referral_id" size="small">
              #{{ row.referral_id }}
            </el-text>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column 
          label="TeamID" 
          prop="team_id"
          width="280"
          :show-overflow-tooltip="true"
        >
          <template #default="{ row }">
            <el-tooltip v-if="row.team_id" :content="row.team_id" placement="top">
              <el-text copyable size="small">
                {{ row.team_id }}
              </el-text>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- Error Info -->
      <el-alert
        v-if="!creditEntries.success"
        :title="creditEntries.error || 'fetchCredit Historyfailed'"
        type="error"
        :closable="false"
        show-icon
      />

      <!-- originalresponse（used forcalltry） -->
      <el-collapse v-if="creditEntries?.raw_response" style="margin-top: 20px;">
        <el-collapse-item title="Vieworiginalresponse">
          <div v-if="creditEntries.raw_response.startsWith('data:application/proto;base64,')">
            <el-button @click="decodeAndShowResponse" type="primary" size="small" style="margin-bottom: 10px;">
              decodeBase64response
            </el-button>
            <pre class="raw-data" style="max-height: 200px; overflow-y: auto;">{{ creditEntries.raw_response }}</pre>
          </div>
          <pre v-else class="raw-data">{{ creditEntries.raw_response }}</pre>
        </el-collapse-item>
      </el-collapse>

      <!-- originaldata（calltryMode） -->
      <el-collapse v-if="creditEntries?.raw_data" style="margin-top: 20px;">
        <el-collapse-item title="Viewparsedata">
          <pre class="raw-data">{{ JSON.stringify(creditEntries.raw_data, null, 2) }}</pre>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div v-else>
      <el-empty description="NoneCredit History" />
    </div>

    <template #footer>
      <el-button @click="handleRefresh" :icon="Refresh">Refresh</el-button>
      <el-button @click="handleClose">disabled</el-button>
      <el-button 
        type="primary" 
        @click="handleExport" 
        :icon="Download"
        v-if="creditEntries?.entries?.length > 0"
      >
        Exportrecord
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Loading, 
  Refresh, 
  Calendar, 
  UserFilled, 
  ShoppingCart, 
  Present, 
  Download 
} from '@element-plus/icons-vue';
import { invoke } from '@tauri-apps/api/core';
import dayjs from 'dayjs';

const props = defineProps<{
  modelValue: boolean;
  accountId: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const visible = ref(props.modelValue);
const loading = ref(false);
const creditEntries = ref<any>(null);

watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val && props.accountId) {
    loadCreditEntries();
  }
});

watch(visible, (val) => {
  emit('update:modelValue', val);
});

// calculateTotalCredits（divide by100）
const totalCredits = computed(() => {
  if (!creditEntries.value?.entries) return 0;
  const total = creditEntries.value.entries.reduce((sum: number, entry: any) => {
    return sum + (entry.num_credits || 0);
  }, 0);
  return total / 100;
});

// calculaterecommendCredits（divide by100）
const referralCredits = computed(() => {
  if (!creditEntries.value?.entries) return 0;
  const total = creditEntries.value.entries
    .filter((entry: any) => entry.reason?.type === 'referrer')
    .reduce((sum: number, entry: any) => sum + (entry.num_credits || 0), 0);
  return total / 100;
});

// calculatePurchase Credits（divide by100）
const purchaseCredits = computed(() => {
  if (!creditEntries.value?.entries) return 0;
  const total = creditEntries.value.entries
    .filter((entry: any) => entry.reason?.type === 'purchase')
    .reduce((sum: number, entry: any) => sum + (entry.num_credits || 0), 0);
  return total / 100;
});

async function loadCreditEntries() {
  loading.value = true;
  try {
    const result = await invoke('get_team_credit_entries', { 
      id: props.accountId 
    });
    
    creditEntries.value = result;
    
    // forrecordbyDatesort（mostnewinbefore）
    if (creditEntries.value?.entries) {
      creditEntries.value.entries.sort((a: any, b: any) => {
        const dateA = a.grant_date_timestamp || 0;
        const dateB = b.grant_date_timestamp || 0;
        return dateB - dateA;
      });
    }
  } catch (error) {
    ElMessage.error(`fetchCredit Historyfailed: ${error}`);
    creditEntries.value = {
      success: false,
      error: String(error)
    };
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visible.value = false;
}

function handleRefresh() {
  loadCreditEntries();
}

function handleSortChange({ prop, order }: any) {
  if (!creditEntries.value?.entries) return;
  
  const entries = creditEntries.value.entries;
  
  if (order === 'ascending') {
    entries.sort((a: any, b: any) => {
      if (prop === 'grant_date') {
        return (a.grant_date_timestamp || 0) - (b.grant_date_timestamp || 0);
      } else if (prop === 'num_credits') {
        return (a.num_credits || 0) - (b.num_credits || 0);
      }
      return 0;
    });
  } else if (order === 'descending') {
    entries.sort((a: any, b: any) => {
      if (prop === 'grant_date') {
        return (b.grant_date_timestamp || 0) - (a.grant_date_timestamp || 0);
      } else if (prop === 'num_credits') {
        return (b.num_credits || 0) - (a.num_credits || 0);
      }
      return 0;
    });
  }
}

function formatTimestamp(timestamp: number) {
  if (!timestamp) return 'N/A';
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
}

function formatNumber(num: number) {
  if (!num) return '0';
  // Creditsvalueneeddivide by100
  const realValue = num / 100;
  return realValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCreditTypeColor(type: string) {
  switch (type) {
    case 'FLEX':
      return 'success';
    case 'PROMPT':
      return 'warning';
    case 'FLOW':
      return 'primary';
    default:
      return 'info';
  }
}


function decodeAndShowResponse() {
  if (creditEntries.value?.raw_response) {
    try {
      // removeprefix "data:application/proto;base64,"
      const base64Data = creditEntries.value.raw_response.substring(30);
      const decodedBytes = atob(base64Data);
      
      // convert to十六进制display
      let hex = '';
      for (let i = 0; i < decodedBytes.length; i++) {
        const byte = decodedBytes.charCodeAt(i);
        hex += byte.toString(16).padStart(2, '0') + ' ';
        if ((i + 1) % 16 === 0) {
          hex += '\n';
        }
      }
      
      ElMessage.info({
        message: `decodeafterbytecount: ${decodedBytes.length}`,
        duration: 5000
      });
      
      console.log('[CreditHistory] Decoded hex:', hex);
      console.log('[CreditHistory] Decoded bytes length:', decodedBytes.length);
    } catch (error) {
      ElMessage.error('decodefailed: ' + error);
    }
  }
}

async function handleExport() {
  if (!creditEntries.value?.entries) return;
  
  try {
    // generateCSVContent
    const headers = ['grantDate', 'CreditsCount', 'Creditstype', 'fetchreason', 'relatedUser1', 'relatedUser2', 'recommendID', 'TeamID'];
    const rows = creditEntries.value.entries.map((entry: any) => {
      let user1 = '';
      let user2 = '';
      
      // based onreasontypeSettingsUserInfo
      if (entry.reason?.type === 'referrer') {
        user1 = entry.reason?.referrer_email || '';
        user2 = entry.reason?.referred_email || '';
      } else if (entry.reason?.type === 'avery') {
        user1 = entry.reason?.avery_email || '';
        user2 = entry.reason?.target_email || '';
      }
      
      return [
        entry.grant_date || formatTimestamp(entry.grant_date_timestamp),
        (entry.num_credits / 100).toFixed(2) || '0.00',
        entry.type || 'UNKNOWN',
        entry.reason?.type || 'Unknown',
        user1,
        user2,
        entry.referral_id || '',
        entry.team_id || ''
      ];
    });
    
    // createCSVContent
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n');
    
    // createDownload
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credit_history_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('Exportsuccessful');
  } catch (error) {
    ElMessage.error('Exportfailed: ' + error);
  }
}
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  min-height: 200px;
}

.raw-data {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-statistic__number) {
  font-size: 24px;
}

:deep(.el-statistic__title) {
  font-size: 14px;
  color: #909399;
}

/* Dark Themesupport */
:root.dark .raw-data {
  background: #2a2a2a;
  color: #e4e4e7;
}

:root.dark .loading-container {
  color: #cfd3dc;
}

:root.dark .loading-container p {
  color: #94a3b8;
}

:root.dark :deep(.el-table) {
  background-color: #1d1e1f !important;
  color: #cfd3dc;
}

:root.dark :deep(.el-table__header-wrapper) {
  background-color: #262729 !important;
}

:root.dark :deep(.el-table th.el-table__cell) {
  background-color: #262729 !important;
  color: #e5eaf3;
  border-bottom-color: #4c4d4f;
}

:root.dark :deep(.el-table tr) {
  background-color: #1d1e1f !important;
}

:root.dark :deep(.el-table td.el-table__cell) {
  border-bottom-color: #4c4d4f;
  color: #cfd3dc;
}

:root.dark :deep(.el-table__empty-block) {
  background-color: #1d1e1f !important;
}

:root.dark :deep(.el-table__empty-text) {
  color: #94a3b8;
}

:root.dark :deep(.el-statistic__number) {
  color: #e5eaf3 !important;
}

:root.dark :deep(.el-statistic__title) {
  color: #94a3b8 !important;
}

:root.dark .el-card {
  background-color: #1d1e1f !important;
  border-color: #4c4d4f !important;
}

:root.dark .el-card__header {
  background-color: #262729 !important;
  border-bottom-color: #4c4d4f !important;
  color: #e5eaf3;
}

:root.dark .el-card__body {
  background-color: #1d1e1f !important;
  color: #cfd3dc;
}

:root.dark .el-alert {
  background-color: #262729 !important;
  border-color: #4c4d4f !important;
}

:root.dark .el-alert__title {
  color: #e5eaf3 !important;
}

:root.dark .el-alert__description {
  color: #cfd3dc !important;
}

:root.dark .el-tag {
  background-color: rgba(64, 158, 255, 0.1) !important;
  border-color: rgba(64, 158, 255, 0.3) !important;
  color: #409eff !important;
}

:root.dark .el-tag--success {
  background-color: rgba(103, 194, 58, 0.1) !important;
  border-color: rgba(103, 194, 58, 0.3) !important;
  color: #67c23a !important;
}

:root.dark .el-tag--warning {
  background-color: rgba(230, 162, 60, 0.1) !important;
  border-color: rgba(230, 162, 60, 0.3) !important;
  color: #e6a23c !important;
}

:root.dark .el-tag--danger {
  background-color: rgba(245, 108, 108, 0.1) !important;
  border-color: rgba(245, 108, 108, 0.3) !important;
  color: #f56c6c !important;
}

:root.dark .el-tag--info {
  background-color: rgba(144, 147, 153, 0.1) !important;
  border-color: rgba(144, 147, 153, 0.3) !important;
  color: #909399 !important;
}

:root.dark .el-collapse {
  border-color: #4c4d4f !important;
}

:root.dark .el-collapse-item__header {
  background-color: #262729 !important;
  color: #cfd3dc !important;
  border-color: #4c4d4f !important;
}

:root.dark .el-collapse-item__wrap {
  background-color: #1d1e1f !important;
  border-color: #4c4d4f !important;
}

:root.dark .el-collapse-item__content {
  color: #cfd3dc !important;
}
</style>
