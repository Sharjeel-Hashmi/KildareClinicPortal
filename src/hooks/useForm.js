import { useCallback, useState } from 'react';

const getIn = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

const setIn = (obj, path, value) => {
  const [head, ...rest] = path.split('.');
  if (!rest.length) return { ...obj, [head]: value };
  return { ...obj, [head]: setIn(obj[head] || {}, rest.join('.'), value) };
};

// Form state with dot-path names ("emergencyContact.phone") so nested server errors line up.
export default function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const set = useCallback((path, value) => {
    setValues((v) => setIn(v, path, value));
    setErrors((e) => (e[path] ? { ...e, [path]: undefined } : e));
  }, []);

  // props for <TextField /> and friends
  const bind = (path) => ({
    id: path,
    name: path,
    value: getIn(values, path) ?? '',
    error: errors[path],
    onChange: (e) => set(path, e.target.value),
  });

  // focus the first invalid field so the doctor sees what to fix
  const focusFirstError = (errs) => {
    const first = Object.keys(errs).find((k) => errs[k]);
    if (!first) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(first);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }
    });
  };

  return { values, setValues, errors, setErrors, set, bind, focusFirstError };
}
