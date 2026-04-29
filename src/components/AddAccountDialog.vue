<template>
  <el-dialog
    v-model="uiStore.showAddAccountDialog"
    title="Add Account"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="currentRules"
      label-width="100px"
      autocomplete="off"
    >
      <!-- AddmethodSwitch：compactcardgrid（2 column，singlerowlayout，窄screenautosinglecolumn）
           desc descriptionloadinnative title attribute，mouse hoverdisplay。 -->
      <el-form-item label="Addmethod">
        <div class="mode-grid" role="radiogroup" aria-label="Addmethod">
          <div
            v-for="opt in modeOptions"
            :key="opt.value"
            class="mode-card"
            :class="{ 'is-active': addMode === opt.value }"
            :title="opt.desc"
            role="radio"
            :aria-checked="addMode === opt.value"
            tabindex="0"
            @click="selectMode(opt.value)"
            @keydown.enter.prevent="selectMode(opt.value)"
            @keydown.space.prevent="selectMode(opt.value)"
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
            <el-icon v-if="addMode === opt.value" class="mode-card__check">
              <Check />
            </el-icon>
          </div>
        </div>
      </el-form-item>

      <!-- Smart DetectionMode：only Enter email+Password，autoidentify Firebase / Devin provider type -->
      <template v-if="addMode === 'smart'">
        <el-alert
          type="success"
          :closable="false"
          show-icon
          style="margin-bottom: 18px;"
        >
          <template #title>
            <span style="font-size: 12px;">
              inputEmail/Password，systemautoidentify <strong>Firebase</strong> / <strong>Devin Auth1</strong> Account and dispatchtocorrectLoginprotocol
            </span>
          </template>
        </el-alert>
        <el-form-item label="Email" prop="email">
          <el-input
            v-model="formData.email"
            placeholder="Please enter email"
            :prefix-icon="Message"
            autocomplete="off"
          />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="Please enter password"
            :prefix-icon="Lock"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </template>

      <!-- Email/PasswordMode（old Firebase system） -->
      <template v-else-if="addMode === 'password'">
        <el-form-item label="Email" prop="email">
          <el-input
            v-model="formData.email"
            placeholder="Please enter email"
            :prefix-icon="Message"
            autocomplete="off"
          />
        </el-form-item>
        
        <el-form-item label="Password" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="Please enter password"
            :prefix-icon="Lock"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </template>

      <!-- Refresh Token Mode -->
      <template v-else-if="addMode === 'refresh_token'">
        <el-form-item label="Refresh Token" prop="refreshToken">
          <el-input
            v-model="formData.refreshToken"
            type="textarea"
            :rows="3"
            placeholder="Please enter Refresh Token"
          />
        </el-form-item>
      </template>

      <!-- Devin Session Token Mode：directlyPaste devin-session-token$... import into -->
      <template v-else-if="addMode === 'devin_session'">
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 18px;"
        >
          <template #title>
            <span style="font-size: 12px;">
              Pastecomplete <code>devin-session-token$...</code>  session_token，
              systemautocall GetCurrentUser reverse lookup email / Quota / api_key and persist to DB。
              suitableused forOpened in browserLoginafterfrom localStorage / cookie copy token import intoscenario。
            </span>
          </template>
        </el-alert>
        <el-form-item label="Session Token" prop="sessionToken">
          <el-input
            v-model="formData.sessionToken"
            type="textarea"
            :rows="3"
            placeholder="Please pastecomplete devin-session-token$... Token"
          />
        </el-form-item>
      </template>

      <!-- Devin Auth1 Token Mode：directlyPaste auth1_xxx import into（and Session Token forcall，butmultiplekeep auth1_token useRefreshcanuse） -->
      <template v-else-if="addMode === 'devin_auth1'">
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 18px;"
        >
          <template #title>
            <span style="font-size: 12px;">
              Pastecomplete <code>auth1_&lt;52 character&gt;</code>  auth1_token（browser localStorage key name
              <code>devin_auth1_token</code>），systemautoexchange for session_token → reverse lookup email / Quotaand persist to DB。
              <strong>compared to Session Token multiplekeep auth1_token，subsequentcanuse「Refresh」commandautorenew</strong>。
            </span>
          </template>
        </el-alert>
        <el-form-item label="Auth1 Token" prop="auth1Token">
          <el-input
            v-model="formData.auth1Token"
            type="textarea"
            :rows="3"
            placeholder="Please pastecomplete auth1_xxxxxxxx... Token"
          />
        </el-form-item>
      </template>

      <!-- Devin Email Verification Codeunifycard：twostepflow；Step 0 select source / flow，Step 1 by source+flow renderfield -->
      <template v-else-if="addMode === 'devin_email_code'">
        <!-- topdescription：by source + flow dynamictext -->
        <el-alert
          v-if="devinEmailCodeSource === 'devin_native'"
          type="success"
          :closable="false"
          show-icon
          style="margin-bottom: 16px;"
        >
          <template #title>
            <span style="font-size: 12px;">
              <strong>Devin Native Registration</strong>：via <code>app.devin.ai/api/auth1/*</code> portcreate account，
              Account Primary Attribution <strong>Devin</strong>（JWT product=Devin），RegisterafterAuto Bridge Windsurf。
              <strong>onlyneedEmail + Verification Codetwostep</strong>，does not needSettingsPassword/Name。
            </span>
          </template>
        </el-alert>
        <el-alert
          v-else-if="devinEmailCodeFlow === 'signup'"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px;"
        >
          <template #title>
            <span style="font-size: 12px;">
              <strong>Windsurf  sideRegister</strong>：via <code>windsurf.com/_devin-auth/*</code> portcreatenewAccount，
              needSettingsPassword and Name。<strong>thisflowwillcreatenewAccountand persist to DB</strong>。
            </span>
          </template>
        </el-alert>
        <el-alert
          v-else
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px;"
        >
          <template #title>
            <span style="font-size: 12px;">
              <strong>Windsurf  sidenoPasswordLogin</strong>：suitableuseAlready exists Devin AccountbutnoPasswordscenario
              （SSO migrate / forgetPassword / Google・GitHub LoginpassAccount），viaEmail Verification CodeLogin and Add。
              <strong>thisflownotwillcreatenewAccount</strong>。
            </span>
          </template>
        </el-alert>

        <el-steps :active="devinEmailCodeStep" finish-status="success" simple style="margin-bottom: 20px;">
          <el-step title="selectsource / Send Verification Code" />
          <el-step :title="devinEmailCodeSource === 'windsurf_side' && devinEmailCodeFlow === 'signup' ? 'Complete Registration' : (devinEmailCodeSource === 'devin_native' ? 'Complete Registration' : 'inputVerification Code')" />
        </el-steps>

        <!-- Step 0：select source + Optional flow + Enter email -->
        <template v-if="devinEmailCodeStep === 0">
          <!-- Registration Source：mode-card grid，andprimary「Addmethod」cardstylealign -->
          <el-form-item label="Registration Source">
            <div class="mode-grid" role="radiogroup" aria-label="Registration Source">
              <div
                v-for="opt in sourceOptions"
                :key="opt.value"
                class="mode-card"
                :class="{ 'is-active': devinEmailCodeSource === opt.value }"
                :title="opt.desc"
                role="radio"
                :aria-checked="devinEmailCodeSource === opt.value"
                tabindex="0"
                @click="selectSource(opt.value)"
                @keydown.enter.prevent="selectSource(opt.value)"
                @keydown.space.prevent="selectSource(opt.value)"
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
                <el-icon v-if="devinEmailCodeSource === opt.value" class="mode-card__check">
                  <Check />
                </el-icon>
              </div>
            </div>
          </el-form-item>

          <!-- subprocess：only  Windsurf  sideneeddistinguish login / signup；Devin nativeonly when signup -->
          <el-form-item v-if="devinEmailCodeSource === 'windsurf_side'" label="subprocess">
            <div class="mode-grid" role="radiogroup" aria-label="subprocess">
              <div
                v-for="opt in flowOptions"
                :key="opt.value"
                class="mode-card"
                :class="{ 'is-active': devinEmailCodeFlow === opt.value }"
                :title="opt.desc"
                role="radio"
                :aria-checked="devinEmailCodeFlow === opt.value"
                tabindex="0"
                @click="selectFlow(opt.value)"
                @keydown.enter.prevent="selectFlow(opt.value)"
                @keydown.space.prevent="selectFlow(opt.value)"
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
                <el-icon v-if="devinEmailCodeFlow === opt.value" class="mode-card__check">
                  <Check />
                </el-icon>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="Email" prop="email">
            <el-input
              v-model="formData.email"
              :placeholder="devinEmailCodeSource === 'devin_native' ? 'Please enterused forRegisternewEmail' : 'Please enter Devin Account Email'"
              :prefix-icon="Message"
              autocomplete="off"
            />
          </el-form-item>
        </template>

        <!-- Step 1：inputVerification Code（by source + flow decidewhetherextraneed toPassword/Name） -->
        <template v-else>
          <el-alert
            v-if="devinEmailCodeSource === 'windsurf_side' && devinEmailCodeFlow === 'signup'"
            type="warning"
            :closable="false"
            show-icon
            style="margin-bottom: 16px;"
          >
            <template #title>
              <span style="font-size: 12px;">
                <strong>Register New Account</strong>：Verification code sent to {{ formData.email }}，
                pleasefill inVerification Code and SettingsPassword/NameComplete Registration
              </span>
            </template>
          </el-alert>
          <el-alert v-else type="success" :closable="false" show-icon style="margin-bottom: 16px;">
            Verification code sent to：{{ formData.email }}
          </el-alert>

          <el-form-item label="Email">
            <el-input :model-value="formData.email" disabled />
          </el-form-item>
          <el-form-item label="Verification Code" prop="devinEmailCodeOtp">
            <el-input
              v-model="formData.devinEmailCodeOtp"
              placeholder="Please enter emailin 6 -digit verification code"
              maxlength="10"
            />
          </el-form-item>

          <!-- only  source=windsurf_side + flow=signup needPassword/Name -->
          <template v-if="devinEmailCodeSource === 'windsurf_side' && devinEmailCodeFlow === 'signup'">
            <el-form-item label="New Password" prop="devinEmailCodePassword">
              <el-input
                v-model="formData.devinEmailCodePassword"
                type="password"
                placeholder="pleaseSettingsnewAccountPassword，at least 6 "
                :prefix-icon="Lock"
                show-password
                autocomplete="new-password"
              />
            </el-form-item>
            <el-form-item label="Name" prop="devinEmailCodeName">
              <el-input
                v-model="formData.devinEmailCodeName"
                placeholder="Please enterAccountdisplayName（leave emptyuseEmailprefix）"
                :prefix-icon="User"
              />
            </el-form-item>
          </template>
        </template>
      </template>

      <!-- Devin credentialsMode（new Devin Session system） -->
      <template v-else>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 18px;"
        >
          <template #title>
            <span style="font-size: 12px;">
              via Devin Session newsystemLogin（<code>/_devin-auth/password/login</code> +
              <code>WindsurfPostAuth</code>），no Google API Key limit、noneed Token Refresh
            </span>
          </template>
        </el-alert>

        <el-form-item label="Email" prop="email">
          <el-input
            v-model="formData.email"
            placeholder="Please enter Devin Account Email"
            :prefix-icon="Message"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="Please enter Devin AccountPassword"
            :prefix-icon="Lock"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </template>
      
      <el-form-item label="RemarkName" prop="nickname">
        <el-input
          v-model="formData.nickname"
          placeholder="leave emptythenuseEmailUsername"
          :prefix-icon="User"
        />
      </el-form-item>
      
      <el-form-item label="Group">
        <el-select
          v-model="formData.group"
          placeholder="Select Group"
          clearable
        >
          <el-option
            v-for="group in settingsStore.groups"
            :key="group"
            :label="group"
            :value="group"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="Tags">
        <el-select
          v-model="formData.tags"
          multiple
          filterable
          allow-create
          placeholder="input or selectTags"
          style="width: 100%"
        >
          <el-option
            v-for="tag in settingsStore.tags"
            :key="tag.name"
            :label="tag.name"
            :value="tag.name"
          >
            <span :style="getTagOptionStyle(tag.color)">{{ tag.name }}</span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">Cancel</el-button>

      <!-- Devin Email Verification Codemerge card：by step + source + flow dynamicbuttontext -->
      <template v-if="addMode === 'devin_email_code'">
        <el-button v-if="devinEmailCodeStep === 1" @click="devinEmailCodeStep = 0" :disabled="loading">
          Previous
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ devinEmailCodeStep === 0
              ? 'Send Verification Code'
              : (devinEmailCodeSource === 'devin_native'
                  ? 'Done Devin Native Registration'
                  : (devinEmailCodeFlow === 'signup' ? 'Complete Registration' : 'DoneAdd')) }}
        </el-button>
      </template>

      <!-- otherMode：unify"Confirm"button -->
      <el-button v-else type="primary" @click="handleSubmit" :loading="loading">
        Confirm
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { Message, Lock, User, MagicStick, Refresh, Connection, Check, Key } from '@element-plus/icons-vue';
import { useAccountsStore, useSettingsStore, useUIStore } from '@/store';
import { apiService, accountApi, devinApi } from '@/api';
import type { WindsurfOrg, LoginMethodSniffResult } from '@/types';
import { invoke } from '@tauri-apps/api/core';

const accountsStore = useAccountsStore();
const settingsStore = useSettingsStore();
const uiStore = useUIStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const addMode = ref<'smart' | 'password' | 'refresh_token' | 'devin' | 'devin_session' | 'devin_auth1' | 'devin_email_code'>('smart');

// Devin Email Verification Codemerge card（mode === 'devin_email_code' exclusive）Status：
//   - step 0：select source / flow + Enter email + Send Verification Code
//   - step 1：inputVerification Code（by source+flow possiblyextra填Password/Name）
//
// source：onelevelchildsingleselect
//   - 'devin_native'【original devin_native_signup cardmergebut来】
//     portuse app.devin.ai/api/auth1/*，Account Primary Attribution Devin（JWT product=Devin）+ Auto Bridge Windsurf
//     only when signup subprocess，notneedPassword/Name
//   - 'windsurf_side'
//     portuse windsurf.com/_devin-auth/*，Account Primary Attribution Windsurf
//     support flow=login / signup；signup needPassword+Name
const devinEmailCodeSource = ref<'devin_native' | 'windsurf_side'>('devin_native');
// step 0：Enter email + Send Verification Code；step 1：inputVerification Code + DoneLogin/Register
const devinEmailCodeStep = ref<0 | 1>(0);
// /email/start Back email_verification_token，used forsubsequent /email/complete
const devinEmailCodeEmailToken = ref('');
// flow：only in source==='windsurf_side' when生效，when source==='devin_native' whenfull capacityviewmake 'signup'
//   - 'login'：Loginalready hasnoPasswordAccount（SSO migrate / forgot password / Google・GitHub LoginpassAccount）
//   - 'signup'：Register New Account（extraneed toPassword+Name）
//   - from smart dispatch not_found shortcutbuttonenterwhenautosetas 'signup' + source=windsurf_side
const devinEmailCodeFlow = ref<'login' | 'signup'>('login');

const formData = reactive({
  email: '',
  password: '',
  refreshToken: '',
  sessionToken: '',
  auth1Token: '',
  devinEmailCodeOtp: '',
  devinEmailCodePassword: '',
  devinEmailCodeName: '',
  nickname: '',
  group: 'Default Group',
  tags: [] as string[]
});

/**
 * Addmethodoptionelementdata
 *
 * orderby「recommenddegree + provider typeaggregate」rowcolumn：
 * 1) smart Smart Detection（recommend，set顶）
 * 2) Devin 系：credentials / Email Verification Code / session_token（newsystem，dailyprimary力）
 * 3) Firebase 系：Email/Password / Refresh Token（traditionalsystem，compatibleoldAccount）
 *
 * everyitemcarrycardrender所needAllviewfeeldata（icon、title、Tags、onesentence话description）。
 * add newModewhenonlyneedinthiscountgroupinappendoneitems，模板gridautosyncrender。
 */
