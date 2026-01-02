/**
 * FormField Component
 * Wrapper for form fields with label and error display
 */

const FormField = ({
  label,
  name,
  error,
  required = false,
  children,
  className = '',
  helpText,
}) => {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-foreground mb-1"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {helpText && !error && (
        <p className="mt-1 text-sm text-muted-foreground">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

export default FormField
