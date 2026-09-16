import LegalPageShell, { LegalLink, LegalSection } from './LegalPageShell';

export default function TermsPage() {
  return (
    <LegalPageShell
      kicker="Terms"
      title="Terms of Use"
      updated="Version 1.0 — last updated 16 September 2026"
    >
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        This wording is a plain-English starting point. It should receive professional legal review
        before a large-scale launch. It does not create a guaranteed contract and has not been
        legally reviewed.
      </p>

      <LegalSection title="What My Meds Record is">
        <p>
          My Meds Record is a personal record-keeping tool at{' '}
          <LegalLink to="https://mymedsrecord.co.uk/">mymedsrecord.co.uk</LegalLink>. You can use it
          to organise medications you already take and to keep a history of doses, notes,
          measurements and observations that you choose to enter.
        </p>
      </LegalSection>

      <LegalSection title="What it is not">
        <p>
          My Meds Record is not a medical device, not a healthcare provider, and not a source of
          medical advice. It does not diagnose, treat, or decide what medication you should take. It
          must not be relied on in an emergency. If you need urgent help, use the emergency services
          or the advice your clinician has given you.
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
            Keep an export or another copy of important information. Do not treat this app as your
            only record.
          </li>
          <li>
            Protect your password and only use My Meds Record on devices you trust. Do not share
            your login.
          </li>
          <li>
            The service is intended for people aged 18 or over.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Availability">
        <p>
          We aim to keep the service available, but we cannot guarantee uninterrupted access,
          backups, or that the app will always work on every device or browser. Features may change.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          You must not misuse the service, attempt unauthorised access to other accounts or systems,
          interfere with security, or use the service for any illegal purpose.
        </p>
      </LegalSection>

      <LegalSection title="Accounts and your data">
        <p>
          You can download a copy of your records and delete your account from{' '}
          <LegalLink to="/settings">Settings</LegalLink>. Deletion is permanent. How records are
          stored is described in the <LegalLink to="/privacy">Privacy Policy</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These Terms are intended to be read under the laws of the United Kingdom. The operator’s
          exact legal status (for example, whether the service is run by an individual or a
          company) is not stated in this repository and should be confirmed before a large-scale
          launch.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update these Terms. The version and date at the top of this page will change when
          we do. Continued use after an update means you should read the new wording.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
