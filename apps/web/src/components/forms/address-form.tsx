'use client';

import * as React from 'react';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddressData {
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export const EMPTY_ADDRESS: AddressData = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
};

interface AddressFormProps {
  value: AddressData;
  onChange: (data: AddressData) => void;
  /** When true, marks Line 1, City, State, Country, Postal Code with * */
  required?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_OPTIONS = [
  { label: 'India', value: 'India' },
  { label: 'United States', value: 'United States' },
  { label: 'United Kingdom', value: 'United Kingdom' },
  { label: 'Canada', value: 'Canada' },
  { label: 'Australia', value: 'Australia' },
  { label: 'UAE', value: 'UAE' },
  { label: 'Singapore', value: 'Singapore' },
  { label: 'Other', value: 'Other' },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Reusable address block — permanent/current address, employee address,
 * institution setup, guardian address, etc.
 *
 * @example
 * const [address, setAddress] = React.useState<AddressData>(EMPTY_ADDRESS);
 * <AddressForm value={address} onChange={setAddress} required />
 */
export function AddressForm({ value, onChange, required }: AddressFormProps) {
  function set(key: keyof AddressData, v: string) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FormField label="Address Line 1" required={required === true}>
        <Input
          value={value.line1}
          onChange={(e) => set('line1', e.target.value)}
          placeholder="Street, building name, house number"
        />
      </FormField>

      <FormField label="Address Line 2">
        <Input
          value={value.line2}
          onChange={(e) => set('line2', e.target.value)}
          placeholder="Apartment, floor, landmark (optional)"
        />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="City" required={required === true}>
          <Input
            value={value.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Mumbai"
          />
        </FormField>
        <FormField label="State / Province" required={required === true}>
          <Input
            value={value.state}
            onChange={(e) => set('state', e.target.value)}
            placeholder="Maharashtra"
          />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Country" required={required === true}>
          <Select
            value={value.country}
            onChange={(e) => set('country', e.target.value)}
            options={COUNTRY_OPTIONS}
          />
        </FormField>
        <FormField label="Postal / PIN Code" required={required === true}>
          <Input
            value={value.postalCode}
            onChange={(e) => set('postalCode', e.target.value)}
            placeholder="400001"
          />
        </FormField>
      </div>
    </div>
  );
}
