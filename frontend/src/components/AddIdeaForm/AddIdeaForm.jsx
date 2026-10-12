import { useState } from 'react';
import { useIdeas } from '../../hooks/useIdeas.js';

import './AddIdeaForm.css';

const LOCATION_AREAS = ['BYU-Idaho Campus', 'Downtown Rexburg', 'Outside Rexburg'];
const CATEGORIES = ['Active', 'Animals', 'Creative', 'Food', 'Outdoors', 'Show'];

const EMPTY_FORM = {
  title: '',
  place_name: '',
  address: '',
  location: '',
  price: '',
  duration: '',
  category: '',
  description: '',
};

// Returns { fieldName: message } for every missing or invalid field.
function validate(values) {
  const errors = {};

  if (!values.title.trim()) errors.title = 'Give your idea a title.';
  if (!values.place_name.trim()) errors.place_name = 'Add the name of the place.';
  if (!values.address.trim()) errors.address = 'Add the address.';
  if (!values.location) errors.location = 'Choose a location area.';
  if (!values.category) errors.category = 'Choose a category.';
  if (!values.description.trim()) errors.description = 'Add a short description.';

  if (values.price === '') {
    errors.price = 'Add the price per person (0 if it is free).';
  } else if (Number.isNaN(Number(values.price))) {
    errors.price = 'Price must be a number.';
  } else if (Number(values.price) < 0) {
    errors.price = 'Price cannot be less than 0.';
  }

  if (values.duration === '') {
    errors.duration = 'Add how long it takes, in minutes.';
  } else if (!Number.isInteger(Number(values.duration))) {
    errors.duration = 'Duration must be a whole number of minutes.';
  } else if (Number(values.duration) < 1) {
    errors.duration = 'Duration must be at least 1 minute.';
  }

  return errors;
}

/** A form that adds a new date idea to the PocketBase dates collection (DD-06). */
export default function AddIdeaForm() {
  const { addIdea } = useIdeas();
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    // Clear a field's error as soon as you start fixing it.
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    const newErrors = validate(values);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const idea = await addIdea({
        title: values.title.trim(),
        place_name: values.place_name.trim(),
        address: values.address.trim(),
        location: values.location,
        price: Number(values.price),
        duration: Number(values.duration),
        category: values.category,
        description: values.description.trim(),
      });
      setValues(EMPTY_FORM);
      setMessage({ type: 'success', text: `“${idea.title}” was added. Thanks!` });
    } catch {
      setMessage({
        type: 'error',
        text: 'We could not save your idea. Check your connection and try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  // Shared props that connect an input to its label and error message.
  function fieldProps(name) {
    return {
      id: `add-idea-${name}`,
      name,
      value: values[name],
      onChange: handleChange,
      'aria-invalid': errors[name] ? 'true' : undefined,
      'aria-describedby': errors[name] ? `add-idea-${name}-error` : undefined,
    };
  }

  function fieldError(name) {
    if (!errors[name]) return null;
    return (
      <p className="add-idea__error" id={`add-idea-${name}-error`}>
        {errors[name]}
      </p>
    );
  }

  return (
    <form
      className="add-idea"
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="add-idea-heading"
    >
      <h2 id="add-idea-heading">Add a date idea</h2>

      <div className="add-idea__field">
        <label htmlFor="add-idea-title">Title</label>
        <input type="text" {...fieldProps('title')} />
        {fieldError('title')}
      </div>

      <div className="add-idea__field">
        <label htmlFor="add-idea-place_name">Place</label>
        <input type="text" {...fieldProps('place_name')} />
        {fieldError('place_name')}
      </div>

      <div className="add-idea__field">
        <label htmlFor="add-idea-address">Address</label>
        <input type="text" autoComplete="street-address" {...fieldProps('address')} />
        {fieldError('address')}
      </div>

      <div className="add-idea__field">
        <label htmlFor="add-idea-location">Location area</label>
        <select {...fieldProps('location')}>
          <option value="">Choose an area</option>
          {LOCATION_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
        {fieldError('location')}
      </div>

      <div className="add-idea__row">
        <div className="add-idea__field">
          <label htmlFor="add-idea-price">Price per person ($)</label>
          <input type="number" min="0" step="0.01" inputMode="decimal" {...fieldProps('price')} />
          {fieldError('price')}
        </div>

        <div className="add-idea__field">
          <label htmlFor="add-idea-duration">Duration (minutes)</label>
          <input type="number" min="1" step="1" inputMode="numeric" {...fieldProps('duration')} />
          {fieldError('duration')}
        </div>
      </div>

      <div className="add-idea__field">
        <label htmlFor="add-idea-category">Category</label>
        <select {...fieldProps('category')}>
          <option value="">Choose a category</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {fieldError('category')}
      </div>

      <div className="add-idea__field">
        <label htmlFor="add-idea-description">Description</label>
        <textarea rows="4" {...fieldProps('description')} />
        {fieldError('description')}
      </div>

      <button className="add-idea__submit" type="submit" disabled={saving}>
        {saving ? 'Adding…' : 'Add idea'}
      </button>

      {message?.type === 'success' && (
        <p className="add-idea__message add-idea__message--success" role="status">
          {message.text}
        </p>
      )}
      {message?.type === 'error' && (
        <p className="add-idea__message add-idea__message--error" role="alert">
          {message.text}
        </p>
      )}
    </form>
  );
}
