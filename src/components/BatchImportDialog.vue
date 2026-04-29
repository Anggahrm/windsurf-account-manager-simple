<template>
  <el-dialog
    v-model="visible"
    title="Batch ImportAccount"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="import-container">
      <!-- Auth Provider（Devin Session / Auth1 Token Modeundernoclose, sotohide） -->
      <div class="mode-section" v-if="importMode !== 'devin_session_token' && importMode !== 'devin_auth1_token'">
        <span class="mode-label">Auth Provider：</span>
        <div class="mode-grid mode-grid--3col" role="radiogroup" aria-label="Auth Provider">
          <div
            v-for="opt in authProviderOptions"
            :key="opt.value"
            class="mode-card"
            :class="{ 'is-active': authProvider === opt.value }"
            :title="opt.desc"
            role="radio"
            :aria-checked="authProvider === opt.value"
            tabindex="0"
            @click="selectAuthProvider(opt.value)"
            @keydown.enter.prevent="selectAuthProvider(opt.value)"
            @keydown.space.prevent="selectAuthProvider(opt.value)"
          >
            <el-icon class="mode-card__icon">
              <component :is="opt.icon" />
            </el-icon>
            <span class="mode-card__title">{{ opt.title }}</span>
            <el-tag
              v-if="opt.tag"
              :type="opt.tagType"
              size="small"
              effect="light"
              class="mode-card__tag"
            >
              {{ opt.tag }}
            </el-tag>
            <el-icon v-if="authProvider === opt.value" class="mode-card__check">
              <Check />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- ImportModeSwitch（Devin / smartnotsupport Refresh Token；devin_session_token only use Devin） -->
      <div class="mode-section">
        <span class="mode-label">ImportMode：</span>
        <div class="mode-grid mode-grid--3col" role="radiogroup" aria-label="ImportMode">
          <div
            v-for="opt in importModeOptions"
            :key="opt.value"
            class="mode-card"
            :class="{
              'is-active': importMode === opt.value,
              'is-disabled': opt.disabled,
            }"
            :title="opt.disabled && opt.disabledReason ? opt.disabledReason : opt.desc"
            role="radio"
            :aria-checked="importMode === opt.value"
            :aria-disabled="opt.disabled"
            :tabindex="opt.disabled ? -1 : 0"
            @click="!opt.disabled && selectImportMode(opt.value)"
            @keydown.enter.prevent="!opt.disabled && selectImportMode(opt.value)"
            @keydown.space.prevent="!opt.disabled && selectImportMode(opt.value)"
          >
            <el-icon class="mode-card__icon">
              <component :is="opt.icon" />
            </el-icon>
            <span class="mode-card__title">{{ opt.title }}</span>
            <el-tag
              v-if="opt.tag"
              :type="opt.tagType"
              size="small"
              effect="light"
              class="mode-card__tag"
            >
              {{ opt.tag }}
            </el-tag>
            <el-icon v-if="importMode === opt.value" class="mode-card__check">
              <Check />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- formatdescription -->
      <el-alert
        :type="(importMode === 'devin_session_token' || importMode === 'devin_auth1_token') ? 'warning' : (authProvider === 'firebase' ? 'info' : 'success')"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      >
        <template #title>
          <span v-if="importMode === 'devin_session_token'">
            [Devin Session Token] One per line token，format：<code>devin-session-token$... Remark(Optional)</code>。
            systemeachitemscall GetCurrentUser reverse lookup email / Quota / api_key and persist to DB；invalid or Expired token will归入Import failed。
          </span>
          <span v-else-if="importMode === 'devin_auth1_token'">
            [Devin Auth1 Token] One per line token，format：<code>auth1_&lt;52character&gt; Remark(Optional)</code>。
            systemeachitemsuse auth1_token exchange for session_token → reverse lookup email and persist to DB；
            <strong>compared to Session Token extrakeep auth1_token，subsequentsupportRefreshrenew</strong>。
            multiplegrouporgAccountwillautoselectPrimary OrgDoneImport。
          </span>
          <span v-else-if="importMode === 'password' && authProvider === 'smart'">
            [Smart Detection] One per lineAccount，format：<code>Email Password Remark(Optional)</code>。
            systemforeveryrowconcurrentdetection <strong>Firebase</strong> / <strong>Devin Auth1</strong>  and autodispatch；
            SSO / notsetPassword / notRegisterAccountwill归入Import failed。
          </span>
          <span v-else-if="importMode === 'password' && authProvider === 'devin'">
            [Devin] One per lineAccount，format：<code>Email Password Remark(Optional)</code>。
            multiplegrouporgAccountwillautoselectfirstgrouporgDoneImport。
          </span>
          <span v-else-if="importMode === 'password'">
            One per lineAccount，supportspace or 连characterdelimiter：
            <code>Email Password Remark(Optional)</code>  or  <code>Email---Password---Remark(Optional)</code>
          </span>
          <span v-else>One per line Token，format：<code>refresh_token Remark(Optional)</code></span>
        </template>
      </el-alert>

      <!-- inputarea -->
      <div class="input-section">
        <div class="section-header">
          <span class="section-title">{{ sectionTitle }}</span>
          <el-button type="primary" link @click="handleFileImport">
            <el-icon><Upload /></el-icon>
            fromfileImport
          </el-button>
        </div>
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="12"
          :placeholder="inputPlaceholder"
          @input="parseAccounts"
        />
        <input
          ref="fileInputRef"
          type="file"
          accept=".txt,.csv"
          style="display: none;"
          @change="handleFileSelected"
        />
      </div>

      <!-- parsepreview -->
      <div class="preview-section" v-if="inputText.trim()">
        <div class="section-header">
          <span class="section-title">parsepreview</span>
          <div class="stats">
            <el-tag type="success" size="small">valid: {{ validAccounts.length }}</el-tag>
            <el-tag v-if="invalidLines.length > 0" type="danger" size="small">
              invalid: {{ invalidLines.length }}
            </el-tag>
          </div>
        </div>
        
        <!-- validAccounttable -->
        <el-table
          v-if="validAccounts.length > 0"
          :data="validAccounts.slice(0, 10)"
          size="small"
          max-height="200"
          stripe
        >
          <el-table-column prop="email" label="Email" min-width="180" />
          <el-table-column prop="password" label="Password" width="120">
            <template #default="{ row }">
              <span class="password-mask">{{ maskPassword(row.password) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="Remark" min-width="100">
            <template #default="{ row }">
              <span class="remark-text">{{ row.remark || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="validAccounts.length > 10" class="more-hint">
          ... and {{ validAccounts.length - 10 }}  accounts
        </div>

        <!-- invalidrowNotice -->
        <el-alert
          v-if="invalidLines.length > 0"
          type="warning"
          :closable="false"
          style="margin-top: 12px;"
        >
          <template #title>
            formatErrorrow: {{ invalidLines.slice(0, 5).join(', ') }}
            <span v-if="invalidLines.length > 5">... etc. {{ invalidLines.length }} row</span>
          </template>
        </el-alert>
      </div>

      <!-- ImportSettings -->
      <div class="settings-section">
        <div class="section-header">
          <span class="section-title">ImportSettings</span>
        </div>
        <div class="settings-content">
          <!-- Groupselect -->
          <div class="setting-item">
            <span class="setting-label">Group:</span>
            <el-select
              v-model="selectedGroup"
              placeholder="Select Group（Optional）"
              clearable
              style="width: 180px;"
            >
              <el-option
                v-for="group in settingsStore.groups"
                :key="group"
                :label="group"
                :value="group"
              />
            </el-select>
            <span class="setting-hint">leave emptythenuseDefault Group</span>
          </div>
          
          <!-- Tagsselect -->
          <div class="setting-item">
            <span class="setting-label">Tags:</span>
            <el-select
              v-model="selectedTags"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="selectTags（Optional）"
              clearable
              style="width: 180px;"
            >
              <el-option
                v-for="tag in settingsStore.tags"
                :key="tag.name"
                :label="tag.name"
                :value="tag.name"
              >
                <span :style="{ color: tag.color }">{{ tag.name }}</span>
              </el-option>
            </el-select>
            <span class="setting-hint">leave emptythennotAdd Tag</span>
          </div>
          
          <div class="setting-item">
            <span class="setting-label">concurrentMode:</span>
            <el-tag :type="unlimitedConcurrent ? 'danger' : 'primary'" size="small">
              {{ unlimitedConcurrent ? 'full concurrent' : `limitconcurrent (${concurrencyLimit})` }}
            </el-tag>
            <span class="setting-hint">caninSettingsinmodify</span>
          </div>
          <div class="setting-item">
            <el-checkbox v-model="autoLogin">Importthen autoLogin</el-checkbox>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button
          type="primary"
          :disabled="validAccounts.length === 0"
          :loading="importing"
          @click="handleImport"
        >
          {{ importing ? 'Importing...' : `Import ${validAccounts.length}  accounts` }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Upload,
  MagicStick,
  Platform,
  User,
  Lock,
  Refresh,
  Connection,
  Check,
} from '@element-plus/icons-vue';
import { useSettingsStore } from '@/store';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (
    e: 'import',
    accounts: Array<{ email: string; password: string; remark: string; refreshToken?: string; sessionToken?: string; auth1Token?: string }>,
    autoLogin: boolean,
    group: string,
    tags: string[],
    mode: 'password' | 'refresh_token' | 'devin_session_token' | 'devin_auth1_token',
    authProvider: 'firebase' | 'devin' | 'smart',
  ): void;
}>();

const settingsStore = useSettingsStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const inputText = ref('');
const validAccounts = ref<Array<{ email: string; password: string; remark: string; refreshToken?: string; sessionToken?: string; auth1Token?: string }>>([]);
const invalidLines = ref<number[]>([]);
const autoLogin = ref(true);
const importing = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedGroup = ref<string>('');
const selectedTags = ref<string[]>([]);
const importMode = ref<'password' | 'refresh_token' | 'devin_session_token' | 'devin_auth1_token'>('password');
/// Auth Provider：
/// - `smart`（default，recommend）：eachrowdetection Firebase / Devin autodispatchtocorrespondingcommand
/// - `firebase`：manuallyforceuseoriginalhas add_account + login_account
/// - `devin`：manuallyforceuse add_account_by_devin_login，multiplegrouporgautoselect orgs[0]
const authProvider = ref<'firebase' | 'devin' | 'smart'>('smart');

// switch to Devin / smart after，Refresh Token Modenotsuitableuse（smart Modebecause Token no email nowaydetection）
// autobackfalltoEmail/PasswordMode and Clearinput
watch(authProvider, (val) => {
  if ((val === 'devin' || val === 'smart') && importMode.value === 'refresh_token') {
    importMode.value = 'password';
    handleModeChange();
  }
});

/**
 * Auth Providercardoption（3 itemfixed）
 *
 * - smart：recommendprovider type，eachrowdetectionautodispatch
 * - firebase：forceusetraditional Firebase system
 * - devin：forceuse Devin Session newsystem
 */
const authProviderOptions = [
  {
    value: 'smart' as const,
    title: 'Smart Detection',
    desc: 'eachrowconcurrentdetection Firebase / Devin，autodispatchtocorrespondingMode',
    icon: MagicStick,
    tag: 'recommend',
    tagType: 'primary' as const,
  },
  {
    value: 'firebase' as const,
    title: 'Firebase（official）',
    desc: 'manuallyforceuseoriginalhas add_account + login_account（Firebase system）',
    icon: Platform,
    tag: '',
    tagType: 'info' as const,
  },
  {
    value: 'devin' as const,
    title: 'Devin（newversion）',
    desc: 'forceuse add_account_by_devin_login，multiplegrouporgautoselect orgs[0]',
    icon: User,
    tag: 'new',
    tagType: 'success' as const,
  },
];

/**
 * ImportModecardoption（4 item，by authProvider dynamic disabled）
 *
 * - password：Email + Password + OptionalRemark
 * - refresh_token：Firebase refresh_token；onlyin authProvider === 'firebase' whencanuse
 * - devin_session_token：devin-session-token$... import into
 * - devin_auth1_token：auth1_... import into（multiplekeep auth1_token，supportRefreshrenew）
 */
const importModeOptions = computed(() => [
  {
    value: 'password' as const,
    title: 'Email/Password',
    desc: 'One per lineAccount：Email Password [Remark]',
    icon: Lock,
    tag: '',
    tagType: 'info' as const,
    disabled: false,
    disabledReason: '',
  },
  {
    value: 'refresh_token' as const,
    title: 'Refresh Token',
    desc: 'One per line Firebase refresh_token（+ OptionalRemark）',
    icon: Refresh,
    tag: '',
    tagType: 'info' as const,
    disabled: authProvider.value === 'devin' || authProvider.value === 'smart',
    disabledReason:
      authProvider.value === 'devin'
        ? 'Devin systemnotsuitableuse refresh_token'
        : authProvider.value === 'smart'
          ? 'Smart Detectionneed email，Token formatnowaydetection'
          : '',
  },
  {
    value: 'devin_session_token' as const,
    title: 'Devin Session Token',
    desc: 'Paste devin-session-token$... Direct Import，noneedEmail/Password',
    icon: Connection,
    tag: 'import into',
    tagType: 'warning' as const,
    disabled: false,
    disabledReason: '',
  },
  {
    value: 'devin_auth1_token' as const,
    title: 'Devin Auth1 Token',
    desc: 'Paste auth1_... Direct Import，multiplegrouporgautoselectPrimary Org',
    icon: Connection,
    tag: 'import into',
    tagType: 'warning' as const,
    disabled: false,
    disabledReason: '',
  },
]);

/**
 * SwitchAuth Provider：etc.价original v-model="authProvider"。
 * keepsamevalueclickearly returntoavoidtrigger watch side effectshould。
 */
function selectAuthProvider(value: 'smart' | 'firebase' | 'devin') {
  if (authProvider.value === value) return;
  authProvider.value = value;
}

/**
 * SwitchImportMode：etc.价original v-model + @change="handleModeChange"。
 * disabled itemalready intemplate layer intercept，thisfunctioncountonlyhandle合waySwitch。
 */
function selectImportMode(value: 'password' | 'refresh_token' | 'devin_session_token' | 'devin_auth1_token') {
  if (importMode.value === value) return;
  importMode.value = value;
  handleModeChange();
}

const unlimitedConcurrent = computed(() => settingsStore.settings?.unlimitedConcurrentRefresh || false);
const concurrencyLimit = computed(() => settingsStore.settings?.concurrent_limit || 5);

// byCurrentModegenerateinputareatitleandoccupy符
const sectionTitle = computed(() => {
  if (importMode.value === 'devin_session_token') return 'Devin Session Token List';
  if (importMode.value === 'devin_auth1_token') return 'Devin Auth1 Token List';
  return importMode.value === 'password' ? 'Accountdata' : 'Refresh Token List';
});
const inputPlaceholder = computed(() => {
  if (importMode.value === 'password') {
    return 'user1@example.com password123 Test Account1\nuser2@example.com---password456\nuser3@example.com---password789---Remark Info';
  }
  if (importMode.value === 'refresh_token') {
    return 'AMf-vBx...longtoken... Test Account1\nAMf-vBy...longtoken...\nAMf-vBz...longtoken... Remark Info';
  }
  if (importMode.value === 'devin_auth1_token') {
    return 'auth1_uzq3g3s7leh774zhbwdlnbx7wotroz2srxeck53dujxa3bdje7yq Test Account1\nauth1_xxxxxxxx...\nauth1_yyyyyyyy... Remark Info';
  }
  // devin_session_token
  return 'devin-session-token$eyJhbGciOi... Test Account1\ndevin-session-token$eyJhbGciOi...\ndevin-session-token$eyJhbGciOi... Remark Info';
});

/**
 * Batch Importrowswitch分：samewhensupportblankdelimiterand `---`（3+  `-`）delimiter。
 *
 * prioritydeterminewhethersavein 3+ consecutive `-`（thresholdavoidand emails / refresh_token inoccasionalsendsingle/double connectcharacter
 * conflict）——saveinthenbyitswitch；nothenbackbacktoblankswitch分，ensurehistoryformattowardaftercompatible。
 *
 * emptysegmentwillwasfilter（avoidconsecutivemultipledelimiterbetween symbolsemptyvalueinterferesubsequent parts.length determine）。
 */
function splitLine(line: string): string[] {
  const trimmed = line.trim();
  if (/-{3,}/.test(trimmed)) {
    return trimmed.split(/-{3,}/).map(s => s.trim()).filter(s => s !== '');
  }
  return trimmed.split(/\s+/);
}

// SwitchModewhenReset
function handleModeChange() {
  inputText.value = '';
  validAccounts.value = [];
  invalidLines.value = [];
}

// parseAccountdata
function parseAccounts() {
  const lines = inputText.value.split('\n').filter(line => line.trim());
  validAccounts.value = [];
  invalidLines.value = [];

  if (importMode.value === 'password') {
    // Email/PasswordMode：support `email password remark` and `email---password---remark` two种format
    lines.forEach((line, index) => {
      const parts = splitLine(line);
      if (parts.length >= 2) {
        const [email, password, ...remarkParts] = parts;
        if (email.includes('@')) {
          validAccounts.value.push({
            email,
            password,
            remark: remarkParts.join(' ') || ''
          });
        } else {
          invalidLines.value.push(index + 1);
        }
      } else {
        invalidLines.value.push(index + 1);
      }
    });
  } else if (importMode.value === 'devin_session_token') {
    // Devin Session Token Mode：firstnon-empty白segmentas session_token，must start with devin-session-token$ start with
    lines.forEach((line, index) => {
      const parts = splitLine(line);
      if (parts.length >= 1 && parts[0].startsWith('devin-session-token$')) {
        const [token, ...remarkParts] = parts;
        validAccounts.value.push({
          email: `Session #${index + 1}`, // actual email bybackendreverse lookupfill in；occupyused forpreviewtable
          password: '',
          remark: remarkParts.join(' ') || '',
          sessionToken: token,
        });
      } else {
        invalidLines.value.push(index + 1);
      }
    });
  } else if (importMode.value === 'devin_auth1_token') {
    // Devin Auth1 Token Mode：firstnon-empty白segmentas auth1_token，must start with auth1_ start withandlengthreasonable
    lines.forEach((line, index) => {
      const parts = splitLine(line);
      if (parts.length >= 1 && parts[0].startsWith('auth1_') && parts[0].length >= 20) {
        const [token, ...remarkParts] = parts;
        validAccounts.value.push({
          email: `Auth1 #${index + 1}`, // actual email bybackendreverse lookupfill in；occupyused forpreviewtable
          password: '',
          remark: remarkParts.join(' ') || '',
          auth1Token: token,
        });
      } else {
        invalidLines.value.push(index + 1);
      }
    });
  } else {
    // Refresh Token Mode
    lines.forEach((line, index) => {
      const parts = splitLine(line);
      if (parts.length >= 1 && parts[0].length >= 10) {
        const [token, ...remarkParts] = parts;
        validAccounts.value.push({
          email: `Token #${index + 1}`,
          password: '',
          remark: remarkParts.join(' ') || '',
          refreshToken: token
        });
      } else {
        invalidLines.value.push(index + 1);
      }
    });
  }
}

// shieldPassworddisplay
function maskPassword(password: string): string {
  if (password.length <= 4) {
    return '*'.repeat(password.length);
  }
  return password.slice(0, 2) + '*'.repeat(password.length - 4) + password.slice(-2);
}

// fromfileImport
function handleFileImport() {
  fileInputRef.value?.click();
}

function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    inputText.value = content;
    parseAccounts();
  };
  reader.readAsText(file);
  
  // Resetinput，allowagaintimeselectsameonefile
  input.value = '';
}

// executeImport
function handleImport() {
  if (validAccounts.value.length === 0) return;
  importing.value = true;
  emit(
    'import',
    [...validAccounts.value],
    autoLogin.value,
    selectedGroup.value || 'Default Group',
    [...selectedTags.value],
    importMode.value,
    authProvider.value,
  );
}

// disabledDialog
function handleClose() {
  if (!importing.value) {
    inputText.value = '';
    validAccounts.value = [];
    invalidLines.value = [];
    selectedGroup.value = '';
    selectedTags.value = [];
    importMode.value = 'password';
    authProvider.value = 'smart';
    visible.value = false;
  }
}

// ImportDoneafterResetStatus
function resetImporting() {
  importing.value = false;
}

// listenDialogdisabled
watch(visible, (val) => {
  if (!val) {
    inputText.value = '';
    validAccounts.value = [];
    invalidLines.value = [];
    selectedGroup.value = '';
    selectedTags.value = [];
    importing.value = false;
    importMode.value = 'password';
    authProvider.value = 'smart';
  }
});

defineExpose({
  resetImporting
});
</script>

<style scoped>
.import-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ==================== Modeselectarea（Auth Provider / ImportMode） ==================== */

/* label inleft，cardgridoccupyright sideRemainingspace；backgroundSwitchasinpropertylight gray，no longerusegreenback highlight */
.mode-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.mode-label {
  flex-shrink: 0;
  padding-top: 8px; /* andcardtextvertical center */
  min-width: 72px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

/* ==================== card style radio grid（align AddAccountDialog style） ==================== */

/* default 2 column；BatchImport use .mode-grid--3col showdeclaration 3 column。窄screenauto降assinglecolumn */
.mode-grid {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.mode-grid--3col {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

/* single cards：singlerow flex，mini 34px；descriptionload innative title tooltip */
.mode-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1.5px solid var(--el-border-color);
  border-radius: 6px;
  background-color: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  user-select: none;
  outline: none;
  min-height: 34px;
}

.mode-card:hover {
  border-color: var(--el-color-primary-light-3);
  background-color: var(--el-color-primary-light-9);
}

.mode-card:focus-visible {
  box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
}

.mode-card.is-active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
}

/* Disablestate：changegraynotcanclick；cover hover 效果；reasondescriptionvia模板 :title attributeshow */
.mode-card.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background-color: var(--el-fill-color-light);
}
.mode-card.is-disabled:hover {
  border-color: var(--el-border-color);
  background-color: var(--el-fill-color-light);
  box-shadow: none;
}

.mode-card__icon {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--el-color-primary);
  width: 18px;
  height: 18px;
}

.mode-card.is-disabled .mode-card__icon {
  color: var(--el-text-color-placeholder);
}

.mode-card__title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mode-card.is-disabled .mode-card__title {
  color: var(--el-text-color-secondary);
}

.mode-card__tag {
  flex-shrink: 0;
}

.mode-card__check {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--el-color-primary);
}

/* 窄screen降level：dialog width < 680px whencardchangesinglecolumn，label alsonewline */
@media (max-width: 680px) {
  .mode-section {
    flex-direction: column;
    align-items: stretch;
  }
  .mode-label {
    padding-top: 0;
    min-width: 0;
  }
  .mode-grid,
  .mode-grid--3col {
    grid-template-columns: 1fr;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.input-section :deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.preview-section {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 12px;
}

.stats {
  display: flex;
  gap: 8px;
}

.password-mask {
  font-family: monospace;
  color: var(--el-text-color-secondary);
}

.remark-text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.more-hint {
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  padding: 8px 0;
}

.settings-section {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 12px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-label {
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.setting-hint {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

code {
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
