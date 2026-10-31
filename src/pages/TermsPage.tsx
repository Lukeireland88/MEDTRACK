import LegalPageShell, { LegalLink, LegalSection } from './LegalPageShell';

export default function TermsPage() {
  return (
    <LegalPageShell
      kicker="Terms"
      title="Terms of Use"
      updated="Last updated 31 October 2026"
    >
      <p>
        These terms cover your use of My Meds Record at{' '}
        <LegalLink to="https://mymedsrecord.co.uk/">mymedsrecord.co.uk</LegalLink>. By creating an
        account or continuing to use the app, you agree to them. Please also read the{' '}
        <LegalLink to="/privacy">Privacy Policy</LegalLink>, which explains how records are stored.
      </p>

      <LegalSection title="A free personal project">
        <p>
          My Meds Record is a personal project. Anyone aged 18 or over can create an account and use
          it free of charge. There is no fee, subscription or paid plan.
        </p>
        <p>
          The person who runs the project provides the app. Questions about these terms can be sent
          to <LegalLink to="mailto:mymedsrecord@gmail.com">mymedsrecord@gmail.com</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="What the app is">
        <p>
          My Meds Record is a personal record-keeping tool. You can use it to organise medications
          you already take and to keep a history of doses, notes, measurements and observations that
          you choose to enter.
        </p>
      </LegalSection>

      <LegalSection title="What it is not">
        <p>
          My Meds Record is not a medical device, not a healthcare provider, and not a source of
          medical advice. It does not diagnose, treat, or decide what medication you should take. It
          must not be relied on in an emergency. If you need urgent help, contact the emergency
          services or follow the advice your clinician has given you.
        </p>
        <p>
          Always follow instructions from your doctor, pharmacist and medication packaging. If the
          app and those instructions disagree, follow the clinical instructions.
        </p>
      </LegalSection>

      <LegalSection title="Your responsibilities">
        <ul className="list-disc space-y-1 pl-5">
          <li>Enter information carefully. You are responsible for the accuracy of what you record.</li>
          <li>
            Keep an export or another copy of anything important. Do not treat this app as your only
            record.
          </li>
          <li>
            You are responsible for decisions you make about your medication. The app does not
            replace clinical advice.
          </li>
          <li>
            Protect your password and only use My Meds Record on devices you trust. Do not share
            your login.
          </li>
          <li>The app is for people aged 18 or over.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your account and your records">
        <p>
          Each account is private to the person who created it. You can download a copy of your
          records and delete your account from <LegalLink to="/settings">Settings</LegalLink>.
          Deletion is permanent and cannot be undone.
        </p>
        <p>
          You can close your account at any time. We may suspend or close an account that is used in
          breach of these terms, including misuse or an attempt to access someone else’s records.
        </p>
      </LegalSection>

      <LegalSection title="Availability">
        <p>
          The app is provided as it is available. We aim to keep it running, but we do not promise
          uninterrupted access, that a record will never be lost, or that it will work on every
          device or browser. Features may be added, changed or removed, and the app may be paused or
          stopped, because it is a personal project run without charge.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You must not:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Use the app for any illegal purpose</li>
          <li>Attempt to access another person’s account or records</li>
          <li>Interfere with the security or operation of the app</li>
          <li>Create an account for someone under 18</li>
        </ul>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          Nothing in these terms limits liability that UK law does not allow us to limit. Because
          the app is a free personal record, you should keep your own copy of important information
          and follow clinical instructions rather than relying on the app alone.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These terms are governed by the laws of the United Kingdom. The app is offered from the
          United Kingdom.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update these terms as the app changes. The date at the top of this page will change
          when we do. Please check it from time to time. If you keep using the app after an update,
          the new terms apply.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
