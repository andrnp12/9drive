import type { ReactNode } from "react";

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "email"
  | "password"
  | "number"
  | "button"
  | "submit";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  custom?: (value: unknown) => string | undefined;
}

export interface FieldConfig {
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  ariaLabel?: string;
  validation?: FieldValidation;
  options?: SelectOption[];
  defaultValue?: unknown;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "soft" | "danger";
  size?: "default" | "sm" | "icon";
  onClick?: () => void;
  condition?: (formData: Record<string, unknown>) => boolean;
  render?: (field: FieldConfig, formData: Record<string, unknown>) => ReactNode;
  inputMode?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  custom?: (value: unknown) => string | undefined;
}

export interface FormSectionConfig {
  id: string;
  title?: string;
  description?: string;
  fields: FieldConfig[];
  layout?: "vertical" | "horizontal" | "grid";
  className?: string;
}

export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  sections: FormSectionConfig[];
  submitLabel?: string;
  onSubmit?: (data: Record<string, unknown>) => Promise<void> | void;
  onCancel?: () => void;
  cancelLabel?: string;
  initialData?: Record<string, unknown>;
  className?: string;
}

export interface FormConfigMap {
  [key: string]: FormConfig;
}

const formConfigs = {
  sharedPage: {
    id: "sharedPage",
    title: "Shared Resources",
    description: "Manage shared files and folders with team members",
    sections: [
      {
        id: "revokeInvite",
        title: "Revoke Invitation",
        description: "Revoke an invitation to a shared resource",
        fields: [
          {
            name: "revokeConfirm",
            type: "checkbox",
            label: "I confirm I want to revoke this invitation",
            required: true,
            helpText:
              "This action cannot be undone. The invited user will lose access to the shared resource.",
          },
          {
            name: "revoke",
            type: "button",
            variant: "danger",
            size: "sm",
            label: "Revoke Invitation",
            ariaLabel: "Revoke this invitation",
            onClick: () => {},
          },
          {
            name: "cancel",
            type: "button",
            variant: "outline",
            size: "sm",
            label: "Cancel",
            ariaLabel: "Cancel revoking invitation",
            onClick: () => {},
          },
        ],
      },
    ],
  },

  archivedPage: {
    id: "archivedPage",
    title: "Archived Files Actions",
    description: "Actions for managing archived files",
    sections: [
      {
        id: "restoreDelete",
        title: "Archive Actions",
        description: "Restore or permanently delete archived files",
        fields: [
          {
            name: "restore",
            type: "button",
            variant: "outline",
            label: "Restore",
            ariaLabel: "Restore archived file to active workspace",
            onClick: () => {},
          },
          {
            name: "deletePermanently",
            type: "button",
            variant: "danger",
            label: "Delete Permanently",
            ariaLabel: "Permanently delete archived file",
            onClick: () => {},
          },
        ],
      },
    ],
  },

  starredPage: {
    id: "starredPage",
    title: "Starred Files Actions",
    description: "Manage starred files",
    sections: [
      {
        id: "unstar",
        title: "Unstar File",
        description: "Remove file from starred list",
        fields: [
          {
            name: "unstarConfirm",
            type: "checkbox",
            label: "Remove from starred files",
            required: true,
            helpText:
              "This will remove the file from your starred list but won't delete the file.",
          },
          {
            name: "unstar",
            type: "button",
            variant: "outline",
            label: "Unstar",
            ariaLabel: "Remove from starred files",
            onClick: () => {},
          },
        ],
      },
    ],
  },

  inviteMember: {
    id: "inviteMember",
    title: "Invite Member",
    description: "Share a file or folder with a team member",
    sections: [
      {
        id: "inviteDetails",
        title: "Invitation Details",
        fields: [
          {
            name: "email",
            type: "email",
            label: "Email Address",
            placeholder: "member@example.com",
            required: true,
            validation: {
              required: true,
              pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
            },
            helpText:
              "Enter the email address of the person you want to invite.",
          },
          {
            name: "role",
            type: "select",
            label: "Role",
            required: true,
            options: [
              { value: "viewer", label: "Can view" },
              { value: "editor", label: "Can edit" },
            ],
            helpText: "Choose the permission level for this member.",
          },
        ],
      },
    ],
    submitLabel: "Send Invite",
    cancelLabel: "Cancel",
  },

  createFolder: {
    id: "createFolder",
    title: "New Folder",
    description: "Create a virtual folder for organizing files",
    sections: [
      {
        id: "folderDetails",
        title: "Folder Details",
        fields: [
          {
            name: "name",
            type: "text",
            label: "Folder Name",
            placeholder: "Project Assets",
            required: true,
            validation: { required: true, minLength: 1, maxLength: 100 },
          },
          {
            name: "color",
            type: "select",
            label: "Folder Color",
            required: true,
            options: [
              { value: "#3b82f6", label: "Blue" },
              { value: "#84cc16", label: "Lime" },
              { value: "#22d3ee", label: "Cyan" },
              { value: "#facc15", label: "Yellow" },
              { value: "#f97316", label: "Orange" },
              { value: "#ef4444", label: "Red" },
              { value: "#a855f7", label: "Purple" },
              { value: "#14b8a6", label: "Teal" },
            ],
          },
          {
            name: "iconUrl",
            type: "select",
            label: "Folder Icon",
            required: true,
            options: [
              {
                value: "https://api.iconify.design/lucide:folder.svg",
                label: "Folder",
              },
              {
                value: "https://api.iconify.design/lucide:folder-open.svg",
                label: "Folder Open",
              },
              {
                value: "https://api.iconify.design/lucide:folders.svg",
                label: "Folders",
              },
              {
                value: "https://api.iconify.design/lucide:files.svg",
                label: "Files",
              },
            ],
          },
        ],
      },
    ],
    submitLabel: "Create Folder",
    cancelLabel: "Cancel",
  },

  renameFile: {
    id: "renameFile",
    title: "Rename File",
    description: "Rename a file in your storage",
    sections: [
      {
        id: "renameDetails",
        title: "New Name",
        fields: [
          {
            name: "name",
            type: "text",
            label: "New File Name",
            required: true,
            validation: { required: true, minLength: 1, maxLength: 255 },
          },
        ],
      },
    ],
    submitLabel: "Rename",
    cancelLabel: "Cancel",
  },

  renameFolder: {
    id: "renameFolder",
    title: "Rename Folder",
    description: "Rename a folder and update its appearance",
    sections: [
      {
        id: "folderDetails",
        title: "Folder Details",
        fields: [
          {
            name: "name",
            type: "text",
            label: "Folder Name",
            required: true,
            validation: { required: true, minLength: 1, maxLength: 100 },
          },
          {
            name: "color",
            type: "select",
            label: "Folder Color",
            required: true,
            options: [
              { value: "#3b82f6", label: "Blue" },
              { value: "#84cc16", label: "Lime" },
              { value: "#22d3ee", label: "Cyan" },
              { value: "#facc15", label: "Yellow" },
              { value: "#f97316", label: "Orange" },
              { value: "#ef4444", label: "Red" },
              { value: "#a855f7", label: "Purple" },
              { value: "#14b8a6", label: "Teal" },
            ],
          },
          {
            name: "iconUrl",
            type: "select",
            label: "Folder Icon",
            required: true,
            options: [
              {
                value: "https://api.iconify.design/lucide:folder.svg",
                label: "Folder",
              },
              {
                value: "https://api.iconify.design/lucide:folder-open.svg",
                label: "Folder Open",
              },
            ],
          },
        ],
      },
    ],
    submitLabel: "Rename",
    cancelLabel: "Cancel",
  },

  moveFile: {
    id: "moveFile",
    title: "Move to Folder",
    description: "Move selected files to a different folder",
    sections: [
      {
        id: "destination",
        title: "Destination Folder",
        fields: [
          {
            name: "folderId",
            type: "select",
            label: "Select Destination Folder",
            required: true,
            options: [],
            placeholder: "Select a folder",
          },
        ],
      },
    ],
    submitLabel: "Move",
    cancelLabel: "Cancel",
  },

  deleteFile: {
    id: "deleteFile",
    title: "Delete File",
    description: "Confirm file deletion",
    sections: [
      {
        id: "confirmDelete",
        title: "Confirm Deletion",
        fields: [
          {
            name: "confirmDelete",
            type: "checkbox",
            label: "I confirm I want to permanently delete this file",
            required: true,
            helpText:
              "This action cannot be undone. The file will be permanently deleted from Google Drive.",
          },
          {
            name: "delete",
            type: "button",
            variant: "danger",
            label: "Delete",
            ariaLabel: "Delete file permanently",
            onClick: () => {},
          },
        ],
      },
    ],
  },

  deleteFolder: {
    id: "deleteFolder",
    title: "Delete Folder",
    description: "Confirm folder deletion",
    sections: [
      {
        id: "confirmDelete",
        title: "Confirm Deletion",
        fields: [
          {
            name: "confirmDelete",
            type: "checkbox",
            label: "I confirm I want to delete this folder",
            required: true,
            helpText:
              "This will delete the virtual folder. Files inside will remain uploaded.",
          },
          {
            name: "delete",
            type: "button",
            variant: "danger",
            label: "Delete",
            ariaLabel: "Delete folder",
            onClick: () => {},
          },
        ],
      },
    ],
  },

  shareFile: {
    id: "shareFile",
    title: "Share Link",
    description: "Generate a shareable link for this file",
    sections: [
      {
        id: "shareLink",
        title: "Share Link",
        fields: [
          {
            name: "shareUrl",
            type: "text",
            label: "9Drive Share Link",
            disabled: true,
            helpText: "Copy this link to share the file with others.",
          },
          {
            name: "directUrl",
            type: "text",
            label: "Direct Google Drive Link",
            disabled: true,
            helpText: "Direct link to the file in Google Drive.",
          },
          {
            name: "copyLink",
            type: "button",
            variant: "default",
            label: "Copy Link",
            ariaLabel: "Copy share link to clipboard",
            onClick: () => {},
          },
          {
            name: "removeShare",
            type: "button",
            variant: "danger",
            label: "Remove Share",
            ariaLabel: "Remove share link and make file private",
            onClick: () => {},
          },
        ],
      },
    ],
  },

  createFolderAppearance: {
    id: "folderAppearance",
    title: "Folder Appearance",
    description: "Customize the folder's color and icon",
    sections: [
      {
        id: "appearance",
        title: "Customize Appearance",
        fields: [
          {
            name: "color",
            type: "select",
            label: "Folder Color",
            required: true,
            options: [
              { value: "#3b82f6", label: "Blue" },
              { value: "#84cc16", label: "Lime" },
              { value: "#22d3ee", label: "Cyan" },
              { value: "#facc15", label: "Yellow" },
              { value: "#f97316", label: "Orange" },
              { value: "#ef4444", label: "Red" },
              { value: "#a855f7", label: "Purple" },
              { value: "#14b8a6", label: "Teal" },
            ],
          },
          {
            name: "iconUrl",
            type: "select",
            label: "Folder Icon",
            required: true,
            options: [
              {
                value: "https://api.iconify.design/lucide:folder.svg",
                label: "Folder",
              },
              {
                value: "https://api.iconify.design/lucide:folder-open.svg",
                label: "Folder Open",
              },
              {
                value: "https://api.iconify.design/lucide:folders.svg",
                label: "Folders",
              },
              {
                value: "https://api.iconify.design/lucide:files.svg",
                label: "Files",
              },
            ],
          },
        ],
      },
    ],
  },

  s3Connection: {
    id: "s3Connection",
    title: "Connect S3 Storage",
    description: "Use any S3-compatible provider with custom endpoint support",
    sections: [
      {
        id: "s3Config",
        title: "S3 Configuration",
        fields: [
          {
            name: "name",
            type: "text",
            label: "Display Name",
            placeholder: "Display name",
            required: true,
            validation: { required: true, minLength: 1 },
          },
          {
            name: "bucket",
            type: "text",
            label: "Bucket",
            placeholder: "Bucket",
            required: true,
            validation: { required: true },
          },
          {
            name: "region",
            type: "text",
            label: "Region",
            placeholder: "Region",
            required: true,
            defaultValue: "us-east-1",
            validation: { required: true },
          },
          {
            name: "endpoint",
            type: "text",
            label: "Endpoint URL (optional)",
            placeholder: "Endpoint URL (optional)",
          },
          {
            name: "accessKeyId",
            type: "text",
            label: "Access Key ID",
            placeholder: "Access key ID",
            required: true,
            validation: { required: true },
          },
          {
            name: "secretAccessKey",
            type: "password",
            label: "Secret Access Key",
            placeholder: "Secret access key",
            required: true,
            validation: { required: true },
          },
          {
            name: "quotaBytes",
            type: "number",
            label: "Quota bytes (optional)",
            placeholder: "Quota bytes (optional)",
            inputMode: "numeric",
          },
          {
            name: "forcePathStyle",
            type: "checkbox",
            label: "Force path style",
            defaultValue: false,
          },
        ],
      },
    ],
    submitLabel: "Connect S3",
    cancelLabel: "Cancel",
  },
};

