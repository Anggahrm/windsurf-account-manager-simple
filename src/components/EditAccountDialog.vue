<template>
  <el-dialog
    v-model="uiStore.showEditAccountDialog"
    title="Edit Account"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form
      v-if="currentAccount"
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      autocomplete="off"
    >
      <el-form-item label="Email">
        <el-input
          v-model="formData.email"
          disabled
          :prefix-icon="Message"
          autocomplete="off"
        />
      </el-form-item>
      
      <el-form-item label="RemarkName" prop="nickname">
        <el-input
          v-model="formData.nickname"
          placeholder="Please enterRemarkName"
          :prefix-icon="User"
        />
      </el-form-item>
      
      <el-form-item label="Change Password" prop="newPassword">
        <el-input 
          v-model="formData.newPassword" 
          type="password"
          placeholder="leave emptythennotChange Password"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>
      
      <el-form-item label="ConfirmPassword" prop="confirmPassword" v-if="formData.newPassword">
        <el-input 
          v-model="formData.confirmPassword" 
          type="password"
          placeholder="pleaseagaintimeinputPassword"
          show-password
          autocomplete="new-password"
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
          @change="handleTagsChange"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag"
            :label="tag"
            :value="tag"
          >
            <span class="tag-option">
              <span 
                class="tag-color-dot" 
                :style="{ backgroundColor: getGlobalTagColor(tag) || '#909399' }"
              ></span>
              <span>{{ tag }}</span>
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item label="Tag Color" v-if="formData.tags.length > 0">
        <TagColorPicker
          :tags="formData.tags"
          v-model:tagColors="formData.tagColors"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">Cancel</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        Save
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { Message, User } from '@element-plus/icons-vue';
import { useAccountsStore, useSettingsStore, useUIStore } from '@/store';
import type { Account, TagWithColor } from '@/types';
import TagColorPicker from '@/components/TagColorPicker.vue';

const accountsStore = useAccountsStore();
const settingsStore = useSettingsStore();
const uiStore = useUIStore();

const formRef = ref<FormInstance>();
const loading = ref(false);

const formData = reactive({
  email: '',
  nickname: '',
  newPassword: '',
  confirmPassword: '',
  group: '',
  tags: [] as string[],
  tagColors: [] as TagWithColor[]
});

const currentAccount = computed(() => {
  if (!uiStore.currentEditingAccountId) return null;
  return accountsStore.accounts.find(a => a.id === uiStore.currentEditingAccountId);
});

watch(currentAccount, (account) => {
  if (account) {
    formData.email = account.email;
    formData.nickname = account.nickname;
    formData.newPassword = '';
    formData.confirmPassword = '';
    formData.group = account.group || '';
    formData.tags = [...account.tags];
    formData.tagColors = account.tagColors ? [...account.tagColors] : [];
  }
});

const validatePassword = (_rule: any, value: any, callback: any) => {
  if (value && formData.newPassword && value !== formData.newPassword) {
    callback(new Error('twotimeinputPasswordinconsistent'));
  } else {
    callback();
  }
};

const rules: FormRules = {
  nickname: [
    { required: true, message: 'Please enterRemarkName', trigger: 'blur' },
    { max: 20, message: 'Nickname max20character', trigger: 'blur' }
  ],
  newPassword: [
    { min: 6, message: 'Password must be at least6', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePassword, trigger: 'blur' }
  ]
};

const availableTags = computed(() => {
  const tags = new Set<string>();
  // AddglobalTags
  settingsStore.tags.forEach(tag => tags.add(tag.name));
  // Add AccountinUsedTags
  accountsStore.accounts.forEach(account => {
    account.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags);
});

// fetchglobalTags color
function getGlobalTagColor(tagName: string): string | undefined {
  const globalTag = settingsStore.tags.find(t => t.name === tagName);
  return globalTag?.color;
}

// whenTagsListchangewhen，autoapplyglobalTagsdefaultcolor
function handleTagsChange(newTags: string[]) {
  newTags.forEach(tagName => {
    // iftheTagsalsonohascolorconfig，andsaveinglobalTag Color，thenautoapply
    const hasColor = formData.tagColors.some(tc => tc.name === tagName);
    if (!hasColor) {
      const globalColor = getGlobalTagColor(tagName);
      if (globalColor) {
        formData.tagColors.push({ name: tagName, color: globalColor });
      }
    }
  });
  // removenotsaveinTags color
  formData.tagColors = formData.tagColors.filter(tc => newTags.includes(tc.name));
}

async function handleSubmit() {
  if (!formRef.value || !currentAccount.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    // inbackcallinagaintimefetchcurrentAccountto满enoughTypeScripttypecheck
    const account = currentAccount.value;
    if (!account) return;
    
    loading.value = true;
    try {
      const updatedAccount: Account = {
        ...account,
        nickname: formData.nickname.trim(),
        tags: formData.tags,
        tagColors: formData.tagColors.filter(tc => formData.tags.includes(tc.name)),
        group: formData.group || undefined
      };
      
      // ifinputNew Password，AddPasswordfield（removefirst尾space）
      if (formData.newPassword) {
        const trimmedPassword = formData.newPassword.trim();
        if (!trimmedPassword) {
          ElMessage.error('New Passwordcannot be empty or onlycontainsspace');
          loading.value = false;
          return;
        }
        updatedAccount.password = trimmedPassword;
      } else {
        // notChange Passwordwhen，ensurenotsendpasswordfield
        delete updatedAccount.password;
      }
      
      await accountsStore.updateAccount(updatedAccount);
      
      ElMessage.success('AccountUpdatesuccessful');
      handleClose();
    } catch (error) {
      ElMessage.error(`Update failed: ${error}`);
    } finally {
      loading.value = false;
    }
  });
}

function handleClose() {
  uiStore.closeEditAccountDialog();
  formRef.value?.resetFields();
}
</script>

<style scoped>
/* Tagsoptionstyle */
.tag-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Dark Modestyle */
:root.dark .el-form-item__label {
  color: #cfd3dc !important;
}

:root.dark .el-input__inner {
  background-color: #262729 !important;
  color: #cfd3dc !important;
}

:root.dark .el-select__input {
  color: #cfd3dc !important;
}

:root.dark .el-textarea__inner {
  background-color: #262729 !important;
  color: #cfd3dc !important;
  border-color: #4c4d4f !important;
}

:root.dark .el-select-dropdown {
  background-color: #1d1e1f !important;
  border-color: #4c4d4f !important;
}

:root.dark .el-select-dropdown__item {
  color: #cfd3dc !important;
}

:root.dark .el-select-dropdown__item:hover {
  background-color: #262729 !important;
}

:root.dark .el-tag {
  background-color: rgba(64, 158, 255, 0.1) !important;
  border-color: rgba(64, 158, 255, 0.3) !important;
  color: #409eff !important;
}
</style>
