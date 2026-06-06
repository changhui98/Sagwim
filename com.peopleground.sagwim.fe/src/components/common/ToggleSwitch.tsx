import styles from './ToggleSwitch.module.css'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  ariaLabel?: string
  onLabel?: string
  offLabel?: string
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  onLabel,
  offLabel,
}: ToggleSwitchProps) {
  const label = checked ? onLabel : offLabel
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={checked ? styles.trackOn : styles.track}
      onClick={() => onChange(!checked)}
    >
      {label != null && <span className={styles.label}>{label}</span>}
      <span className={styles.knob} />
    </button>
  )
}
