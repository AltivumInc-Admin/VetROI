import { useState } from 'react'
import { VeteranRequest, Branch, Education, US_STATES } from '../types'

interface VeteranFormProps {
  onSubmit: (data: VeteranRequest) => void
  loading?: boolean
  initialData?: VeteranRequest | null
}

const BRANCHES: { value: Branch; label: string }[] = [
  { value: 'army', label: 'Army' },
  { value: 'navy', label: 'Navy' },
  { value: 'marine_corps', label: 'Marine Corps' },
  { value: 'air_force', label: 'Air Force' },
  { value: 'space_force', label: 'Space Force' },
  { value: 'coast_guard', label: 'Coast Guard' },
]

const EDUCATION_LEVELS: { value: Education; label: string }[] = [
  { value: 'high_school', label: 'High School' },
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate' },
]

export default function VeteranForm({ onSubmit, loading, initialData }: VeteranFormProps) {
  const [formData, setFormData] = useState<VeteranRequest>(
    initialData || {
      branch: 'army',
      code: '',
      homeState: 'TN',
      relocate: false,
      education: 'bachelor',
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="veteran-form">
      <h2>Tell Us About Your Military Service</h2>
      
      <div className="form-group">
        <label htmlFor="branch">Branch of Service</label>
        <select
          id="branch"
          name="branch"
          value={formData.branch}
          onChange={handleChange}
          required
        >
          {BRANCHES.map(branch => (
            <option key={branch.value} value={branch.value}>
              {branch.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="code">Military Occupation Code (MOS/AFSC/Rate)</label>
        <input
          type="text"
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="e.g., 11B, 68W, 25B"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="homeState">Current State</label>
        <select
          id="homeState"
          name="homeState"
          value={formData.homeState}
          onChange={handleChange}
          required
        >
          {US_STATES.map(state => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <div className="checkbox-container">
          <input
            type="checkbox"
            id="relocate"
            name="relocate"
            checked={formData.relocate}
            onChange={handleChange}
          />
          <label htmlFor="relocate" className="checkbox-label">
            Willing to relocate
          </label>
        </div>
      </div>

      {formData.relocate && (
        <div className="form-group">
          <label htmlFor="relocateState">Preferred State for Relocation</label>
          <select
            id="relocateState"
            name="relocateState"
            value={formData.relocateState || ''}
            onChange={handleChange}
            required
          >
            <option value="">Select a state</option>
            {US_STATES.map(state => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="education">Highest Education Level</label>
        <select
          id="education"
          name="education"
          value={formData.education}
          onChange={handleChange}
          required
        >
          {EDUCATION_LEVELS.map(level => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={loading} className="submit-button">
        {loading ? 'Getting Recommendations...' : 'Get Career Recommendations'}
      </button>
    </form>
  )
}