import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
  useCallback,
} from "react";
import type {
  FormConfig,
  FormConfigMap,
  FieldConfig,
  FormSectionConfig,
} from "./formConfig";
import { i18nKeys } from "./formConfig";

// Import default configs
import defaultFormConfig from "./formConfig";

const defaultFormConfigs = defaultFormConfig.formConfigs;

// Context type for form configuration
export interface FormConfigContextType {
  configs: FormConfigMap;
  getConfig: (id: string) => FormConfig | undefined;
  getSection: (
    formId: string,
    sectionId: string,
  ) => FormSectionConfig | undefined;
  getField: (
    formId: string,
    sectionId: string,
    fieldName: string,
  ) => FieldConfig | undefined;
  getFieldLabel: (
    formId: string,
    sectionId: string,
    fieldName: string,
  ) => string;
  getFieldPlaceholder: (
    formId: string,
    sectionId: string,
    fieldName: string,
  ) => string | undefined;
  getFieldHelpText: (
    formId: string,
    sectionId: string,
    fieldName: string,
  ) => string | undefined;
  getFieldAriaLabel: (
    formId: string,
    sectionId: string,
    fieldName: string,
  ) => string | undefined;
  getFieldValidation: (
    formId: string,
    sectionId: string,
    fieldName: string,
  ) => FieldConfig["validation"];
  getFieldOptions: (
    formId: string,
    sectionId: string,
    fieldName: string,
  ) => FieldConfig["options"];
  getFieldDefaultValue: (
    formId: string,
    sectionId: string,
    fieldName: string,
  ) => unknown;
  t: (key: string) => string;
}

// Create context with undefined default (will throw if used outside provider)
const FormConfigContext = createContext<FormConfigContextType | undefined>(
  undefined,
);

/**
 * Provider component for form configurations
 * Wraps the app and provides access to all form configurations and i18n keys
 */
