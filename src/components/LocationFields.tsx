import { useId, useState } from "react";

const cities = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Udaipur", "Goa", "Kochi", "Alibaug", "Coorg", "Nashik", "Lonavala", "Mysuru", "Rishikesh", "Shimla", "Manali"];
const airports = [
  ["BOM", "Mumbai"], ["DEL", "Delhi"], ["BLR", "Bengaluru"],
  ["MAA", "Chennai"], ["HYD", "Hyderabad"], ["CCU", "Kolkata"],
  ["PNQ", "Pune"], ["AMD", "Ahmedabad"], ["JAI", "Jaipur"],
  ["UDR", "Udaipur"], ["GOI", "Goa Dabolim"], ["GOX", "Goa Manohar"],
  ["COK", "Kochi"], ["TRV", "Thiruvananthapuram"], ["IXC", "Chandigarh"],
];

export function LocationField({label, value, onChange}: {label: string; value: string; onChange: (value: string) => void}) {
  const id = useId();
  return <label><span className="field-label">{label}</span>
    <input className="form-field" list={id} value={value} maxLength={120}
      placeholder="Choose or type a city" onChange={e => onChange(e.target.value)} />
    <datalist id={id}>{cities.map(city => <option key={city} value={city} />)}</datalist>
  </label>;
}

export function AirportField({label, value, onChange}: {label: string; value?: string; onChange: (value?: string) => void}) {
  const [custom, setCustom] = useState(!!value && !airports.some(([code]) => code === value));
  return <div><label><span className="field-label">{label}</span>
    <select aria-label={label} className="form-field" value={custom ? "custom" : value || ""}
      onChange={e => { setCustom(e.target.value === "custom"); onChange(e.target.value === "custom" ? undefined : e.target.value || undefined); }}>
      <option value="">No flight search</option>
      {airports.map(([code, city]) => <option key={code} value={code}>{city} ({code})</option>)}
      <option value="custom">Other airport - enter code</option>
    </select></label>
    {custom && <label><span className="field-label mt-2">{label} code</span>
      <input className="form-field" placeholder="3-letter IATA code" maxLength={3} value={value || ""}
        onChange={e => onChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, "") || undefined)} />
    </label>}
  </div>;
}