const modeOptions = [
  {
    value: 'smart',
    title: 'Smart Detection',
    desc: 'inputEmail/Password，autoselectmostgoodLoginprovider type',
    icon: MagicStick,
    tag: 'recommend',
    tagType: 'primary' as const,
  },
  {
    value: 'devin',
    title: 'Devin credentials',
    desc: 'use Devin AccountPassworddirectlyLogin',
    icon: User,
    tag: 'new',
    tagType: 'success' as const,
  },
  {
    value: 'devin_email_code',
    title: 'Devin Email Verification Code',
    desc: 'native（app.devin.ai） or  Windsurf  sideVerification CodeLogin/Register，enterafterselectsource',
    icon: Message,
    tag: 'Verification Code',
    tagType: 'success' as const,
  },
  {
    value: 'devin_session',
    title: 'Devin Session Token',
    desc: 'Paste devin-session-token$... Direct Import',
    icon: Connection,
    tag: 'import into',
    tagType: 'warning' as const,
  },
  {
    value: 'devin_auth1',
    title: 'Devin Auth1 Token',
    desc: 'Paste auth1_... Direct Import，supportRefreshrenew',
    icon: Connection,
    tag: 'import into',
    tagType: 'warning' as const,
  },
  {
    value: 'password',
    title: 'Email/Password',
    desc: 'traditional Firebase AccountPasswordLogin',
    icon: Lock,
    tag: '',
    tagType: 'info' as const,
  },
  {
    value: 'refresh_token',
    title: 'Refresh Token',
    desc: 'Paste Firebase refresh_token Import',
    icon: Refresh,
    tag: '',
    tagType: 'info' as const,
  },
] as const;

