import React, { useState, useRef } from 'react';
import { validateWaiver, isValid } from '../../utils/helpers.js';
import NavButtons from '../NavButtons.jsx';

const WAIVER_TEXT = `PARTICIPANT LIABILITY WAIVER AND RELEASE OF CLAIMS

Please read this waiver carefully before agreeing. By checking the box below, you acknowledge that you have read, understood, and agree to the following terms.

1. ASSUMPTION OF RISK
I understand that participation in the selected course involves physical activities and the use of tools, equipment, and materials that carry inherent risks. These risks include, but are not limited to, cuts, burns, falls, and exposure to dust or fumes. I voluntarily assume all such risks, whether known or unknown, and accept full responsibility for any injury, illness, or property damage that may result from my participation.

2. RELEASE OF LIABILITY
In consideration of being permitted to participate in the course, I hereby release, waive, discharge, and covenant not to sue the Learning Center, its directors, officers, employees, volunteers, agents, and facility owners (collectively, "Released Parties") from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury, including death, that may be sustained by me while participating in the course or while on the premises.

3. INDEMNIFICATION
I agree to indemnify and hold harmless the Released Parties from any loss, liability, damage, or costs, including court costs and attorneys' fees, that they may incur due to my participation in the course, whether caused by the negligence of the Released Parties or otherwise.

4. MEDICAL AUTHORIZATION
I authorize the Learning Center staff to seek emergency medical treatment on my behalf if I am unable to do so myself. I understand that I am responsible for all costs associated with such treatment. I represent that I am in good physical health and have no medical conditions that would prevent my safe participation in the course.

5. PHOTO AND MEDIA RELEASE
I grant the Learning Center permission to photograph, film, or otherwise record my participation in the course and to use such recordings for educational, promotional, or marketing purposes without compensation to me.

6. CODE OF CONDUCT
I agree to follow all safety instructions provided by instructors and staff, to treat other participants and staff with respect, and to comply with all facility rules. I understand that failure to do so may result in removal from the course without refund.

7. GOVERNING LAW
This waiver shall be governed by and construed in accordance with the laws of the state in which the Learning Center is located. Any disputes arising under this waiver shall be resolved exclusively in the courts of that jurisdiction.

8. SEVERABILITY
If any provision of this waiver is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that this waiver shall otherwise remain in full force and effect and enforceable.

By checking the box below, I confirm that I am 18 years of age or older (or have obtained parental/guardian consent), that I have read this entire waiver, and that I agree to be bound by its terms.`;

export default function Waiver({ waiverAccepted, onNext, onBack }) {
  const [accepted, setAccepted] = useState(waiverAccepted);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [errors, setErrors] = useState({});
  const scrollRef = useRef(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
    if (atBottom) setHasScrolled(true);
  };

  const handleCheck = (e) => {
    setAccepted(e.target.checked);
    if (errors.waiver) setErrors({});
  };

  const handleNext = () => {
    const errs = validateWaiver(accepted);
    if (!isValid(errs)) {
      setErrors(errs);
      return;
    }
    onNext(accepted);
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2 className="step-title">Liability Waiver</h2>
        <p className="step-subtitle">Please read the full waiver below. Scroll to the bottom to enable the agreement checkbox.</p>
      </div>

      <div className="waiver-scroll-wrapper">
        <div
          className="waiver-text"
          ref={scrollRef}
          onScroll={handleScroll}
          tabIndex={0}
          aria-label="Liability waiver text, scroll to read"
          role="region"
        >
          {WAIVER_TEXT.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        {!hasScrolled && (
          <div className="waiver-scroll-hint" aria-live="polite">
            ↓ Scroll to read the full waiver
          </div>
        )}
      </div>

      <div className={`waiver-agree ${!hasScrolled ? 'disabled' : ''}`}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={accepted}
            onChange={handleCheck}
            disabled={!hasScrolled}
            aria-describedby={errors.waiver ? 'waiver-error' : undefined}
          />
          <span>
            I have read and agree to the Participant Liability Waiver and Release of Claims.
          </span>
        </label>
        {!hasScrolled && (
          <p className="waiver-disabled-note">You must scroll through the entire waiver before agreeing.</p>
        )}
        {errors.waiver && (
          <span id="waiver-error" className="field-error" role="alert">{errors.waiver}</span>
        )}
      </div>

      <NavButtons step={3} onBack={onBack} onNext={handleNext} isLastStep={false} />
    </div>
  );
}
