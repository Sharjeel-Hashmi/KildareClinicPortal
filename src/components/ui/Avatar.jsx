import { initials } from '../../utils/format.js';

const sizes = {
  sm: 'size-9 text-sm',
  md: 'size-11 text-base',
  lg: 'size-16 text-2xl',
};

export default function Avatar({ patient, size = 'md', className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-gold-100 font-display font-bold text-gold-700 ${sizes[size]} ${className}`}
    >
      {initials(patient)}
    </span>
  );
}