/**
 * Devin Email Verification Codemerge card —— source childsingleselectcardelementdata
 *
 * andprimary modeOptions structurealign：icon + title + desc + tag + tagType，
 * complexuse .mode-grid / .mode-card nowhasstyle，notadd new CSS。
 */
const sourceOptions = [
  {
    value: 'devin_native',
    title: 'Devin native',
    desc: 'app.devin.ai，Account Primary Attribution Devin + Auto Bridge Windsurf',
    icon: Message,
    tag: 'native',
    tagType: 'success' as const,
  },
  {
    value: 'windsurf_side',
    title: 'Windsurf  side',
    desc: 'windsurf.com，Account Primary Attribution Windsurf',
    icon: Connection,
    tag: 'WS',
    tagType: 'info' as const,
  },
] as const;

/**
 * Devin Email Verification Codemerge card —— flow childsingleselectcardelementdata
 *
 * only in source='windsurf_side' whenrender。
 */
const flowOptions = [
  {
    value: 'login',
    title: 'LoginnoPasswordAccount',
    desc: 'SSO / forgot password / Google・GitHub LoginpassAccount',
    icon: Key,
    tag: 'Login',
    tagType: 'info' as const,
  },
  {
    value: 'signup',
    title: 'Register New Account',
    desc: 'needextraSettingsPasswordandName',
    icon: User,
    tag: 'Register',
    tagType: 'warning' as const,
  },
] as const;

/**
 * SwitchAddmethod
 *
 * cardclickwhenby模板call；internaldirectlywrite入 `addMode`  and complexuseoriginalhas `handleModeChange`
 * cleanup逻辑（ResetVerification Code step / email_token / flow etc.），ensureand el-radio Versionrowascompleteconsistent。
 */
function selectMode(value: string) {
  if (addMode.value === value) return;
  addMode.value = value as typeof addMode.value;
  handleModeChange();
}

/**
 * Devin Email Verification Codemerge card——Switch source（native / Windsurf  side）
 *
 * SwitchsourcewhenmustReset step / token / Verification Codeinput，avoidUserinalready sendpassonceVerification Codeafter
 * Switchtoanotheroneport，old token wascrossmodifytonewportSubmit逻辑butfailed。
 * formData.email / nickname / tags / group notReset，keepUserEnteredContent。
 */
function selectSource(value: string) {
  const next = value as typeof devinEmailCodeSource.value;
  if (devinEmailCodeSource.value === next) return;
  devinEmailCodeSource.value = next;
  devinEmailCodeStep.value = 0;
  devinEmailCodeEmailToken.value = '';
  formData.devinEmailCodeOtp = '';
  formData.devinEmailCodePassword = '';
  formData.devinEmailCodeName = '';
}

/**
 * Devin Email Verification Codemerge card——Switch flow（login / signup）
 *
 * only in source='windsurf_side' whenhas意义。SwitchwhensamesampleReset step / token / Verification Codeinput，
 * because login  and  signup  /email/start mode notsame，old token notcancomplexuse。
 */
function selectFlow(value: string) {
  const next = value as typeof devinEmailCodeFlow.value;
  if (devinEmailCodeFlow.value === next) return;
  devinEmailCodeFlow.value = next;
  devinEmailCodeStep.value = 0;
  devinEmailCodeEmailToken.value = '';
  formData.devinEmailCodeOtp = '';
  formData.devinEmailCodePassword = '';
  formData.devinEmailCodeName = '';
}

// Email/Passwordmode validation rules
const passwordRules: FormRules = {
  email: [
    { required: true, message: 'Please enter email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least6', trigger: 'blur' }
  ],
  nickname: [
    { max: 20, message: 'Nickname max20character', trigger: 'blur' }
  ]
};

