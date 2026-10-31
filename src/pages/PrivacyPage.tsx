import LegalPageShell, { LegalLink, LegalSection } from './LegalPageShell';

export default function PrivacyPage() {
  return (
    <LegalPageShell
      kicker="Privacy"
      title="Privacy Policy"
      updated="Last updated 31 October 2026"
    >
      <p>
        This policy explains what My Meds Record collects, why we use it, who we share it with, and
        the choices you have. It covers the app at{' '}
        <LegalLink to="https://mymedsrecord.co.uk/">mymedsrecord.co.uk</LegalLink>.
      </p>

      <LegalSection title="Who we are">
        <p>
          My Meds Record is a personal project, offered free of charge. There is no fee, subscription
          or paid plan. The person who runs the project is the data controller for the information
          described on this page. The app is offered in the United Kingdom. For privacy questions, or
          to use any of the rights below, email{' '}
          <LegalLink to="mailto:mymedsrecord@gmail.com">mymedsrecord@gmail.com</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="What this app is">
        <p>
          My Meds Record is a personal record-keeping tool that other people can use for free. You
          can use it to organise medications you already take and to keep a history of doses, notes,
          measurements and observations that you choose to enter.
        </p>
        <p>
          It is not a medical device, not a healthcare provider, and not a source of medical advice.
          Always follow the instructions from your doctor, pharmacist or medication packaging. The
          app is for people aged 18 or over.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>When you create an account we store:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your email address</li>
          <li>
            Your password, stored only as a cryptographic hash by our authentication provider. We
            cannot read it
          </li>
          <li>The fact that your email address has been confirmed, and the time you sign in</li>
        </ul>
        <p>Records you choose to add can include:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Medication names, schedules, time slots, course and pause dates, notes, and any dose
            limits you set
          </li>
          <li>Dose history, including doses marked taken or not taken, reasons, and times</li>
          <li>Seizure logs, including time, duration and notes</li>
          <li>
            Notes, visits, and measurements such as oxygen level, pulse, blood pressure,
            temperature, pain score and alertness
          </li>
        </ul>
        <p>
          If you are signed in, appearance settings (whether controls sit on the left or the right,
          and the background colour) are saved with your account so they can follow you between
          devices. A copy is also kept in this browser so the app can apply them quickly. If you are
          not signed in, those settings stay in this browser only.
        </p>
        <p>
          We do not ask for your legal name, postal address, phone number, NHS number or payment
          details, because there is nothing to pay for. We do not use advertising or analytics
          tools, and we do not sell your information or use it to train machine-learning models.
        </p>
        <p>
          Our providers may record technical details needed to run and protect the service, such as
          an IP address, browser type and the time of a sign-in. If you email us, we keep that
          message so we can reply.
        </p>
      </LegalSection>

      <LegalSection title="Why we use it">
        <p>
          We use your email address, password and appearance settings because we need them to
          provide the free account you asked for. There is no charge for that account. The UK GDPR
          lawful basis is Article 6(1)(b): processing needed to provide a service someone has
          requested.
        </p>
        <p>
          Medication records, dose history, seizure logs, measurements, visits and notes can reveal
          information about your health. That is special category data. We process it only with your
          explicit consent (Article 6(1)(a) and Article 9(2)(a)). You give that consent when you
          create an account, after being told that we will process the health information you choose
          to enter, and when you add a record. We only store health information you add.
        </p>
        <p>
          You can withdraw that consent at any time by deleting the record, or by deleting your
          account from <LegalLink to="/settings">Settings</LegalLink>. We will then remove it from
          the live service. We cannot keep the record without your consent.
        </p>
        <p>
          We use limited technical information, such as sign-in times and IP addresses recorded by
          our providers, to keep accounts secure and to prevent misuse. The lawful basis is our
          legitimate interest in protecting the service (Article 6(1)(f)). You can object to this,
          as described under Your rights.
        </p>
        <p>
          If you email us, we use your message to respond. We do not use your records for automated
          decisions that produce a legal or similarly significant effect.
        </p>
      </LegalSection>

      <LegalSection title="Who we share it with">
        <p>
          Your records are private to your account. Other users cannot see them. We do not send them
          to a doctor, pharmacy, insurer or advertiser. If you want someone else to see a record,
          you can download it and share that file yourself.
        </p>
        <p>We use these providers to run the service:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <LegalLink to="https://supabase.com/">Supabase</LegalLink> stores the database, handles
            sign-in, and sends account emails such as confirmation and password-reset messages.
            Those emails contain a link. They do not include your medication records
          </li>
          <li>
            Amazon Web Services hosts the Supabase project that stores your account and records
          </li>
          <li>
            <LegalLink to="https://pages.github.com/">GitHub Pages</LegalLink> delivers the website
            to your browser. It does not receive your medication records. Like any website host, it
            can see technical connection data, such as your IP address, when the app loads
          </li>
          <li>
            Google processes emails you send to{' '}
            <LegalLink to="mailto:mymedsrecord@gmail.com">mymedsrecord@gmail.com</LegalLink>, because
            that mailbox is provided by Gmail
          </li>
        </ul>
        <p>
          The person who runs My Meds Record can access the hosting platform to maintain the
          service, fix a problem you report, or protect the service. We do not browse your records
          for any other reason.
        </p>
      </LegalSection>

      <LegalSection title="Where it is stored">
        <p>
          Account and health records are stored in our Supabase project, with row-level security so
          each account can only access its own rows. Supabase is a United States company and uses
          infrastructure providers to host the project. Where information is handled outside the
          United Kingdom, the transfer is covered by Supabase’s data-processing terms and the
          UK-approved transfer safeguards in those terms.
        </p>
        <p>
          There is no separate file store. We do not upload documents or photos.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          We keep your account and records until you delete them. You can edit or remove individual
          entries in the app at any time. Emails you send us are kept for as long as we need them to
          deal with your request and any follow-up.
        </p>
        <p>
          Technical logs kept by our providers are retained for their usual security period and are
          not used as a copy of your health records.
        </p>
      </LegalSection>

      <LegalSection title="Deleting your account">
        <p>
          From <LegalLink to="/settings">Settings</LegalLink> you can permanently delete your
          account. The app asks for your password, then a protected server-side function deletes the
          signed-in login and the medication records, schedules, dose history, notes, observations
          and settings stored with that account. This cannot be undone.
        </p>
        <p>
          The sign-in session in this browser is cleared, and the appearance settings saved for that
          account are removed from this browser. A device-level copy of appearance settings may
          remain until you clear this site’s data in your browser. Copies in routine provider
          backups are overwritten as those backups expire. We do not keep a separate archive of
          deleted accounts, and we do not restore an account after you delete it.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>Under UK data protection law you can:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Ask for a copy of the information we hold about you</li>
          <li>Ask us to correct information that is inaccurate</li>
          <li>Ask us to delete information, or delete it yourself</li>
          <li>Ask us to restrict how we use it, or object to use based on legitimate interests</li>
          <li>Receive a portable copy of the records you provided</li>
          <li>Withdraw consent to processing of your health information</li>
        </ul>
        <p>You can do most of this yourself while signed in:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <LegalLink to="/settings">Download all my data</LegalLink> — a JSON file of the records
            stored for your account
          </li>
          <li>
            <LegalLink to="/history">History</LegalLink> — export the rows you are viewing as a CSV
            file
          </li>
          <li>
            <LegalLink to="/settings">Delete account</LegalLink> — permanently removes your login and
            the records stored with it
          </li>
        </ul>
        <p>
          You can also email{' '}
          <LegalLink to="mailto:mymedsrecord@gmail.com">mymedsrecord@gmail.com</LegalLink>. We may
          need to confirm that the request comes from the account holder. We aim to respond within
          one month.
        </p>
        <p>
          You can complain to the UK Information Commissioner’s Office (ICO) at{' '}
          <LegalLink to="https://ico.org.uk/make-a-complaint/">ico.org.uk/make-a-complaint</LegalLink>
          . We would welcome the chance to put something right first.
        </p>
      </LegalSection>

      <LegalSection title="Browser storage">
        <p>
          We do not use analytics or advertising cookies. The app uses essential storage so it can
          work:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>A sign-in session, so you can stay signed in (handled by Supabase Auth)</li>
          <li>A short-lived flag in this tab while you reset your password</li>
          <li>A cached copy of appearance settings, so the layout can be applied straight away</li>
          <li>
            A service worker that caches the application shell and static files, such as icons,
            scripts and styles, so the app can load more quickly. It is not used as an offline copy
            of your medication records, notes or sign-in responses
          </li>
        </ul>
        <p>
          When your browser contacts Supabase, that provider may set a short-lived security cookie
          used to protect the connection. It is not used for advertising.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          My Meds Record is for people aged 18 or over. We do not knowingly create accounts for
          anyone younger. If you believe an account has been opened for someone under 18, email{' '}
          <LegalLink to="mailto:mymedsrecord@gmail.com">mymedsrecord@gmail.com</LegalLink> and we
          will delete it.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          Information is sent over HTTPS. Database access is restricted so a signed-in account can
          only read and change its own records, and passwords are stored as hashes. No online
          service can promise perfect security. Use a password you do not use elsewhere, do not share
          your login, and only use My Meds Record on devices you trust.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We may update this policy as the service changes. The date at the top of this page will
          change when we do. Please check it from time to time. The current version is also linked
          from the sign-up screen and from{' '}
          <LegalLink to="/terms">Terms of Use</LegalLink>.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
