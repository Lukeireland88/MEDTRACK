import LegalPageShell, { LegalLink, LegalSection } from './LegalPageShell';

export default function PrivacyPage() {
  return (
    <LegalPageShell
      kicker="Privacy"
      title="Privacy"
      updated="Version 1.2 — last updated 18 September 2026"
    >
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        This page explains, in plain English, how My Meds Record handles information you enter. It
        has not been legally reviewed and does not guarantee UK GDPR compliance. A legal operator
        name, UK GDPR article numbers and the Supabase hosting region should still be confirmed
        before a large-scale launch.
      </p>

      <LegalSection title="Who this is for">
        <p>
          My Meds Record is a personal record-keeping tool at{' '}
          <LegalLink to="https://mymedsrecord.co.uk/">mymedsrecord.co.uk</LegalLink>. It is not a
          medical device and it does not give medical advice. Always follow the instructions from
          your doctor, pharmacist or medication packaging.
        </p>
        <p>The service is intended only for users aged 18 or over.</p>
      </LegalSection>

      <LegalSection title="Who operates My Meds Record">
        <p>
          My Meds Record is provided at{' '}
          <LegalLink to="https://mymedsrecord.co.uk/">mymedsrecord.co.uk</LegalLink>. For privacy
          questions, data-rights requests or other contact about this service, email{' '}
          <LegalLink to="mailto:mymedsrecord@gmail.com">mymedsrecord@gmail.com</LegalLink>.
        </p>
        <p>
          A formal operator name (for example, an individual or company name) has not been published
          here yet. You can also download or delete your own records from{' '}
          <LegalLink to="/settings">Settings</LegalLink> while signed in.
        </p>
      </LegalSection>

      <LegalSection title="What we store">
        <p>When you create an account we store:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your email address and a hashed password (handled by Supabase Auth)</li>
          <li>Medications, schedules, time slots and related settings you enter</li>
          <li>Dose records (taken, not taken, and flexible doses)</li>
          <li>Notes, measurements and observations, including seizure logs if you add them</li>
          <li>Appearance preferences you choose, such as handedness and background colour</li>
        </ul>
        <p>
          We do not ask for your name, address or payment details. When you are signed in, appearance
          preferences are stored with your account so they can follow you across devices. If you are
          not signed in, those preferences stay in this browser only.
        </p>
        <p>
          Medication records, observations and measurements may constitute special-category health
          data under UK GDPR because they can reveal information about your health.
        </p>
      </LegalSection>

      <LegalSection title="Why we store it">
        <p>
          We store this information so you can sign in and see your own medications and history on
          the devices you use. We do not sell your data, and we do not use it for advertising.
        </p>
        <p>
          In plain terms, processing happens because you asked us to provide this account and
          record-keeping service, and because you choose to enter the information. The exact UK GDPR
          Article 6 lawful basis (for example contract or consent) and the Article 9 condition for
          health information have not been confirmed in this repository and should be set with
          professional legal advice before a large-scale launch. This policy does not invent those
          article numbers.
        </p>
      </LegalSection>

      <LegalSection title="Where it is kept">
        <p>
          Account and records are stored in the Supabase project used by this app. Supabase provides
          the hosted database and authentication. Your data is kept separate from other users with
          account-based access and row-level security.
        </p>
        <p>
          The hosting region and any international data-transfer safeguards cannot be confirmed from
          this repository. They should be checked in the Supabase Dashboard (project region and, if
          data leaves the UK, the transfer tools in place) and then described here.
        </p>
      </LegalSection>

      <LegalSection title="Who can see it">
        <p>
          Only you can see your records when you are signed in. The person running this site can
          access the hosting platform for maintenance, backups and security. Do not share your
          password, and only use My Meds Record on devices you trust.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          We keep your account and records until you delete them. There is no separate scheduled
          deletion period described in this project. You can download a copy of your data or delete
          your account at any time from Settings.
        </p>
      </LegalSection>

      <LegalSection title="What happens when you delete your account">
        <p>
          If you delete your account from Settings, the app asks for your password, then a protected
          server-side function deletes the signed-in login and the medication records, schedules,
          dose history, notes, observations and related settings stored with that account. This
          cannot be undone. Authentication data stored in this browser for the session is cleared.
          A cached copy of appearance preferences may remain in this browser until you clear site
          data. There is no separate file-storage bucket in this project.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Depending on UK data protection law, you may have rights to access, correct, delete,
          restrict processing, and receive a portable copy of your information, and to withdraw
          consent where consent is the basis used. You can download your records or delete your
          account from Settings. You can also email{' '}
          <LegalLink to="mailto:mymedsrecord@gmail.com">mymedsrecord@gmail.com</LegalLink> to make a
          request.
        </p>
        <p>
          You have the right to complain to the UK Information Commissioner’s Office (ICO) at{' '}
          <LegalLink to="https://ico.org.uk/make-a-complaint/">ico.org.uk/make-a-complaint</LegalLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="Essential browser storage">
        <p>The app uses essential browser storage so it can work:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Authentication session data so you can stay signed in (handled by Supabase Auth)</li>
          <li>
            A cached copy of appearance preferences (handedness and background colour) so the app
            can apply them quickly. When you are signed in, the same preferences are also stored
            with your account
          </li>
          <li>
            A service worker that may cache the application shell and static files (icons, scripts,
            styles) so the app can load more quickly. It is not intended to store your medication
            records, notes or authentication responses for use as a shared offline health archive
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Your choices">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <LegalLink to="/settings">Download all my data</LegalLink> — a JSON file of the records
            stored for your account
          </li>
          <li>
            <LegalLink to="/settings">Delete account</LegalLink> — permanently removes your login and
            the records stored with it
          </li>
          <li>
            <LegalLink to="/terms">Terms of Use</LegalLink> — how the service is meant to be used
          </li>
        </ul>
      </LegalSection>
    </LegalPageShell>
  );
}
