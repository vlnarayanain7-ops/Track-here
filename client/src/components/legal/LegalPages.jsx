import { Link } from 'react-router-dom';
import { ArrowLeft, Target, ShieldCheck, FileText } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] p-6 sm:p-12 antialiased">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary)] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Track Here
        </Link>

        <div className="space-y-3 pb-6 border-b border-[var(--line)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-[var(--text)]">Terms of Service</h1>
          <p className="text-xs text-[var(--muted)]">Last updated: November 20, 2026 · Version: 2026-11-20</p>
        </div>

        {/* Table of Contents */}
        <nav className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-2 text-xs">
          <p className="font-semibold text-[var(--text)] font-heading">Table of Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[var(--muted)]">
            <a href="#t-1" className="hover:underline">1. Agreement</a>
            <a href="#t-2" className="hover:underline">2. Eligibility</a>
            <a href="#t-3" className="hover:underline">3. Your Account</a>
            <a href="#t-4" className="hover:underline">4. The Service; Beta Status</a>
            <a href="#t-5" className="hover:underline">5. Data, Offline Use & Backups</a>
            <a href="#t-6" className="hover:underline">6. Acceptable Use</a>
            <a href="#t-7" className="hover:underline">7. Your Content</a>
            <a href="#t-8" className="hover:underline">8. Badges, Certificates & Rewards</a>
            <a href="#t-9" className="hover:underline">9. No Guarantee; Wellbeing</a>
            <a href="#t-10" className="hover:underline">10. Third-Party Services</a>
            <a href="#t-11" className="hover:underline">11. Intellectual Property</a>
            <a href="#t-12" className="hover:underline">12. Communications</a>
            <a href="#t-13" className="hover:underline">13. Fees</a>
            <a href="#t-14" className="hover:underline">14. Termination</a>
            <a href="#t-15" className="hover:underline">15. Disclaimer of Warranties</a>
            <a href="#t-16" className="hover:underline">16. Limitation of Liability</a>
            <a href="#t-17" className="hover:underline">17. Indemnity</a>
            <a href="#t-18" className="hover:underline">18. Disputes; Governing Law</a>
            <a href="#t-19" className="hover:underline">19. Changes to Terms</a>
            <a href="#t-20" className="hover:underline">20. Copyright Complaints</a>
            <a href="#t-21" className="hover:underline">21. General</a>
            <a href="#t-22" className="hover:underline">22. Contact Information</a>
          </div>
        </nav>

        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <section id="t-1" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">1. Agreement</h2>
            <p>
              These Terms of Service ("Terms") are a contract between you and Track Here ("we", "us") for the Track Here website, web app and related services (the "Service"). By creating an account, ticking the acceptance box, or using the Service, you agree to these Terms, the Privacy Policy and the Rewards Rules, which are part of these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section id="t-2" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">2. Eligibility</h2>
            <p>
              (a) You must be at least 13 years old. The Service is not directed to children under 13 and we do not knowingly collect their information; if we learn that a user is under 13 we will delete the account. (b) If you are under 18 (or the age of majority where you live) you may use the Service only with the permission of a parent or legal guardian, who agrees to these Terms for you. (c) Rewards under the Rewards Rules are limited to people aged 18 or older who live in the United States. (d) You confirm that the information you give us is accurate, including your age group.
            </p>
          </section>

          <section id="t-3" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">3. Your Account</h2>
            <p>
              You are responsible for your password and for all activity under your account. Use a strong, unique password and tell us promptly at <a href="mailto:support@trackhere.app" className="underline text-[var(--primary)]">support@trackhere.app</a> if you suspect unauthorized access. One person may keep one account. You may not sell, share or transfer an account.
            </p>
          </section>

          <section id="t-4" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">4. The Service; Beta Status</h2>
            <p>
              The Service is provided free of charge while in an early-access (beta) stage. Features may change, be limited, or be removed at any time. We do not promise that the Service will be available at all times, uninterrupted, secure or error-free. The Service runs on third-party infrastructure that may be slow, may pause when idle, or may fail. Planned maintenance and unplanned outages can happen.
            </p>
          </section>

          <section id="t-5" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">5. Your Data, Offline Use and Backups</h2>
            <p>
              Parts of your data may be stored on your device (for example in your browser's storage) so the Service can work offline. You are responsible for your device, browser and its settings; clearing browser data or using private browsing can delete locally stored data. Use the export feature to keep your own backups. We may delete inactive accounts after 12 months of inactivity with prior notice by email where possible. We do not guarantee that data will never be lost, corrupted or delayed.
            </p>
          </section>

          <section id="t-6" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">6. Acceptable Use</h2>
            <p>
              You agree not to: (a) break any law or violate anyone's rights; (b) cheat, manipulate or falsify study time, timers, streaks, badges, certificates or reward verification, including by scripts, bots, extensions, editing network requests, running timers without studying, or creating multiple accounts; (c) upload proof of work that is not your own, or content that is illegal, hateful, harassing, sexually explicit, or that contains other people's personal data, government IDs, payment details or health records; (d) upload malware or try to probe, scan, overload, or bypass the security of the Service; (e) scrape, copy or reverse engineer the Service except where the law allows; (f) use the Service to harass others or to send spam; (g) misrepresent your identity or affiliation. We may investigate and take action, including removing content, resetting streaks or milestones, cancelling rewards, and suspending or terminating accounts, with or without notice.
            </p>
          </section>

          <section id="t-7" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">7. Your Content</h2>
            <p>
              You keep ownership of what you create in the Service, such as notes, tasks, goals and uploaded proof ("Your Content"). You give us a limited, worldwide, non-exclusive, royalty-free licence to host, store, process, display and back up Your Content only to operate, secure and improve the Service for you. Proof of work you submit is used only to verify eligibility and is deleted as described in the Privacy Policy. You promise you have the rights to Your Content. We do not review everything you store and are not responsible for it.
            </p>
          </section>

          <section id="t-8" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">8. Badges, Certificates, Coins and Rewards</h2>
            <p>
              Badges, certificates, points and any similar items are virtual recognition items. They have no cash value, cannot be sold, bought or transferred, and are not academic credit, a professional qualification or an accreditation. Eligibility depends on timer-verified study time as explained in the Service. Any reward programme is governed by the Rewards Rules. We decide, in our sole discretion, whether a user has met the requirements, and our decision is final to the extent the law allows. We may change, pause or end any recognition item or reward programme at any time, and we may revoke items or rewards obtained through breach of these Terms, error or fraud.
            </p>
          </section>

          <section id="t-9" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">9. No Guarantee of Results; Wellbeing</h2>
            <p>
              The Service is a self-management tool. We do not promise any grade, test score, job, admission or other result. Content in the Service is not professional, medical, psychological, legal or financial advice. Study in a healthy way: take breaks, sleep, eat and move. Do not study in a way that harms you or others, and do not use the Service while driving or in any situation that needs your attention. Daily targets, streaks and rewards are optional; you can stop any time.
            </p>
          </section>

          <section id="t-10" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">10. Third-Party Services</h2>
            <p>
              The Service uses third parties such as hosting, database, email delivery, error-monitoring and content delivery providers. Their services may have their own terms. We are not responsible for third-party services or links.
            </p>
          </section>

          <section id="t-11" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">11. Our Intellectual Property</h2>
            <p>
              The Service, its software, design, text, logos and marks belong to us or our licensors and are protected by law. We give you a personal, revocable, non-exclusive, non-transferable licence to use the Service as intended. If you send us feedback or ideas, you allow us to use them without payment or credit.
            </p>
          </section>

          <section id="t-12" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">12. Communications</h2>
            <p>
              You agree that we may contact you electronically (in the app or by email) about your account, security, legal notices and, if you turn them on, reminders. You can manage reminders in Settings. Messages about security or legal changes cannot be turned off while you keep an account.
            </p>
          </section>

          <section id="t-13" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">13. Fees</h2>
            <p>
              The Service is currently free. We may introduce paid features in the future. Before charging for anything that is free today, we will give notice in the app. Paid terms, if any, will be presented separately and require your agreement. Users under 18 will not be charged.
            </p>
          </section>

          <section id="t-14" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">14. Termination</h2>
            <p>
              You may stop using the Service and delete your account at any time in Settings. We may suspend or end your access at any time, for example for breach of these Terms, risk to others, legal reasons, or when we discontinue the Service. After termination, sections that by nature should survive will survive (including 5, 6, 7 (licence for backups until deletion), 8, 11, 14 to 21).
            </p>
          </section>

          <section id="t-15" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">15. Disclaimer of Warranties</h2>
            <p className="uppercase text-xs font-medium">
              TO THE FULLEST EXTENT THE LAW ALLOWS, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, NON-INFRINGEMENT, AND UNINTERRUPTED OR ERROR-FREE OPERATION. SOME JURISDICTIONS DO NOT ALLOW SOME EXCLUSIONS, SO SOME MAY NOT APPLY TO YOU.
            </p>
          </section>

          <section id="t-16" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">16. Limitation of Liability</h2>
            <p className="uppercase text-xs font-medium">
              TO THE FULLEST EXTENT THE LAW ALLOWS, WE AND OUR OWNERS, EMPLOYEES, CONTRACTORS AND PROVIDERS ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY OR PUNITIVE DAMAGES, OR FOR LOST DATA, PROFITS, GOODWILL, GRADES OR OPPORTUNITIES, EVEN IF TOLD THEY MIGHT HAPPEN. OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM, OR (B) US$50. NOTHING IN THESE TERMS LIMITS LIABILITY THAT CANNOT BE LIMITED BY LAW.
            </p>
          </section>

          <section id="t-17" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">17. Indemnity</h2>
            <p>
              To the extent the law allows, you will defend and compensate us against claims, losses and costs (including reasonable legal fees) arising from your breach of these Terms, Your Content, or your misuse of the Service. This does not apply to users under 18 to the extent the law does not allow it.
            </p>
          </section>

          <section id="t-18" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">18. Disputes; Governing Law</h2>
            <p>
              (a) Please contact us first at <a href="mailto:support@trackhere.app" className="underline text-[var(--primary)]">support@trackhere.app</a>; most issues can be resolved informally within 30 days. (b) These Terms are governed by the laws of India, without regard to conflict-of-law rules, except where the law of your place of residence requires otherwise for consumers. (c) Otherwise, courts in India have jurisdiction, and you and we consent to them.
            </p>
          </section>

          <section id="t-19" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">19. Changes to These Terms</h2>
            <p>
              We may update these Terms. We will post the new version with a new date and, for material changes, ask you to accept again in the app or notify you. If you keep using the Service after the effective date, you accept the changes. If you disagree, stop using the Service and delete your account.
            </p>
          </section>

          <section id="t-20" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">20. Copyright Complaints</h2>
            <p>
              If you believe content in the Service infringes your copyright, send a notice to <a href="mailto:support@trackhere.app" className="underline text-[var(--primary)]">support@trackhere.app</a> with: the work, where it appears, your contact details, a statement of good-faith belief and a statement that your notice is accurate and that you are the owner or authorized. We may remove content and end accounts of repeat infringers.
            </p>
          </section>

          <section id="t-21" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">21. General</h2>
            <p>
              If a part of these Terms is unenforceable, the rest stays in force. Our failure to enforce a right is not a waiver. You may not assign these Terms; we may assign them in a merger or sale. These Terms, the Privacy Policy and the Rewards Rules are the entire agreement between you and us about the Service. We are not liable for delay or failure caused by events beyond our reasonable control (internet or power failures, third-party outages, natural events, government action). There are no third-party beneficiaries. Headings are for convenience.
            </p>
          </section>

          <section id="t-22" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">22. Contact</h2>
            <p>
              Track Here, India · <a href="mailto:support@trackhere.app" className="underline text-[var(--primary)]">support@trackhere.app</a> · <a href="https://trackhere.app" target="_blank" rel="noreferrer" className="underline text-[var(--primary)]">trackhere.app</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function RewardsRulesPage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] p-6 sm:p-12 antialiased">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary)] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Track Here
        </Link>

        <div className="space-y-3 pb-6 border-b border-[var(--line)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-[var(--text)]">Rewards Rules</h1>
          <p className="text-xs text-[var(--muted)]">
            Last updated: November 20, 2026 · Official rules for the recognition and reward programme
          </p>
          <p className="text-xs font-semibold text-[var(--text)]">
            NO PURCHASE OR PAYMENT IS NECESSARY. THIS IS A CONSISTENCY-BASED PROGRAMME AND NOT A SWEEPSTAKES OR LOTTERY; NO ELEMENT OF CHANCE DECIDES WHO QUALIFIES. VOID WHERE PROHIBITED.
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-2 text-xs">
          <p className="font-semibold text-[var(--text)] font-heading">Table of Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[var(--muted)]">
            <a href="#r-1" className="hover:underline">1. Sponsor</a>
            <a href="#r-2" className="hover:underline">2. Recognition Items</a>
            <a href="#r-3" className="hover:underline">3. Surprise Reward Programme</a>
            <a href="#r-4" className="hover:underline">4. Eligibility</a>
            <a href="#r-5" className="hover:underline">5. How to Qualify</a>
            <a href="#r-6" className="hover:underline">6. Proof of Work</a>
            <a href="#r-7" className="hover:underline">7. Verification and Decisions</a>
            <a href="#r-8" className="hover:underline">8. First Ten Allocation</a>
            <a href="#r-9" className="hover:underline">9. Claim and Delivery</a>
            <a href="#r-10" className="hover:underline">10. Changes, Suspension and Ending</a>
            <a href="#r-11" className="hover:underline">11. Privacy & Address Retention</a>
            <a href="#r-12" className="hover:underline">12. Limitation of Liability</a>
            <a href="#r-13" className="hover:underline">13. Governing Law</a>
          </div>
        </nav>

        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <section id="r-1" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">1. Sponsor</h2>
            <p>
              Track Here, India · <a href="mailto:support@trackhere.app" className="underline text-[var(--primary)]">support@trackhere.app</a> ("Sponsor").
            </p>
          </section>

          <section id="r-2" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">2. Recognition Items (All Eligible Users)</h2>
            <p>
              (a) 7-day badge: awarded for 7 consecutive days with at least 25 minutes of timer-verified study per day. (b) 30-day certificate: awarded for 30 consecutive days with at least 25 minutes of timer-verified study per day. These are virtual items without cash value, are not academic credit or an accreditation, and can be revoked if obtained through breach or error. A public verification page may confirm that a certificate serial is valid and shows only the milestone and the issue date (and your name only if you choose).
            </p>
          </section>

          <section id="r-3" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">3. Surprise Reward Programme</h2>
            <p>
              The Sponsor offers a limited number of surprise rewards. Each is a physical item chosen by the Sponsor with an approximate retail value of up to US$50. The item is not disclosed in advance. No substitution, exchange, upgrade or cash alternative; the Sponsor may substitute an item of similar value if the original is not available. The total number of surprise rewards available is limited to ten (10) in total during the programme.
            </p>
          </section>

          <section id="r-4" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">4. Eligibility</h2>
            <p>
              The surprise reward is open to individuals who are at least 18 years old and legally reside in the 50 United States or the District of Columbia, and who have a valid US shipping address. Employees, contractors and immediate family or household members of the Sponsor are not eligible. One reward per person and per household or address.
            </p>
          </section>

          <section id="r-5" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">5. How to Qualify</h2>
            <p>
              To qualify you must: (a) complete 150 consecutive "Reward Days". A Reward Day is a local calendar day (in the time zone set in your account) with at least 60 minutes of timer-verified study. Timer-verified means time recorded by the in-app timer while it is running and sending its regular signals. Manually logged time and time the Sponsor determines was not genuine study does not count. Missing a Reward Day ends the run, and the count starts again at zero. Streak freezes or similar features do not apply to Reward Days. (b) For each of five check-points (at 30, 60, 90, 120 and 150 Reward Days) submit "proof of work" that shows your own genuine study work from that period, and have it approved. (c) Complete the claim form with your name and US shipping address.
            </p>
          </section>

          <section id="r-6" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">6. Proof of Work</h2>
            <p>
              Proof may be up to three photos or screenshots and/or a link, plus a short description. It must be your own work, must not contain other people's personal information or private documents, and must not be copied, edited to mislead, AI-generated as a substitute for real work, or reused from another submission or person. You confirm you have the right to submit it and you give the Sponsor a licence to view and store it for verification. Photos are shrunk and re-encoded on your device before upload. Files are reviewed by a person and deleted promptly after the decision (and in any case within 45 days of upload if still pending); the Sponsor keeps only small records, including a fingerprint (hash) of each file to detect reuse.
            </p>
          </section>

          <section id="r-7" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">7. Verification and Decisions</h2>
            <p>
              The Sponsor decides in its sole discretion whether requirements are met and may ask for more information or evidence of identity, age or residence. The Sponsor may check timer activity, device and account signals and may reject or reverse a qualification if it suspects cheating, automation, manipulated requests, duplicate or shared accounts, or any breach of the Terms. Decisions are final to the extent the law allows. A person who is disqualified cannot reapply.
            </p>
          </section>

          <section id="r-8" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">8. First Ten</h2>
            <p>
              Rewards are given in order of completed, approved claims. A claim reserves a place only after all requirements are approved and the claim form is accepted; if the programme limit is reached before your claim is accepted, no reward is owed. If a claim is rejected, its place is released to others.
            </p>
          </section>

          <section id="r-9" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">9. Claim and Delivery</h2>
            <p>
              Winners will be contacted through the app and by email and must respond within 14 days or the claim is forfeited. Delivery is expected within about 8 to 12 weeks after approval, by a carrier chosen by the Sponsor, to US addresses only. The Sponsor is not responsible for lost, late, damaged or misdelivered items due to incorrect addresses or carrier faults beyond its control. Winners are responsible for any taxes and for compliance with local rules on receiving prizes.
            </p>
          </section>

          <section id="r-10" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">10. Changes, Suspension and Ending</h2>
            <p>
              The Sponsor may change, suspend or end the programme or these rules at any time, for example because of fraud, technical problems, legal reasons, cost, or other reasons beyond its control, by posting notice in the Service. If the programme ends early, qualifying claims already approved will be honoured where possible; otherwise no reward is owed.
            </p>
          </section>

          <section id="r-11" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">11. Privacy</h2>
            <p>
              Information for the programme (such as your shipping address and proof of work) is used only to run it and is handled as described in the Privacy Policy. Shipping details are deleted 60 days after the claim is finished.
            </p>
          </section>

          <section id="r-12" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">12. Limitation of Liability</h2>
            <p>
              To the fullest extent the law allows, the Sponsor is not liable for any injury, loss or damage connected to participation in the programme or to the use or enjoyment of a reward, and makes no warranty about any reward other than as required by law. Section 15 and 16 of the Terms apply.
            </p>
          </section>

          <section id="r-13" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">13. Governing Law</h2>
            <p>
              The laws of India apply, subject to mandatory consumer laws. Disputes are handled as stated in the Terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] p-6 sm:p-12 antialiased">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary)] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Track Here
        </Link>

        <div className="space-y-3 pb-6 border-b border-[var(--line)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-[var(--text)]">Privacy Policy</h1>
          <p className="text-xs text-[var(--muted)]">Last updated: November 20, 2026 · Controller: Track Here, India (<a href="mailto:support@trackhere.app" className="underline text-[var(--primary)]">support@trackhere.app</a>)</p>
        </div>

        {/* Table of Contents */}
        <nav className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-2 text-xs">
          <p className="font-semibold text-[var(--text)] font-heading">Table of Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[var(--muted)]">
            <a href="#p-1" className="hover:underline">1. What We Collect</a>
            <a href="#p-2" className="hover:underline">2. How We Use It</a>
            <a href="#p-3" className="hover:underline">3. Who We Share It With</a>
            <a href="#p-4" className="hover:underline">4. Retention (How Long We Keep Data)</a>
            <a href="#p-5" className="hover:underline">5. Your Choices and Rights</a>
            <a href="#p-6" className="hover:underline">6. Children</a>
            <a href="#p-7" className="hover:underline">7. Security</a>
            <a href="#p-8" className="hover:underline">8. International Transfers</a>
            <a href="#p-9" className="hover:underline">9. Changes</a>
            <a href="#p-10" className="hover:underline">10. Contact</a>
          </div>
        </nav>

        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <section id="p-1" className="space-y-3">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">1. What We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account data:</strong> Name, email address, password (stored only as a salted bcrypt hash), age group (13 to 17 or 18+), time zone, theme and settings, and the record of your acceptance of our Terms.
              </li>
              <li>
                <strong>What you create:</strong> Tasks, notes, subjects, goals, timetable blocks, study sessions, daily totals, journal entries, practice logs, and revision items.
              </li>
              <li>
                <strong>Reward programme data (only if you take part):</strong> Proof-of-work files and links, a short description, a fingerprint (SHA-256 hash) of each file, and, if you claim, your name, US shipping address, and phone number if you provide one.
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser and device type, timestamps, security logs, and error reports (with personal content removed).
              </li>
              <li>
                <strong>Data on your device:</strong> Your browser stores a local copy of your data (offline cache in IndexedDB, saved report cards, and a queue of pending offline changes) so the app works seamlessly offline. We do not control this local storage; you can clear it anytime in your browser or by signing out.
              </li>
              <li>
                <strong>No tracking ads:</strong> We do not use advertising or cross-site tracking cookies. We use cookies or similar storage strictly to keep you signed in, protect against attacks (CSRF tokens), and remember your preferences.
              </li>
            </ul>
          </section>

          <section id="p-2" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">2. How We Use It</h2>
            <p>
              To provide and secure the Service; to sync and back up your data; to compute streaks, badges, certificates and reports; to verify reward eligibility, prevent cheating and run the reward programme; to send account, security and (if enabled) reminder messages; to fix bugs and improve the Service; to comply with law and enforce our Terms.
            </p>
          </section>

          <section id="p-3" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">3. Who We Share It With</h2>
            <p>
              Service providers that process data for us under their terms: hosting and content delivery (Render and Cloudflare), database (MongoDB Atlas), email delivery (Nodemailer / SMTP), error monitoring (internal diagnostics), and the postal carrier that delivers a reward. We share information if required by law or to protect rights, safety and security, and in a merger or sale of the business with the same protections. We do not sell your personal information and we do not share it for cross-context behavioural advertising. A certificate verification page shows only the milestone, the issue date and, if you choose, your name.
            </p>
          </section>

          <section id="p-4" className="space-y-3">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">4. Retention (How Long We Keep Data)</h2>
            <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-2)] border-b border-[var(--line)]">
                    <th className="p-3 font-semibold text-[var(--text)]">Data Category</th>
                    <th className="p-3 font-semibold text-[var(--text)]">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  <tr>
                    <td className="p-3 font-medium text-[var(--text)]">Account, tasks, notes, goals, settings</td>
                    <td className="p-3">Until you delete them or permanently delete your account</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[var(--text)]">Raw study sessions</td>
                    <td className="p-3">180 days, after which only daily totals are kept</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[var(--text)]">Daily totals</td>
                    <td className="p-3">Until you delete your account</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[var(--text)]">Saved daily report copy on our servers</td>
                    <td className="p-3">2 days, then deleted automatically (a copy you saved stays on your device)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[var(--text)]">Proof-of-work files</td>
                    <td className="p-3">Deleted promptly after review; pending files deleted automatically after 45 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[var(--text)]">Proof records and file fingerprints</td>
                    <td className="p-3">Up to 400 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[var(--text)]">Reward shipping details</td>
                    <td className="p-3">Deleted 60 days after the claim is finished</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[var(--text)]">Password-reset tokens, expired sessions</td>
                    <td className="p-3">Automatically deleted after expiration</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[var(--text)]">Feedback you send</td>
                    <td className="p-3">Up to 180 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[var(--text)]">Security and error logs</td>
                    <td className="p-3">Up to 30 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[var(--text)]">Backups</td>
                    <td className="p-3">Up to 35 days after deletion</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="p-5" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">5. Your Choices and Rights</h2>
            <p>
              You can view and edit your data in the app, export it, and delete your account (this permanently deletes your data from our systems, subject to the backup period above). Depending on where you live (for example California and other US states, or the EU and UK), you may have the right to access, correct, delete, port or restrict the use of your personal information and to appeal a refusal. Email <a href="mailto:support@trackhere.app" className="underline text-[var(--primary)]">support@trackhere.app</a> to make a request; we will verify your identity and respond within the time the law requires (generally 45 days in many US states, one month in the EU and UK). We will not discriminate against you for using your rights. We do not sell or share personal data as defined by those laws.
            </p>
          </section>

          <section id="p-6" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">6. Children</h2>
            <p>
              The Service is for people aged 13 and over. We do not knowingly collect personal information from children under 13; if you believe a child under 13 has an account, email <a href="mailto:support@trackhere.app" className="underline text-[var(--primary)]">support@trackhere.app</a> and we will delete it. Users under 18 should use the Service with a parent's or guardian's permission, are not eligible for the surprise reward programme, and are not shown payments or marketing.
            </p>
          </section>

          <section id="p-7" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">7. Security</h2>
            <p>
              We use encryption in transit (HTTPS), hashed passwords, access controls, rate limits and per-user data separation. No system is perfectly secure. If a breach affects you, we will notify you and authorities as the law requires.
            </p>
          </section>

          <section id="p-8" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">8. International Transfers</h2>
            <p>
              We operate from India and our providers may process data in the United States and other countries. By using the Service you understand that your data may be transferred to and stored in countries with different data protection laws.
            </p>
          </section>

          <section id="p-9" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">9. Changes</h2>
            <p>
              We will post the updated policy with a new date and notify you in the app of important changes.
            </p>
          </section>

          <section id="p-10" className="space-y-2">
            <h2 className="text-base font-heading font-bold text-[var(--text)]">10. Contact</h2>
            <p>
              Track Here, India · <a href="mailto:support@trackhere.app" className="underline text-[var(--primary)]">support@trackhere.app</a> · <a href="https://trackhere.app" target="_blank" rel="noreferrer" className="underline text-[var(--primary)]">trackhere.app</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default {
  TermsPage,
  RewardsRulesPage,
  PrivacyPage,
};