export function FormConfigProvider({
  children,
  configs = {},
  translations = {},
}: {
  children: ReactNode;
  configs?: FormConfigMap;
  translations?: Partial<typeof i18nKeys>;
}) {
  // Merge provided configs with defaults
  const mergedConfigs = useMemo(() => {
    return { ...defaultFormConfigs, ...configs };
  }, [configs]);

  // Translation function with fallback to key
  const t = useCallback(
    (key: string): string => {
      // Navigate nested object using dot notation
      const keys = key.split(".");
      let value: unknown = { ...i18nKeys, ...translations };

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key; // Return key if translation not found
        }
      }

      return typeof value === "string" ? value : key;
    },
    [translations],
  );

  // Get form config by ID
  const getConfig = useCallback(
    (id: string): FormConfig | undefined => {
      return mergedConfigs[id];
    },
    [mergedConfigs],
  );

  // Get section from form config
  const getSection = useCallback(
    (formId: string, sectionId: string): FormSectionConfig | undefined => {
      const config = getConfig(formId);
      if (!config) return undefined;
      return config.sections.find(
        (section: FormSectionConfig) => section.id === sectionId,
      );
    },
    [getConfig],
  );

  // Get field from section
  const getField = useCallback(
    (
      formId: string,
      sectionId: string,
      fieldName: string,
    ): FieldConfig | undefined => {
      const section = getSection(formId, sectionId);
      if (!section) return undefined;
      return section.fields.find(
        (field: FieldConfig) => field.name === fieldName,
      );
    },
    [getSection],
  );

  // Get field label with i18n support
  const getFieldLabel = useCallback(
    (formId: string, sectionId: string, fieldName: string): string => {
      const field = getField(formId, sectionId, fieldName);
      if (!field) return fieldName;
      // If label looks like an i18n key (contains dot), translate it
      if (field.label.includes(".")) {
        return t(field.label);
      }
      return field.label;
    },
    [getField, t],
  );

  // Get field placeholder with i18n support
  const getFieldPlaceholder = useCallback(
    (
      formId: string,
      sectionId: string,
      fieldName: string,
    ): string | undefined => {
      const field = getField(formId, sectionId, fieldName);
      if (!field || !field.placeholder) return undefined;
      if (field.placeholder.includes(".")) {
        return t(field.placeholder);
      }
      return field.placeholder;
    },
    [getField, t],
  );

  // Get field help text with i18n support
  const getFieldHelpText = useCallback(
    (
      formId: string,
      sectionId: string,
      fieldName: string,
    ): string | undefined => {
      const field = getField(formId, sectionId, fieldName);
      if (!field || !field.helpText) return undefined;
      if (field.helpText.includes(".")) {
        return t(field.helpText);
      }
      return field.helpText;
    },
    [getField, t],
  );

  // Get field aria-label with i18n support
  const getFieldAriaLabel = useCallback(
    (
      formId: string,
      sectionId: string,
      fieldName: string,
    ): string | undefined => {
      const field = getField(formId, sectionId, fieldName);
      if (!field || !field.ariaLabel) return undefined;
      if (field.ariaLabel.includes(".")) {
        return t(field.ariaLabel);
      }
      return field.ariaLabel;
    },
    [getField, t],
  );

  // Get field validation
  const getFieldValidation = useCallback(
    (
      formId: string,
      sectionId: string,
      fieldName: string,
    ): FieldConfig["validation"] => {
      const field = getField(formId, sectionId, fieldName);
      return field?.validation;
    },
    [getField],
  );

  // Get field options
  const getFieldOptions = useCallback(
    (
      formId: string,
      sectionId: string,
      fieldName: string,
    ): FieldConfig["options"] => {
      const field = getField(formId, sectionId, fieldName);
      return field?.options;
    },
    [getField],
  );

  // Get field default value
  const getFieldDefaultValue = useCallback(
    (formId: string, sectionId: string, fieldName: string): unknown => {
      const field = getField(formId, sectionId, fieldName);
      return field?.defaultValue;
    },
    [getField],
  );

  const value = useMemo<FormConfigContextType>(
    () => ({
      configs: mergedConfigs,
      getConfig,
      getSection,
      getField,
      getFieldLabel,
      getFieldPlaceholder,
      getFieldHelpText,
      getFieldAriaLabel,
      getFieldValidation,
      getFieldOptions,
      getFieldDefaultValue,
      t,
    }),
    [
      mergedConfigs,
      getConfig,
      getSection,
      getField,
      getFieldLabel,
      getFieldPlaceholder,
      getFieldHelpText,
      getFieldAriaLabel,
      getFieldValidation,
      getFieldOptions,
      getFieldDefaultValue,
      t,
    ],
  );

  return (
    <FormConfigContext.Provider value={value}>
      {children}
    </FormConfigContext.Provider>
  );
}

/**
 * Hook to access form configuration context
 * Throws if used outside FormConfigProvider
 */
export function useFormConfig(): FormConfigContextType {
  const context = useContext(FormConfigContext);
  if (!context) {
    throw new Error("useFormConfig must be used within a FormConfigProvider");
  }
  return context;
}

/**
 * Hook to get a specific form config by ID
 */
export function useFormConfigById(formId: string): FormConfig | undefined {
  const { getConfig } = useFormConfig();
  return getConfig(formId);
}

/**
 * Hook to get a specific form section
 */
export function useFormSection(
  formId: string,
  sectionId: string,
): FormSectionConfig | undefined {
  const { getSection } = useFormConfig();
  return getSection(formId, sectionId);
}

/**
 * Hook to get a specific field config
 */
export function useFormField(
  formId: string,
  sectionId: string,
  fieldName: string,
): FieldConfig | undefined {
  const { getField } = useFormConfig();
  return getField(formId, sectionId, fieldName);
}

/**
 * Hook to get translated string
 */
export function useFormTranslation(): (key: string) => string {
  const { t } = useFormConfig();
  return t;
}
