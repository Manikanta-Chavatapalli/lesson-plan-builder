const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  as = 'input',
  rows = 3,
  options = [],
}) => {
  if (type === 'select') {
    return (
      <div className={`form-field ${error ? 'form-field--error' : ''}`}>
        <label htmlFor={name}>
          {label}
          {required && <span className="form-field__required">*</span>}
        </label>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="form-field__error">{error}</span>}
      </div>
    );
  }

  const InputComponent = as === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={`form-field ${error ? 'form-field--error' : ''}`}>
      <label htmlFor={name}>
        {label}
        {required && <span className="form-field__required">*</span>}
      </label>
      <InputComponent
        id={name}
        name={name}
        type={as === 'textarea' ? undefined : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={as === 'textarea' ? rows : undefined}
        required={required}
      />
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
};

export default FormField;