// i18n translation keys (can be expanded with actual translations)
export const i18nKeys = {
  common: {
    cancel: "common.cancel",
    confirm: "common.confirm",
    save: "common.save",
    create: "common.create",
    edit: "common.edit",
    delete: "common.delete",
    cancelAction: "common.cancelAction",
    saveAction: "common.saveAction",
    deleteAction: "common.deleteAction",
    close: "common.close",
    loading: "common.loading",
    error: "common.error",
    success: "common.success",
    required: "common.required",
    optional: "common.optional",
    search: "common.search",
    filter: "common.filter",
    sort: "common.sort",
    export: "common.export",
    import: "common.import",
    copy: "common.copy",
    paste: "common.paste",
    view: "common.view",
    download: "common.download",
    upload: "common.upload",
    share: "common.share",
    invite: "common.invite",
    revoke: "common.revoke",
    restore: "common.restore",
    archive: "common.archive",
    unarchive: "common.unarchive",
    star: "common.star",
    unstar: "common.unstar",
    move: "common.move",
    rename: "common.rename",
    settings: "common.settings",
    help: "common.help",
    about: "common.about",
    version: "common.version",
    language: "common.language",
    theme: "common.theme",
    light: "common.light",
    dark: "common.dark",
    system: "common.system",
    yes: "common.yes",
    no: "common.no",
    ok: "common.ok",
    back: "common.back",
    next: "common.next",
    previous: "common.previous",
    submit: "common.submit",
    reset: "common.reset",
    clear: "common.clear",
    select: "common.select",
    selectAll: "common.selectAll",
    deselectAll: "common.deselectAll",
    warning: "common.warning",
    info: "common.info",
  },

  pages: {
    shared: {
      title: "pages.shared.title",
      description: "pages.shared.description",
      sharedWithYou: "pages.shared.sharedWithYou",
      resourcesYouShared: "pages.shared.resourcesYouShared",
      sharedResources: "pages.shared.sharedResources",
      acceptedMembers: "pages.shared.acceptedMembers",
      pendingInvites: "pages.shared.pendingInvites",
      noFilesSharedWithYou: "pages.shared.noFilesSharedWithYou",
      noFilesSharedYet: "pages.shared.noFilesSharedYet",
      sharedWith: "pages.shared.sharedWith",
      invited: "pages.shared.invited",
      role: "pages.shared.role",
      status: "pages.shared.status",
      pending: "pages.shared.pending",
      accepted: "pages.shared.accepted",
      revoke: "pages.shared.revoke",
      revokeConfirm: "pages.shared.revokeConfirm",
      cancel: "common.cancel",
    },
    archived: {
      title: "pages.archived.title",
      description: "pages.archived.description",
      archivedItems: "pages.archived.archivedItems",
      recoverable: "pages.archived.recoverable",
      storageSaved: "pages.archived.storageSaved",
      restore: "pages.archived.restore",
      deletePermanently: "pages.archived.deletePermanently",
      noArchivedFiles: "pages.archived.noArchivedFiles",
    },
    starred: {
      title: "pages.starred.title",
      description: "pages.starred.description",
      starredFiles: "pages.starred.starredFiles",
      quickOpens: "pages.starred.quickOpens",
      folders: "pages.starred.folders",
      starredOn: "pages.starred.starredOn",
      unstar: "pages.starred.unstar",
    },
    allFiles: {
      title: "pages.allFiles.title",
      description: "pages.allFiles.description",
      upload: "pages.allFiles.upload",
      newFolder: "pages.allFiles.newFolder",
      syncDrive: "pages.allFiles.syncDrive",
      searchFiles: "pages.allFiles.searchFiles",
      noFiles: "pages.allFiles.noFiles",
      uploadFile: "pages.allFiles.uploadFile",
      dropFile: "pages.allFiles.dropFile",
      metadataSent: "pages.allFiles.metadataSent",
      virtualFolder: "pages.allFiles.virtualFolder",
      selectedFiles: "pages.allFiles.selectedFiles",
      move: "pages.allFiles.move",
      delete: "common.delete",
      clear: "common.clear",
      gridView: "pages.allFiles.gridView",
      listView: "pages.allFiles.listView",
      recents: "pages.allFiles.recents",
      starred: "pages.allFiles.starred",
      noFolder: "pages.allFiles.noFolder",
    },
    settings: {
      title: "pages.settings.title",
      description: "pages.settings.description",
      connectS3: "pages.settings.connectS3",
      connectDrive: "pages.settings.connectDrive",
      googleDrive: "pages.settings.googleDrive",
      s3Compatible: "pages.settings.s3Compatible",
      connectedStorageAccounts: "pages.settings.connectedStorageAccounts",
      chooseAccount: "pages.settings.chooseAccount",
      sync: "pages.settings.sync",
      reconnect: "pages.settings.reconnect",
      disconnect: "pages.settings.disconnect",
      used: "pages.settings.used",
      total: "pages.settings.total",
      free: "pages.settings.free",
      storage: "pages.settings.storage",
      notifications: "pages.settings.notifications",
      region: "pages.settings.region",
      displayName: "pages.settings.displayName",
      bucket: "pages.settings.bucket",
      endpoint: "pages.settings.endpoint",
      accessKeyId: "pages.settings.accessKeyId",
      secretAccessKey: "pages.settings.secretAccessKey",
      quotaBytes: "pages.settings.quotaBytes",
      forcePathStyle: "pages.settings.forcePathStyle",
    },
    api: {
      title: "pages.api.title",
      description: "pages.api.description",
      activeKeys: "pages.api.activeKeys",
      usedKeys: "pages.api.usedKeys",
      uploadEndpoint: "pages.api.uploadEndpoint",
      createApiKey: "pages.api.createApiKey",
      keyName: "pages.api.keyName",
      copyKey: "pages.api.copyKey",
      revokeKey: "pages.api.revokeKey",
      noApiKeys: "pages.api.noApiKeys",
      createKey: "pages.api.createApiKey",
      keyCreated: "pages.api.keyCreated",
      copyNow: "pages.api.copyNow",
      endpoint: "pages.api.endpoint",
      authHeader: "pages.api.authHeader",
      curl: "pages.api.curl",
      javascript: "pages.api.javascript",
      copy: "common.copy",
      apiKeys: "pages.api.apiKeys",
      name: "pages.api.name",
      prefix: "pages.api.prefix",
      created: "pages.api.created",
      lastUsed: "pages.api.lastUsed",
      scope: "pages.api.scope",
      active: "pages.api.active",
      revoked: "pages.api.revoked",
      never: "pages.api.never",
    },
  },

  fields: {
    email: "fields.email",
    password: "fields.password",
    name: "fields.name",
    emailPlaceholder: "fields.emailPlaceholder",
    passwordPlaceholder: "fields.passwordPlaceholder",
    namePlaceholder: "fields.namePlaceholder",
    emailRequired: "fields.emailRequired",
    passwordRequired: "fields.passwordRequired",
    nameRequired: "fields.nameRequired",
    invalidEmail: "fields.invalidEmail",
    passwordMinLength: "fields.passwordMinLength",
    confirmPassword: "fields.confirmPassword",
    passwordsMatch: "fields.passwordsMatch",
    displayName: "fields.displayName",
    bucket: "fields.bucket",
    region: "fields.region",
    endpoint: "fields.endpoint",
    accessKeyId: "fields.accessKeyId",
    secretAccessKey: "fields.secretAccessKey",
    quotaBytes: "fields.quotaBytes",
    forcePathStyle: "fields.forcePathStyle",
    folderName: "fields.folderName",
    folderColor: "fields.folderColor",
    folderIcon: "fields.folderIcon",
    role: "fields.role",
    viewer: "fields.viewer",
    editor: "fields.editor",
    confirmDelete: "fields.confirmDelete",
    confirmAction: "fields.confirmAction",
    thisActionCannotBeUndone: "fields.thisActionCannotBeUndone",
    folderNamePlaceholder: "fields.folderNamePlaceholder",
    projectAssets: "fields.projectAssets",
    selectDestinationFolder: "fields.selectDestinationFolder",
    noFolder: "fields.noFolder",
    selectFolder: "fields.selectFolder",
    keyName: "fields.keyName",
    keyNamePlaceholder: "fields.keyNamePlaceholder",
    createKey: "fields.createKey",
    creating: "fields.creating",
    cancel: "common.cancel",
    connectS3: "fields.connectS3",
    connectDrive: "fields.connectDrive",
    connecting: "fields.connecting",
    opening: "fields.opening",
    googleLogin: "fields.googleLogin",
    continueWithGoogle: "fields.continueWithGoogle",
    redirecting: "fields.redirecting",
    noAccount: "fields.noAccount",
    alreadyRegistered: "fields.alreadyRegistered",
    login: "fields.login",
    register: "fields.register",
    createAccount: "fields.createAccount",
    loggingIn: "fields.loggingIn",
    creatingAccount: "fields.creatingAccount",
    googleRegister: "fields.googleRegister",
    continueWithGoogleAndConnect: "fields.continueWithGoogleAndConnect",
    captchaRequired: "fields.captchaRequired",
  },

  actions: {
    cancel: "actions.cancel",
    save: "actions.save",
    create: "actions.create",
    edit: "actions.edit",
    delete: "actions.delete",
    cancelAction: "actions.cancelAction",
    saveAction: "actions.saveAction",
    deleteAction: "actions.deleteAction",
    close: "actions.close",
    copy: "actions.copy",
    copyLink: "actions.copyLink",
    copied: "actions.copied",
    removeShare: "actions.removeShare",
    revoke: "actions.revoke",
    revokeInvitation: "actions.revokeInvitation",
    invite: "actions.invite",
    inviteMember: "actions.inviteMember",
    sendInvite: "actions.sendInvite",
    sending: "actions.sending",
    connect: "actions.connect",
    connectDrive: "actions.connectDrive",
    connectS3: "actions.connectS3",
    connecting: "actions.connecting",
    sync: "actions.sync",
    syncing: "actions.syncing",
    refresh: "actions.refresh",
    refreshing: "actions.refreshing",
    autoRefresh: "actions.autoRefresh",
    autoRefreshOn: "actions.autoRefreshOn",
    autoRefreshOff: "actions.autoRefreshOff",
    filter: "actions.filter",
    allProviders: "actions.allProviders",
    allAccounts: "actions.allAccounts",
    mostAvailable: "actions.mostAvailable",
    routingMode: "actions.routingMode",
    roundRobin: "actions.roundRobin",
    priority: "actions.priority",
    moveUp: "actions.moveUp",
    moveDown: "actions.moveDown",
    move: "actions.move",
    rename: "actions.rename",
    upload: "actions.upload",
    uploading: "actions.uploading",
    dropFile: "actions.dropFile",
    metadataSentBeforeUpload: "actions.metadataSentBeforeUpload",
    virtualFolder: "actions.virtualFolder",
    folderName: "actions.folderName",
    folderColor: "actions.folderColor",
    folderIcon: "actions.folderIcon",
    createFolder: "actions.createFolder",
    clearSelection: "actions.clearSelection",
    selected: "actions.selected",
    share: "actions.share",
    details: "actions.details",
    download: "actions.download",
    view: "actions.view",
    paste: "actions.paste",
    cut: "actions.cut",
    pasteFolder: "actions.pasteFolder",
    inviting: "actions.inviting",
    revokeKey: "actions.revokeKey",
    createKey: "actions.createKey",
    creating: "actions.creating",
  },
};

export default {
  formConfigs: {
    sharedPage: formConfigs.sharedPage,
    archivedPage: formConfigs.archivedPage,
    starredPage: formConfigs.starredPage,
    inviteMember: formConfigs.inviteMember,
    createFolder: formConfigs.createFolder,
    renameFile: formConfigs.renameFile,
    renameFolder: formConfigs.renameFolder,
    moveFile: formConfigs.moveFile,
    deleteFile: formConfigs.deleteFile,
    deleteFolder: formConfigs.deleteFolder,
    shareFile: formConfigs.shareFile,
    createFolderAppearance: formConfigs.createFolderAppearance,
    s3Connection: formConfigs.s3Connection,
  },
  i18nKeys,
};
