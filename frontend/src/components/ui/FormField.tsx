import * as React from "react";
import {
  forwardRef,
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useState,
} from "react";
import { useFormConfig } from "../../lib/formConfigProvider";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "../../lib/utils";

interface FormFieldProps {
  formId: string;
  sectionId: string;
  fieldName: string;
  formData?: Record<string, unknown>;
  onChange?: (name: string, value: unknown) => void;
  onBlur?: (name: string) => void;
  className?: string;
  disabled?: boolean;
  showLabel?: boolean;
  showHelpText?: boolean;
  showError?: boolean;
}

type ForwardedInputProps = InputHTMLAttributes<HTMLInputElement> &
  SelectHTMLAttributes<HTMLSelectElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement>;

export const FormField = forwardRef<
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLButtonElement,
  FormFieldProps & ForwardedInputProps
>(
  (
    {
      formId,
      sectionId,
      fieldName,
      formData = {},
      onChange,
      onBlur,
      className,
      disabled: disabledProp,
      showLabel = true,
      showHelpText = true,
      showError = true,
      type: inputType = "text",
      ...props
    },
    ref,
  ) => {
    const {
      getField,
      getFieldLabel,
      getFieldPlaceholder,
      getFieldHelpText,
      getFieldAriaLabel,
      getFieldValidation,
      getFieldOptions,
      getFieldDefaultValue,
    } = useFormConfig();

    const field = getField(formId, sectionId, fieldName);

    if (!field) {
      return (
        <div className={cn("text-red-500 text-sm", className)}>
          Field "{fieldName}" not found in form "{formId}" section "{sectionId}"
        </div>
      );
    }

    const label = getFieldLabel(formId, sectionId, fieldName);
    const placeholder = getFieldPlaceholder(formId, sectionId, fieldName);
    const helpText = getFieldHelpText(formId, sectionId, fieldName);
    const ariaLabel = getFieldAriaLabel(formId, sectionId, fieldName);
    const validation = getFieldValidation(formId, sectionId, fieldName);
    const options = getFieldOptions(formId, sectionId, fieldName);
    const defaultValue = getFieldDefaultValue(formId, sectionId, fieldName);
    const disabled = disabledProp || field.disabled;
    const required = field.required || validation?.required;
    const variant = field.variant || "default";
    const size = field.size || "default";

    // Determine current value from formData or defaultValue
    const currentValue = formData[fieldName] ?? defaultValue ?? "";

    // Check if field should be rendered based on condition
    if (field.condition && !field.condition(formData)) {
      return null;
    }

    // Custom render function
    if (field.render) {
      return field.render(field, formData);
    }

    // Handle different field types
    switch (field.type) {
      case "checkbox": {
        return (
          <div className={cn("flex items-center gap-2", className)}>
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type="checkbox"
              id={`${formId}-${sectionId}-${fieldName}`}
              name={fieldName}
              checked={Boolean(currentValue)}
              onChange={(e) => onChange?.(fieldName, e.target.checked)}
              onBlur={() => onBlur?.(fieldName)}
              disabled={disabled}
              required={required}
              className={cn(
                "h-4 w-4 rounded border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)]",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              aria-label={ariaLabel || label}
              {...props}
            />
            {showLabel && (
              <label
                htmlFor={`${formId}-${sectionId}-${fieldName}`}
                className={cn(
                  "text-sm font-medium text-[var(--color-text-primary)] cursor-pointer",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                {label}
              </label>
            )}
            {showHelpText && helpText && (
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {helpText}
              </span>
            )}
          </div>
        );
      }

      case "select": {
        return (
          <div className={cn("grid gap-2", className)}>
            {showLabel && (
              <label
                htmlFor={`${formId}-${sectionId}-${fieldName}`}
                className="text-sm font-semibold text-[var(--color-text-primary)]"
              >
                {label}
                {required && (
                  <span className="text-[var(--color-text-danger)] ml-1">
                    *
                  </span>
                )}
              </label>
            )}
            <select
              ref={ref as React.Ref<HTMLSelectElement>}
              id={`${formId}-${sectionId}-${fieldName}`}
              name={fieldName}
              value={currentValue as string}
              onChange={(e) => onChange?.(fieldName, e.target.value)}
              onBlur={() => onBlur?.(fieldName)}
              disabled={disabled}
              required={required}
              aria-label={ariaLabel || label}
              className={cn(
                "rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent transition-all",
                disabled && "opacity-50 cursor-not-allowed",
                size === "sm" && "px-3 py-2 text-sm",
                size === "icon" && "p-2",
              )}
              {...props}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options?.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
            {showHelpText && helpText && (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {helpText}
              </p>
            )}
          </div>
        );
      }

      case "textarea": {
        return (
          <div className={cn("grid gap-2", className)}>
            {showLabel && (
              <label
                htmlFor={`${formId}-${sectionId}-${fieldName}`}
                className="text-sm font-semibold text-[var(--color-text-primary)]"
              >
                {label}
                {required && (
                  <span className="text-[var(--color-text-danger)] ml-1">
                    *
                  </span>
                )}
              </label>
            )}
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={`${formId}-${sectionId}-${fieldName}`}
              name={fieldName}
              value={currentValue as string}
              onChange={(e) => onChange?.(fieldName, e.target.value)}
              onBlur={() => onBlur?.(fieldName)}
              disabled={disabled}
              required={required}
              placeholder={placeholder}
              aria-label={ariaLabel || label}
              className={cn(
                "min-h-[100px] rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent transition-all resize-y",
                disabled && "opacity-50 cursor-not-allowed",
                size === "sm" && "px-3 py-2 text-sm",
              )}
              {...props}
            />
            {showHelpText && helpText && (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {helpText}
              </p>
            )}
          </div>
        );
      }

      case "button":
      case "submit": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { onClick: _onClick, ...buttonProps } = props;
        return (
          <Button
            // Button doesn't forward ref, so we don't pass ref
            variant={variant}
            size={size}
            disabled={disabled}
            onClick={() => {
              // Call field.onClick if defined
              field.onClick?.();
              // Call onChange with formData if provided
              if (onChange) {
                onChange(fieldName, formData);
              }
            }}
            className={className}
            aria-label={ariaLabel || label}
            type={field.type === "submit" ? "submit" : "button"}
            {...buttonProps}
          >
            {label}
          </Button>
        );
      }

      case "radio": {
        return (
          <div className={cn("grid gap-2", className)}>
            {showLabel && (
              <label className="text-sm font-semibold text-[var(--color-text-primary)]">
                {label}
                {required && (
                  <span className="text-[var(--color-text-danger)] ml-1">
                    *
                  </span>
                )}
              </label>
            )}
            <div
              className="flex flex-wrap gap-4"
              role="radiogroup"
              aria-label={ariaLabel || label}
            >
              {options?.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <input
                    type="radio"
                    name={fieldName}
                    value={option.value}
                    checked={currentValue === option.value}
                    onChange={(e) => onChange?.(fieldName, e.target.value)}
                    onBlur={() => onBlur?.(fieldName)}
                    disabled={disabled || option.disabled}
                    required={required}
                    className={cn(
                      "h-4 w-4 rounded-full border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)]",
                      disabled && "opacity-50 cursor-not-allowed",
                    )}
                  />
                  <span className="text-sm text-[var(--color-text-primary)]">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
            {showHelpText && helpText && (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {helpText}
              </p>
            )}
          </div>
        );
      }

      case "date": {
        return (
          <div className={cn("grid gap-2", className)}>
            {showLabel && (
              <label
                htmlFor={`${formId}-${sectionId}-${fieldName}`}
                className="text-sm font-semibold text-[var(--color-text-primary)]"
              >
                {label}
                {required && (
                  <span className="text-[var(--color-text-danger)] ml-1">
                    *
                  </span>
                )}
              </label>
            )}
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type="date"
              id={`${formId}-${sectionId}-${fieldName}`}
              name={fieldName}
              value={currentValue as string}
              onChange={(e) => onChange?.(fieldName, e.target.value)}
              onBlur={() => onBlur?.(fieldName)}
              disabled={disabled}
              required={required}
              placeholder={placeholder}
              aria-label={ariaLabel || label}
              min={
                validation?.min
                  ? new Date(validation.min as number)
                      .toISOString()
                      .split("T")[0]
                  : undefined
              }
              max={
                validation?.max
                  ? new Date(validation.max as number)
                      .toISOString()
                      .split("T")[0]
                  : undefined
              }
              className={cn(
                "rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent transition-all",
                disabled && "opacity-50 cursor-not-allowed",
                size === "sm" && "px-3 py-2 text-sm",
              )}
              {...props}
            />
            {showHelpText && helpText && (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {helpText}
              </p>
            )}
          </div>
        );
      }

      case "email":
      case "password":
      case "number":
      case "text":
      default: {
        const inputMode =
          field.inputMode || (field.type === "number" ? "numeric" : "text");
        return (
          <div className={cn("grid gap-2", className)}>
            {showLabel && (
              <label
                htmlFor={`${formId}-${sectionId}-${fieldName}`}
                className="text-sm font-semibold text-[var(--color-text-primary)]"
              >
                {label}
                {required && (
                  <span className="text-[var(--color-text-danger)] ml-1">
                    *
                  </span>
                )}
              </label>
            )}
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type={field.type}
              id={`${formId}-${sectionId}-${fieldName}`}
              name={fieldName}
              value={currentValue as string}
              onChange={(e) => onChange?.(fieldName, e.target.value)}
              onBlur={() => onBlur?.(fieldName)}
              disabled={disabled}
              required={required}
              placeholder={placeholder}
              aria-label={ariaLabel || label}
              inputMode={inputMode}
              min={validation?.min as number | undefined}
              max={validation?.max as number | undefined}
              minLength={validation?.minLength as number | undefined}
              maxLength={validation?.maxLength as number | undefined}
              pattern={validation?.pattern}
              className={cn(
                "rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent transition-all",
                disabled && "opacity-50 cursor-not-allowed",
                size === "sm" && "px-3 py-2 text-sm",
              )}
              {...props}
            />
            {showHelpText && helpText && (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {helpText}
              </p>
            )}
            {showError && validation?.custom && (
              <p className="text-xs text-[var(--color-text-danger)]">
                {validation.custom(currentValue)}
              </p>
            )}
          </div>
        );
      }
    }
  },
);

FormField.displayName = "FormField";

/**
 * FormSection component - renders a section of fields from form config
 */
interface FormSectionProps {
  formId: string;
  sectionId: string;
  formData?: Record<string, unknown>;
  onChange?: (name: string, value: unknown) => void;
  onBlur?: (name: string) => void;
  className?: string;
  disabled?: boolean;
  showLabels?: boolean;
  showHelpText?: boolean;
}

export function FormSection({
  formId,
  sectionId,
  formData = {},
  onChange,
  onBlur,
  className,
  disabled,
  showLabels = true,
  showHelpText = true,
}: FormSectionProps) {
  const { getSection } = useFormConfig();
  const section = getSection(formId, sectionId);

  if (!section) {
    return (
      <div className={cn("text-red-500 text-sm", className)}>
        Section "{sectionId}" not found in form "{formId}"
      </div>
    );
  }

  const layout = section.layout || "vertical";

  return (
    <div className={cn("space-y-4", className)}>
      {section.title && (
        <div className="grid gap-1">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {section.title}
          </h3>
          {section.description && (
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {section.description}
            </p>
          )}
        </div>
      )}
      <div
        className={cn(
          "space-y-4",
          layout === "horizontal" && "flex flex-wrap items-end gap-4",
          layout === "grid" && "grid gap-4 sm:grid-cols-2",
          layout === "vertical" && "space-y-4",
        )}
      >
        {section.fields.map((field) => (
          <FormField
            key={field.name}
            formId={formId}
            sectionId={sectionId}
            fieldName={field.name}
            formData={formData}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            showLabel={showLabels}
            showHelpText={showHelpText}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={onChange as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onBlur={onBlur as any}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * DynamicForm component - renders an entire form from config
 */
interface DynamicFormProps {
  formId: string;
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => Promise<void> | void;
  onCancel?: () => void;
  className?: string;
  disabled?: boolean;
  showLabels?: boolean;
  showHelpText?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export function DynamicForm({
  formId,
  initialData = {},
  onSubmit,
  onCancel,
  className,
  disabled,
  showLabels = true,
  showHelpText = true,
  submitLabel,
  cancelLabel,
}: DynamicFormProps) {
  const { getConfig, t } = useFormConfig();
  const [formData, setFormData] =
    useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = getConfig(formId);

  if (!config) {
    return (
      <div className={cn("text-red-500 text-sm", className)}>
        Form "{formId}" not found
      </div>
    );
  }

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (name: string) => {
    // Validate on blur
    const field = config.sections
      .flatMap((s) => s.fields)
      .find((f) => f.name === name);
    if (field?.validation) {
      const error = validateField(field, formData[name]);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    }
  };

  const validateField = (
    field: (typeof config.sections)[0]["fields"][0],
    value: unknown,
  ): string | undefined => {
    const { validation } = field;
    if (!validation) return undefined;

    if (
      validation.required &&
      (!value || (typeof value === "string" && value.trim() === ""))
    ) {
      return t("common.required") || "This field is required";
    }

    if (typeof value === "string") {
      if (validation.minLength && value.length < validation.minLength) {
        return (
          t("fields.minLength") || `Minimum ${validation.minLength} characters`
        );
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        return (
          t("fields.maxLength") || `Maximum ${validation.maxLength} characters`
        );
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        return (
          validation.custom?.(value) ||
          t("fields.invalidFormat") ||
          "Invalid format"
        );
      }
    }

    if (typeof value === "number") {
      if (validation.min !== undefined && value < validation.min) {
        return t("fields.minValue") || `Minimum value is ${validation.min}`;
      }
      if (validation.max !== undefined && value > validation.max) {
        return t("fields.maxValue") || `Maximum value is ${validation.max}`;
      }
    }

    if (validation.custom) {
      return validation.custom(value);
    }

    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    for (const section of config.sections) {
      for (const field of section.fields) {
        const error = validateField(field, formData[field.name]);
        if (error) {
          newErrors[field.name] = error;
          hasErrors = true;
        }
      }
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButtonLabel =
    submitLabel || config.submitLabel || t("common.submit") || "Submit";
  const cancelButtonLabel =
    cancelLabel || config.cancelLabel || t("common.cancel") || "Cancel";

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {config.title && (
        <div className="grid gap-1">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {config.title}
          </h2>
          {config.description && (
            <p className="text-[var(--color-text-secondary)]">
              {config.description}
            </p>
          )}
        </div>
      )}

      {config.sections.map((section) => (
        <FormSection
          key={section.id}
          formId={formId}
          sectionId={section.id}
          formData={formData}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled || isSubmitting}
          showLabels={showLabels}
          showHelpText={showHelpText}
        />
      ))}

      {(onSubmit || onCancel) && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 pt-4",
            config.sections.length > 0 &&
              "border-t border-[var(--color-card-border)]",
          )}
        >
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelButtonLabel}
            </Button>
          )}
          {onSubmit && (
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="ms-auto"
            >
              {isSubmitting
                ? t("common.loading") || "Loading..."
                : submitButtonLabel}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
