// Campi di form riutilizzabili con etichetta ed errore di validazione.

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  inputMode,
  required,
  error,
  hint,
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        className={`field-input ${error ? 'border-red-500 ring-2 ring-red-200' : ''}`}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-gray-500">{hint}</span>
      ) : null}
    </label>
  )
}

export function NumberField(props) {
  return <TextField {...props} type="number" inputMode="decimal" />
}

export function SelectField({ label, value, onChange, options, required }) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <select
        className="field-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <textarea
        className="field-input"
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