// Refresh Token mode validation rules
const refreshTokenRules: FormRules = {
  refreshToken: [
    { required: true, message: 'Please enter Refresh Token', trigger: 'blur' },
    { min: 10, message: 'Refresh Token formatnotcorrect', trigger: 'blur' }
  ],
  nickname: [
    { max: 20, message: 'Nickname max20character', trigger: 'blur' }
  ]
};

// Devin credentialsmode validation rules（and passwordRules consistent）
const devinRules: FormRules = {
  email: [
    { required: true, message: 'Please enter Devin Account Email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter Devin AccountPassword', trigger: 'blur' },
    { min: 6, message: 'Password must be at least6', trigger: 'blur' }
  ],
  nickname: [
    { max: 20, message: 'Nickname max20character', trigger: 'blur' }
  ]
};

// Devin Email Verification Codemode validation rules：by step Group
// step 0 onlyvalidate email，step 1 onlyvalidate Verification Code
// （avoidinneedsendVerification CodestagerebelUser填Verification Code）
const devinEmailCodeStep0Rules: FormRules = {
  email: [
    { required: true, message: 'Please enter email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
  ],
  nickname: [
    { max: 20, message: 'Nickname max20character', trigger: 'blur' }
  ]
};
const devinEmailCodeStep1Rules: FormRules = {
  devinEmailCodeOtp: [
    { required: true, message: 'Please enter verification code', trigger: 'blur' },
    { min: 4, message: 'Verification Codelengthnotcorrect', trigger: 'blur' }
  ],
  nickname: [
    { max: 20, message: 'Nickname max20character', trigger: 'blur' }
  ]
};
// Step 1 Registersubprocess：Verification Code + New Password (at least 6 ) + Name (Optional)
const devinEmailCodeStep1SignupRules: FormRules = {
  devinEmailCodeOtp: [
    { required: true, message: 'Please enter verification code', trigger: 'blur' },
    { min: 4, message: 'Verification Codelengthnotcorrect', trigger: 'blur' }
  ],
  devinEmailCodePassword: [
    { required: true, message: 'pleaseSettingsNew Password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 ', trigger: 'blur' }
  ],
  devinEmailCodeName: [
    { max: 50, message: 'Namemostmultiple 50 character', trigger: 'blur' }
  ],
  nickname: [
    { max: 20, message: 'Nickname max20character', trigger: 'blur' }
  ]
};

// Devin Session Token mode validation rules
const devinSessionRules: FormRules = {
  sessionToken: [
    { required: true, message: 'Please paste Devin session_token', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        const trimmed = (value || '').trim();
        if (!trimmed) return callback(new Error('Please paste Devin session_token'));
        if (!trimmed.startsWith('devin-session-token$')) {
          return callback(new Error('session_token must start with devin-session-token$ prefix start'));
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  nickname: [
    { max: 20, message: 'Nickname max20character', trigger: 'blur' }
  ]
};

// Devin Auth1 Token mode validation rules：auth1_ prefix + 基thislengthconstraint
const devinAuth1Rules: FormRules = {
  auth1Token: [
    { required: true, message: 'Please paste Devin auth1_token', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        const trimmed = (value || '').trim();
        if (!trimmed) return callback(new Error('Please paste Devin auth1_token'));
        if (!trimmed.startsWith('auth1_')) {
          return callback(new Error('auth1_token must start with auth1_ prefix start'));
        }
        // officialformat：auth1_ + 52 character；giveoneset tolerance
        if (trimmed.length < 20) {
          return callback(new Error(`auth1_token lengthexception（${trimmed.length} character），pleaseConfirmcompletePaste`));
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  nickname: [
    { max: 20, message: 'Nickname max20character', trigger: 'blur' }
  ]
};

// based onModeselectVerifyrules
const currentRules = computed(() => {
  // smartModecomplexuseEmail/Passwordrules（samesampleneed email + password）
  if (addMode.value === 'smart' || addMode.value === 'password') return passwordRules;
  if (addMode.value === 'refresh_token') return refreshTokenRules;
  if (addMode.value === 'devin_session') return devinSessionRules;
  if (addMode.value === 'devin_auth1') return devinAuth1Rules;
  if (addMode.value === 'devin_email_code') {
    if (devinEmailCodeStep.value === 0) return devinEmailCodeStep0Rules;
    // Step 1 by source + flow distribute：
    //   - source=devin_native：only Verification Code（Devin nativenotneedPassword/Name）
    //   - source=windsurf_side + flow=login：only Verification Code
    //   - source=windsurf_side + flow=signup：Verification Code + New Password + Name
    const needsSignupExtras =
      devinEmailCodeSource.value === 'windsurf_side' && devinEmailCodeFlow.value === 'signup';
    return needsSignupExtras ? devinEmailCodeStep1SignupRules : devinEmailCodeStep1Rules;
  }
  return devinRules;
});

// SwitchModewhenResetform
function handleModeChange() {
  formRef.value?.resetFields();
  // Devin Email Verification Codemerge cardexclusiveStatusReset（source + step + token + flow + formfield）
  devinEmailCodeSource.value = 'devin_native';
  devinEmailCodeStep.value = 0;
  devinEmailCodeEmailToken.value = '';
  devinEmailCodeFlow.value = 'login';
  formData.devinEmailCodeOtp = '';
  formData.devinEmailCodePassword = '';
  formData.devinEmailCodeName = '';
}

// fetchTagsoptionstyle
function getTagOptionStyle(color: string): Record<string, string> {
  if (!color) return {};
  
  let r = 0, g = 0, b = 0;
  let parsed = false;
  
  // parse rgba  or  rgb format
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
      parsed = true;
    }
  } 
  // parse HEX format
  if (!parsed && color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length >= 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      parsed = true;
    }
  }
  
  if (!parsed) return {};
  
  return {
    color: `rgb(${r}, ${g}, ${b})`,
    fontWeight: '500'
  };
}

async function handleSubmit() {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    try {
      if (addMode.value === 'refresh_token') {
        // Refresh Token Mode
        const trimmedToken = formData.refreshToken.trim();
        const trimmedNickname = formData.nickname.trim() || undefined;
        
        if (!trimmedToken) {
          ElMessage.error('Refresh Token cannot be empty');
          loading.value = false;
          return;
        }
        
        // callbackendAPIAdd Account
        const result = await invoke<any>('add_account_by_refresh_token', {
          refreshToken: trimmedToken,
          nickname: trimmedNickname,
          tags: formData.tags,
          group: formData.group || 'Default Group'
        });
        
        if (result.success) {
          ElMessage.success(`Account ${result.email} Added successfully`);
          // Refresh account list
          await accountsStore.loadAccounts();
          handleClose();
        } else {
          ElMessage.error(result.error || 'Add failed');
        }
      } else if (addMode.value === 'devin') {
        // Devin credentialsMode
        await handleDevinSubmit();
      } else if (addMode.value === 'devin_session') {
        // Devin Session Token Direct Import
        await handleDevinSessionSubmit();
      } else if (addMode.value === 'devin_auth1') {
        // Devin Auth1 Token Direct Import
        await handleDevinAuth1Submit();
      } else if (addMode.value === 'devin_email_code') {
        // Devin Email Verification Codemerge card—— by step + source + flow three waydispatch：
        //   step 0 unifysendVerification Code（sendDevinEmailCode internalby source selectport）
        //   step 1：
        //     - source=devin_native → completeDevinEmailCodeNativeRegister
        //     - source=windsurf_side + flow=signup → completeDevinEmailCodeRegister
        //     - source=windsurf_side + flow=login → completeDevinEmailCodeLogin
        if (devinEmailCodeStep.value === 0) {
          await sendDevinEmailCode();
        } else if (devinEmailCodeSource.value === 'devin_native') {
          await completeDevinEmailCodeNativeRegister();
        } else if (devinEmailCodeFlow.value === 'signup') {
          await completeDevinEmailCodeRegister();
        } else {
          await completeDevinEmailCodeLogin();
        }
      } else if (addMode.value === 'smart') {
        // Smart DetectionMode：firstdetectionagaindispatch
        await handleSmartSubmit();
      } else {
        // Email/PasswordMode（old Firebase）
        await handleFirebaseSubmit();
      }
    } catch (error) {
      ElMessage.error(`Add failed: ${error}`);
    } finally {
      loading.value = false;
    }
  });
}

/**
 * Firebase Email/PasswordLoginflow（original 'password' branchextractget）
 *
 * 供 'password' Modedirectlycall，alsowas 'smart' Modeindetectionresultas firebase whencomplexuse
 */
async function handleFirebaseSubmit() {
  const trimmedEmail = formData.email.trim();
  const trimmedPassword = formData.password.trim();
  const trimmedNickname = formData.nickname.trim() || trimmedEmail.split('@')[0];

  if (!trimmedPassword) {
    ElMessage.error('Passwordcannot be empty or onlycontainsspace');
    return;
  }

  // Add Account
  const newAccount = await accountsStore.addAccount({
    email: trimmedEmail,
    password: trimmedPassword,
    nickname: trimmedNickname,
    tags: formData.tags,
    group: formData.group || 'Default Group'
  });

  ElMessage.success('Account added successfully, fetching account info...');

  // Auto login and fetch account detailed info
  try {
    const loginResult = await apiService.loginAccount(newAccount.id);

    if (loginResult.success) {
      const latestAccount = await accountApi.getAccount(newAccount.id);
      await accountsStore.updateAccount(latestAccount);
      ElMessage.success('Account Info already updated');
    } else {
      ElMessage.warning('Account added, but login failed, please manually refresh');
    }
  } catch (infoError) {
    console.error('Failed to get account info:', infoError);
    ElMessage.warning('Account added, but fetch detailed info failed, please manually refresh');
  }

  handleClose();
}

/**
 * Smart DetectionMode：firstdetectionAccountbelongs to Firebase / Devin whichonedispatch，againautodispatch
 *
 * backend `sniff_login_method` concurrentcalltwo side探测sidepoint，Back `recommended` field：
 * - firebase：use `handleFirebaseSubmit`
 * - devin：　use `handleDevinSubmit`
 * - sso / no_password / not_found / blocked：popupDialogguideUserhandle
 */
async function handleSmartSubmit() {
  const trimmedEmail = formData.email.trim();
  const trimmedPassword = formData.password.trim();

  if (!trimmedEmail || !trimmedPassword) {
    ElMessage.error('Email and Passwordcannot be empty');
    return;
  }

  ElMessage.info('IdentifyingAccounttype……');

  let sniff: LoginMethodSniffResult;
  try {
    sniff = await devinApi.sniffLoginMethod(trimmedEmail);
  } catch (e) {
    ElMessage.error(`identifyLogin Methodfailed: ${e}`);
    return;
  }

  switch (sniff.recommended) {
    case 'firebase':
      ElMessage.success('already identifyas Firebase Account，Logging in……');
      await handleFirebaseSubmit();
      break;
    case 'devin':
      ElMessage.success('already identifyas Devin Account，Logging in……');
      await handleDevinSubmit();
      break;
    case 'sso':
      // Enterprise SSO Account：hassomegrouporgstillallowEmail Verification CodeLogin，provide shortcutbuttontry
      try {
        await ElMessageBox.confirm(
          `${sniff.reason}\n\nYou can try logging in with email verification code. If you still cannot receive the code, please use "Refresh Token" mode instead.`,
          'Enterprise SSO Account',
          {
            type: 'info',
            confirmButtonText: 'Login with email verification code',
            cancelButtonText: 'OK',
          }
        );
        await switchToEmailCodeModeAndSend();
      } catch {
        // UserCancel，notdoanyhandle
      }
      break;
    case 'no_password':
      // noPasswordAccount：正is“Email Verification CodeLogin”primaryscenario
      try {
        await ElMessageBox.confirm(
          `${sniff.reason}\n\nThis account can log in via email verification code without a password. Send verification code now?`,
          'Account has no password',
          {
            type: 'warning',
            confirmButtonText: 'Send Verification Code',
            cancelButtonText: 'OK',
          }
        );
        await switchToEmailCodeModeAndSend();
      } catch {
        // UserCancel
      }
      break;
    case 'not_found':
      // Accounttwo sideallnotsavein：directlyuse“Email Verification CodeRegister”flow（mode=signup）
      // no longerpopup alert need toUsergoother处Register，onestepto
      try {
        await ElMessageBox.confirm(
          `${sniff.reason}\n\nThis email is not registered for a Devin account. Register a new account via email verification code now? You will need to set a password in the next step.`,
          'Account does not exist',
          {
            type: 'warning',
            confirmButtonText: 'Register Now',
            cancelButtonText: 'OK',
          }
        );
        await switchToEmailCodeModeAndSend('signup');
      } catch {
        // UserCancel
      }
      break;
    case 'blocked':
      await ElMessageBox.alert(
        `${sniff.reason}`,
        'Account Restricted',
        { type: 'error', confirmButtonText: 'OK' }
      ).catch(() => {});
      break;
    default:
      ElMessage.error(`Unknown detection result：${sniff.recommended}`);
  }
}

/**
 * Devin Session Token Direct Importflow
 *
 * Useronly needPaste `devin-session-token$...` i.e.cancreate account，
 * backendautocall GetCurrentUser reverse lookup email / api_key / Quota and persist to DB。
 */
async function handleDevinSessionSubmit() {
  const trimmedToken = formData.sessionToken.trim();
  const trimmedNickname = formData.nickname.trim() || undefined;

  if (!trimmedToken) {
    ElMessage.error('Session Token cannot be empty');
    return;
  }
  if (!trimmedToken.startsWith('devin-session-token$')) {
    ElMessage.error('session_token must start with devin-session-token$ prefix start');
    return;
  }

  ElMessage.info('currentlyreverse lookup Devin Account Info……');
  const result = await devinApi.addAccountBySessionToken({
    sessionToken: trimmedToken,
    nickname: trimmedNickname,
    tags: formData.tags,
    group: formData.group || 'Default Group',
  });

  if (result.success) {
    ElMessage.success(`Devin Account ${result.email} Approved session_token Import successful`);
    await accountsStore.loadAccounts();
    handleClose();
  } else {
    ElMessage.error(result.message || 'Session Token import intofailed');
  }
}

/**
 * Devin Auth1 Token Direct Importflow
 *
 * and handleDevinSessionSubmit forcall，butvia auth1_token exchange for session_token  and extrakeep auth1_token，
 * subsequent Devin session toperiodcandirectlyuse refreshSession Refresh，noneedre-manuallyfetch token。
 *
 * multiplegrouporgscenario：backendBack { requires_org_selection, email, auth1_token, orgs }，
 * beforesidepopup promptOrgSelection → call addAccountWithOrg Donepersist to DB（complexuse handleDevinSubmit 交互）。
 */
async function handleDevinAuth1Submit() {
  const trimmedToken = formData.auth1Token.trim();
  const trimmedNickname = formData.nickname.trim() || undefined;

  if (!trimmedToken) {
    ElMessage.error('Auth1 Token cannot be empty');
    return;
  }
  if (!trimmedToken.startsWith('auth1_')) {
    ElMessage.error('auth1_token must start with auth1_ prefix start');
    return;
  }

  ElMessage.info('currentlyuse auth1_token exchange for session  and reverse lookupAccount Info……');
  const result = await devinApi.addAccountByAuth1Token({
    auth1Token: trimmedToken,
    nickname: trimmedNickname,
    tags: formData.tags,
    group: formData.group || 'Default Group',
  });

  // branch 1：multiplegrouporg，needUsersecondaryselect
  if (result.requires_org_selection && result.auth1_token && result.orgs && result.email) {
    const chosenOrg = await promptOrgSelection(result.orgs);
    if (!chosenOrg) {
      ElMessage.info('Multi-organization selection cancelled');
      return;
    }

    const confirmResult = await devinApi.addAccountWithOrg({
      email: result.email,
      auth1Token: result.auth1_token,
      orgId: chosenOrg,
      nickname: trimmedNickname,
      tags: formData.tags,
      group: formData.group || 'Default Group',
    });

    if (confirmResult.success) {
      ElMessage.success(`Devin Account ${result.email} Approved auth1_token Import successful`);
      await accountsStore.loadAccounts();
      handleClose();
    } else {
      ElMessage.error(confirmResult.message || 'Failed to create account after organization selection');
    }
    return;
  }

  // branch 2：Direct success
  if (result.success) {
    ElMessage.success(`Devin Account ${result.email} Approved auth1_token Import successful`);
    await accountsStore.loadAccounts();
    handleClose();
  } else {
    ElMessage.error(result.message || 'Auth1 Token import intofailed');
  }
}

/**
 * Devin credentialsLogincompleteflow
 *
 * 1. call addAccountByLogin
 * 2. ifBack requires_org_selection=true，popupgrouporgselectDialog
 * 3. Userselectaftercall addAccountWithOrg Donecreate
 */
async function handleDevinSubmit() {
  const trimmedEmail = formData.email.trim();
  const trimmedPassword = formData.password.trim();
  const trimmedNickname = formData.nickname.trim() || undefined;

  if (!trimmedEmail || !trimmedPassword) {
    ElMessage.error('Email and Passwordcannot be empty');
    return;
  }

  const result = await devinApi.addAccountByLogin({
    email: trimmedEmail,
    password: trimmedPassword,
    nickname: trimmedNickname,
    tags: formData.tags,
    group: formData.group || 'Default Group',
  });

  // branch 1：Organization selection required
  if (result.requires_org_selection && result.auth1_token && result.orgs) {
    const chosenOrg = await promptOrgSelection(result.orgs);
    if (!chosenOrg) {
      ElMessage.info('Multi-organization selection cancelled');
      return;
    }

    const confirmResult = await devinApi.addAccountWithOrg({
      email: trimmedEmail,
      auth1Token: result.auth1_token,
      orgId: chosenOrg,
      nickname: trimmedNickname,
      tags: formData.tags,
      group: formData.group || 'Default Group',
    });

    if (confirmResult.success) {
      ElMessage.success(`Devin Account ${trimmedEmail} Added successfully`);
      await accountsStore.loadAccounts();
      handleClose();
    } else {
      ElMessage.error(confirmResult.message || 'Failed to create account after organization selection');
    }
    return;
  }

  // branch 2：Direct success
  if (result.success) {
    ElMessage.success(`Devin Account ${result.email} Added successfully`);
    await accountsStore.loadAccounts();
    handleClose();
  } else {
    ElMessage.error(result.message || 'Devin Login failed');
  }
}

/**
 * multiplegrouporgselectDialog
 *
 * use ElMessageBox toMindependimplement，BackUserselect org_id  or  null（Cancel）
 */
async function promptOrgSelection(orgs: WindsurfOrg[]): Promise<string | null> {
  // buildoption HTML（Element Plus  MessageBox support dangerouslyUseHTMLString）
  const optionsHtml = orgs
    .map(
      (org, i) => `
        <div style="margin: 8px 0;">
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="radio" name="devin-org" value="${escapeHtml(org.id)}" ${i === 0 ? 'checked' : ''} style="margin-right: 8px;" />
            <div>
              <div style="font-weight: 600;">${escapeHtml(org.name) || '(notnamednamegrouporg)'}</div>
              <div style="font-size: 11px; color: #909399; font-family: monospace;">${escapeHtml(org.id)}</div>
            </div>
          </label>
        </div>
      `
    )
    .join('');

  try {
    await ElMessageBox({
      title: `theAccountbelongs to ${orgs.length} grouporg，Please select`,
      message: `<div id="devin-org-picker">${optionsHtml}</div>`,
      dangerouslyUseHTMLString: true,
      showCancelButton: true,
      confirmButtonText: 'selectthisgrouporg',
      cancelButtonText: 'Cancel',
      closeOnClickModal: false,
    });

    const checked = document.querySelector<HTMLInputElement>(
      '#devin-org-picker input[name="devin-org"]:checked'
    );
    return checked ? checked.value : null;
  } catch {
    return null;
  }
}

/** escape HTML toavoid XSS */
function escapeHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Switchto「Devin Email Verification Code」Mode and autoSend Verification Code
 *
 * 供Smart Detectiondispatchfailedwhenshortcut guide：keepUserEnteredEmail，
 * autoSwitch addMode、Reset step=0、immediatelyonSend Verification Code，enter step=1waitUserinput。
 *
 * - `flow = 'login'`（default）：Loginalready hasnoPasswordAccount（no_password / sso dispatchuse）
 * - `flow = 'signup'`：Register New Account（not_found dispatchuse）
 *
 * outer layer handleSmartSubmit already in validate backcallinside `loading = true`，thisfunctioncountnoneedagainManagement。
 */
async function switchToEmailCodeModeAndSend(flow: 'login' | 'signup' = 'login') {
  addMode.value = 'devin_email_code';
  // smart dispatchenterscenarioallis Windsurf  side（sniff_login_method only探测 windsurf.com  sideLogin Method），
  // merge carddefault source='devin_native' willuse错port，this处mustforcesetas 'windsurf_side'
  devinEmailCodeSource.value = 'windsurf_side';
  devinEmailCodeFlow.value = flow;
  devinEmailCodeStep.value = 0;
  devinEmailCodeEmailToken.value = '';
  formData.devinEmailCodeOtp = '';
  formData.devinEmailCodePassword = '';
  formData.devinEmailCodeName = '';
  // formData.email keep，notClear

  // etc.ModeSwitchafteragainsendVerification Code（avoid currentRules Switchwhenflawtrigger validate）
  await nextTick();
  await sendDevinEmailCode();
}

/**
 * Devin Email Verification Codemerge card —— # 1 step：by source dispatchsendVerification Code
 *
 * - source=devin_native：use `app.devin.ai/api/auth1/email/start(mode=signup)`
 *   Account Primary Attribution Devin；only when signup，no need to分 login/signup
 * - source=windsurf_side：use `windsurf.com/_devin-auth/email/start`。mode by flow switch：
 *     * login —— only forAlready existsAccountvalid，servernotwillcreatenewAccount
 *     * signup —— server toEmailsendRegisterVerification Code，subsequent `/email/complete` whencreatenewAccount
 *
 * successfulafterUpdate step=1，enterVerification Codeinputscreen。
 */
async function sendDevinEmailCode() {
  const trimmedEmail = formData.email.trim();
  if (!trimmedEmail) {
    ElMessage.error('Emailcannot be empty');
    return;
  }

  // branch 1：Devin native—— app.devin.ai port，only  signup
  if (devinEmailCodeSource.value === 'devin_native') {
    try {
      const resp = await devinApi.nativeEmailstart(trimmedEmail, 'signup');
      if (!resp || !resp.email_verification_token) {
        ElMessage.error('backendnotBack email_verification_token，nocannot continue');
        return;
      }
      devinEmailCodeEmailToken.value = resp.email_verification_token;
      devinEmailCodeStep.value = 1;
      ElMessage.success(`Devin Native RegistrationVerification code sent to ${trimmedEmail}`);
    } catch (e: any) {
      const errMsg = String(e?.message || e || '');
      ElMessage.error(`Send Verification Codefailed：${errMsg}`);
    }
    return;
  }

  // branch 2：Windsurf  side—— windsurf.com/_devin-auth port，mode by flow switch
  const mode = devinEmailCodeFlow.value === 'signup' ? 'signup' : 'login';
  try {
    const resp = await devinApi.emailstart(trimmedEmail, mode, 'Windsurf');
    if (!resp || !resp.email_verification_token) {
      ElMessage.error('backendnotBack email_verification_token，nocannot continue');
      return;
    }
    devinEmailCodeEmailToken.value = resp.email_verification_token;
    devinEmailCodeStep.value = 1;
    const hint = mode === 'signup' ? 'RegisterVerification code sent to' : 'Verification code sent to';
    ElMessage.success(`${hint} ${trimmedEmail}`);
  } catch (e: any) {
    const errMsg = String(e?.message || e || '');
    // login flow meettoserver“Account does not exist”determinewhen，guideUserchangeas signup flow  and autoretry
    // coverthree typesscenario：
    // 1) radio primary入口directselect devin_email_code butinputnotRegisterEmail
    // 2) sniff_login_method giveout no_password / sso determineand /email/start inconsistent
    // 3) AccountjustwasDelete/migrate，CheckUserLoginMethod stillhascachebut /email/start Synced
    if (mode === 'login' && /no account found/i.test(errMsg)) {
      try {
        await ElMessageBox.confirm(
          `serverdeterminethisEmailnot yetRegister Devin Account：\n${errMsg}\n\nwhetherchangeas「Email Verification CodeRegister」createnewAccount？NextneedSettingsPassword。`,
          'Account does not exist',
          {
            type: 'warning',
            confirmButtonText: 'changeasRegister',
            cancelButtonText: 'OK',
          }
        );
        // switch flow afterrecursiveonce；signup mode notwillagainBack No account found，notwillunlimitedloop
        devinEmailCodeFlow.value = 'signup';
        await sendDevinEmailCode();
      } catch {
        // UserCancel：maintainin step=0，NoticeoriginalErrorto便UsercorrectEmail or SwitchMode
        ElMessage.info('Cancelled。pleaseConfirmEmailwhethercorrect， or changeuseotherAddmethod。');
      }
      return;
    }
    ElMessage.error(`Send Verification Codefailed：${errMsg}`);
  }
}

/**
 * Devin Email Verification CodeLogin—— # 2 step：SubmitVerification Code，DoneLogin and buildAccount
 *
 * - notsetPassword Devin Accountneed touse「/email/complete mode=login」，backendcommandas
 *   `add_account_by_devin_email_login`（internalautoDone WindsurfPostAuth + enrich）
 * - multiplegrouporg scenario reuseuse `promptOrgSelection` + `addAccountWithOrg`（and handleDevinSubmit syncconsistent）
 */
async function completeDevinEmailCodeLogin() {
  const trimmedEmail = formData.email.trim();
  const otp = formData.devinEmailCodeOtp.trim();
  const trimmedNickname = formData.nickname.trim() || undefined;

  if (!otp) {
    ElMessage.error('Please enter verification code');
    return;
  }
  if (!devinEmailCodeEmailToken.value) {
    ElMessage.error('Session state error, please go back and resend verification code');
    return;
  }

  const result = await devinApi.addAccountByEmailLogin({
    email: trimmedEmail,
    emailVerificationToken: devinEmailCodeEmailToken.value,
    code: otp,
    nickname: trimmedNickname,
    tags: formData.tags,
    group: formData.group || 'Default Group',
  });

  // branch 1：Organization selection required
  if (result.requires_org_selection && result.auth1_token && result.orgs) {
    const chosenOrg = await promptOrgSelection(result.orgs);
    if (!chosenOrg) {
      ElMessage.info('Multi-organization selection cancelled');
      return;
    }

    const confirmResult = await devinApi.addAccountWithOrg({
      email: trimmedEmail,
      auth1Token: result.auth1_token,
      orgId: chosenOrg,
      nickname: trimmedNickname,
      tags: formData.tags,
      group: formData.group || 'Default Group',
    });

    if (confirmResult.success) {
      ElMessage.success(`Devin Account ${trimmedEmail} Added successfully`);
      await accountsStore.loadAccounts();
      handleClose();
    } else {
      ElMessage.error(confirmResult.message || 'Failed to create account after organization selection');
    }
    return;
  }

  // branch 2：Direct success
  if (result.success) {
    ElMessage.success(`Devin Account ${result.email || trimmedEmail} Added successfully`);
    await accountsStore.loadAccounts();
    handleClose();
  } else {
    ElMessage.error(result.message || 'Email Verification CodeLogin failed');
  }
}

/**
 * Devin Email Verification CodeRegister—— # 2 step：SubmitVerification Code + New Password + Name，Complete Registration and buildAccount
 *
 * - callbackend `add_account_by_devin_register`（internalautoComplete Registration + WindsurfPostAuth + enrich）
 * - multiplegrouporg scenario reuseuse `promptOrgSelection` + `addAccountWithOrg`（RegisterfloworiginalPasswordwill随secondarywrite入Accountcard password field）
 */
async function completeDevinEmailCodeRegister() {
  const trimmedEmail = formData.email.trim();
  const otp = formData.devinEmailCodeOtp.trim();
  const newPassword = formData.devinEmailCodePassword.trim();
  const displayName =
    formData.devinEmailCodeName.trim() || trimmedEmail.split('@')[0] || 'Devin User';
  const trimmedNickname = formData.nickname.trim() || undefined;

  if (!otp) {
    ElMessage.error('Please enter verification code');
    return;
  }
  if (!newPassword) {
    ElMessage.error('pleaseSettingsNew Password');
    return;
  }
  if (!devinEmailCodeEmailToken.value) {
    ElMessage.error('Session state error, please go back and resend verification code');
    return;
  }

  const result = await devinApi.addAccountByRegister({
    email: trimmedEmail,
    emailVerificationToken: devinEmailCodeEmailToken.value,
    code: otp,
    password: newPassword,
    name: displayName,
    nickname: trimmedNickname,
    tags: formData.tags,
    group: formData.group || 'Default Group',
  });

  // branch 1：Organization selection required
  if (result.requires_org_selection && result.auth1_token && result.orgs) {
    const chosenOrg = await promptOrgSelection(result.orgs);
    if (!chosenOrg) {
      ElMessage.info('Multi-organization selection cancelled');
      return;
    }

    // RegisterflowwilloriginalPassword随secondaryselectgrouporg入library，便于AccountcardbackshowPassword
    const confirmResult = await devinApi.addAccountWithOrg({
      email: trimmedEmail,
      auth1Token: result.auth1_token,
      orgId: chosenOrg,
      nickname: trimmedNickname,
      tags: formData.tags,
      group: formData.group || 'Default Group',
      password: newPassword,
    });

    if (confirmResult.success) {
      ElMessage.success(`Devin Account ${trimmedEmail} Registersuccessful`);
      await accountsStore.loadAccounts();
      handleClose();
    } else {
      ElMessage.error(confirmResult.message || 'grouporgselectafterRegisterAccountfailed');
    }
    return;
  }

  // branch 2：directlyRegistersuccessful
  if (result.success) {
    ElMessage.success(`Devin Account ${result.email || trimmedEmail} Registersuccessful`);
    await accountsStore.loadAccounts();
    handleClose();
  } else {
    ElMessage.error(result.message || 'Email Verification CodeRegisterfailed');
  }
}

/**
 * Devin Email Verification Codemerge card（source=devin_native）—— # 2 step：SubmitVerification CodeComplete Registration + bridge + persist to DB
 *
 * callbackend `add_account_by_devin_native_register`：
 * 1. `devin_app_email_complete(token, code, mode="signup")` → get auth1_token
 * 2. `WindsurfPostAuth(auth1_token, org_id)` → get session_token
 * 3. persist to DBasnewAccount（password fieldleave empty，because Devin nativenotcollectPassword）
 *
 * complexuse `devinEmailCodeEmailToken` / `formData.devinEmailCodeOtp` unifyStatus，no longer维护independent devinNative* field。
 * multiplegrouporg scenario reuseuse `promptOrgSelection` + `addAccountWithOrg`（andother Devin Registerflowconsistent）。
 */
async function completeDevinEmailCodeNativeRegister() {
  const trimmedEmail = formData.email.trim();
  const otp = formData.devinEmailCodeOtp.trim();
  const trimmedNickname = formData.nickname.trim() || undefined;

  if (!otp) {
    ElMessage.error('Please enter verification code');
    return;
  }
  if (!devinEmailCodeEmailToken.value) {
    ElMessage.error('Session state error, please go back and resend verification code');
    return;
  }

  const result = await devinApi.addAccountByNativeRegister({
    email: trimmedEmail,
    emailVerificationToken: devinEmailCodeEmailToken.value,
    code: otp,
    nickname: trimmedNickname,
    tags: formData.tags,
    group: formData.group || 'Default Group',
  });

  // branch 1：multiplegrouporg，needUsersecondaryselect
  if (result.requires_org_selection && result.auth1_token && result.orgs) {
    const chosenOrg = await promptOrgSelection(result.orgs);
    if (!chosenOrg) {
      ElMessage.info('Multi-organization selection cancelled');
      return;
    }

    // Devin Native Registrationscenario password alwaysleave empty（servernotsupport预setPassword）
    const confirmResult = await devinApi.addAccountWithOrg({
      email: trimmedEmail,
      auth1Token: result.auth1_token,
      orgId: chosenOrg,
      nickname: trimmedNickname,
      tags: formData.tags,
      group: formData.group || 'Default Group',
    });

    if (confirmResult.success) {
      ElMessage.success(`Devin nativeAccount ${trimmedEmail} Registersuccessful（already bridge Windsurf）`);
      await accountsStore.loadAccounts();
      handleClose();
    } else {
      ElMessage.error(confirmResult.message || 'grouporgselectafterRegisterAccountfailed');
    }
    return;
  }

  // branch 2：directlyRegistersuccessful
  if (result.success) {
    ElMessage.success(`Devin nativeAccount ${result.email || trimmedEmail} Registersuccessful（already bridge Windsurf）`);
    await accountsStore.loadAccounts();
    handleClose();
  } else {
    ElMessage.error(result.message || 'Devin Native Registrationfailed');
  }
}

function handleClose() {
  uiStore.closeAddAccountDialog();
  formRef.value?.resetFields();
  
  // Resetformdata
  formData.email = '';
  formData.password = '';
  formData.refreshToken = '';
  formData.sessionToken = '';
  formData.auth1Token = '';
  formData.devinEmailCodeOtp = '';
  formData.devinEmailCodePassword = '';
  formData.devinEmailCodeName = '';
  formData.nickname = '';
  formData.group = 'Default Group';
  formData.tags = [];
  addMode.value = 'smart';
  // Devin Email Verification Codemerge cardStatusReset
  devinEmailCodeSource.value = 'devin_native';
  devinEmailCodeStep.value = 0;
  devinEmailCodeEmailToken.value = '';
  devinEmailCodeFlow.value = 'login';
}
</script>

<style scoped>
/* ==================== Addmethodcardgrid（Compact） ====================
 * singlerowlayout：icon + title(flex 1 can be omitted) + tag(Optional) + check(only selectedwhen)
 * descriptiontextonly tonative tooltip render（see模板 `:title="opt.desc"`），
 * notoccupyuseverticaltowardspace。
 */

/* outer layer 2 columngrid，窄screenauto降assinglecolumn */
.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

/* single cards：singlerow flex，mini 34px */
.mode-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1.5px solid var(--el-border-color);
  border-radius: 6px;
  background-color: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
  outline: none;
  min-height: 34px;
}

/* mouse hover: lightprimary色border + very lightbackground */
.mode-card:hover {
  border-color: var(--el-color-primary-light-3);
  background-color: var(--el-color-primary-light-9);
}

/* keyboard focus state */
.mode-card:focus-visible {
  box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
}

/* selectedstate：primary色border + lightprimary色background + outer loop */
.mode-card.is-active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
}

/* icon：Compactandtext基linealign */
.mode-card__icon {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--el-color-primary);
  width: 18px;
  height: 18px;
}

/* title：occupyuseRemainingspacesinglerow省略；character 13 avoidin 2 column ~220px underfrequently omit */
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

/* Tags：notshrink, followintitleafter */
.mode-card__tag {
  flex-shrink: 0;
}

/* selectedhookselect：inline放inmostright，and tag  and column；no longeruse absolute avoidincompactheightunderpresstotext */
.mode-card__check {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--el-color-primary);
}

/* 窄screen降level：smallwindowundersinglecolumn，avoidtitle + Tagspoor supportcard */
@media (max-width: 520px) {
  .mode-grid {
    grid-template-columns: 1fr;
  }
}
</style>
