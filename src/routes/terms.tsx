import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Influencer Dhundo" },
      {
        name: "description",
        content: "Terms and Conditions governing the use of Influencer Dhundo platform, subscriptions, and services.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="py-12 md:py-16 bg-background">
      <div className="mx-auto max-w-4xl px-5 sm:px-6">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-border">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Last Updated: 3 October 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed text-sm sm:text-base">
          <p>
            These Terms &amp; Conditions (“Terms”) govern your access to and use of Influencer Dhundo, including its website, creator directory, search and discovery features, creator profiles, subscriptions, referral programme and related services (collectively, the “Platform”).
          </p>
          <p>
            By accessing, registering on, creating a profile on, purchasing a subscription through, or otherwise using Influencer Dhundo, you agree to be bound by these Terms, together with our Privacy Policy and Refund &amp; Cancellation Policy, as applicable.
          </p>
          <p className="font-medium text-foreground">
            If you do not agree with these Terms, please do not use the Platform.
          </p>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              1. About Influencer Dhundo
            </h2>
            <p>
              Influencer Dhundo is a digital discovery platform designed to help:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>local creators and influencers become discoverable by businesses; and</li>
              <li>businesses discover creators based on location, category, audience size, content type, budget and other profile information.</li>
            </ul>
            <p>
              Influencer Dhundo operates as a discovery and connection platform. We do not act as an advertising agency, talent agency, campaign manager, broker, employer, payment intermediary between businesses and creators, or representative of either party.
            </p>
            <p>
              Influencer Dhundo does not become a party to any commercial arrangement, collaboration, campaign, barter arrangement or other agreement entered into directly between a creator and a business.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              2. Eligibility
            </h2>
            <p>
              You must be <strong>18 years of age or older</strong> to use Influencer Dhundo.
            </p>
            <p>By using the Platform, you confirm that:</p>
            <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
              <li>you are legally capable of entering into these Terms;</li>
              <li>the information you provide is accurate and current;</li>
              <li>you will update information when it materially changes;</li>
              <li>you will use the Platform only for lawful purposes; and</li>
              <li>you are not prohibited from using the Platform under applicable law.</li>
            </ol>
            <p className="text-xs sm:text-sm text-muted-foreground">
              If you are registering or using the Platform on behalf of a business or other organisation, you represent that you have authority to act on its behalf.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              3. User Accounts
            </h2>
            <p>
              Certain features require you to create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>providing accurate registration information;</li>
              <li>keeping your account information current;</li>
              <li>maintaining the security of your account;</li>
              <li>preventing unauthorised use of your account; and</li>
              <li>notifying us if you reasonably believe your account has been compromised.</li>
            </ul>
            <p>You must not:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>create accounts using false identities;</li>
              <li>impersonate another person or business;</li>
              <li>create multiple accounts to circumvent restrictions;</li>
              <li>use another person's account without permission; or</li>
              <li>use accounts to manipulate search results, subscriptions or referral rewards.</li>
            </ul>
            <p>
              We may restrict, suspend or terminate accounts where we reasonably believe that these Terms, applicable law or Platform security requirements have been violated.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              4. Creator Profiles
            </h2>
            <p>
              Creators may create profiles containing information such as:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>name and display name;</li>
              <li>profile photograph;</li>
              <li>city, locality and pincode;</li>
              <li>social media information;</li>
              <li>follower count;</li>
              <li>category;</li>
              <li>content types;</li>
              <li>languages;</li>
              <li>collaboration preferences;</li>
              <li>starting collaboration price;</li>
              <li>travel preferences;</li>
              <li>product/service collaboration preferences;</li>
              <li>typical turnaround time;</li>
              <li>biography/about information; and</li>
              <li>other information requested during creator registration.</li>
            </ul>
            <p>
              Creators are responsible for ensuring that information submitted to the Platform is accurate and not misleading. Influencer Dhundo does not independently guarantee the accuracy of creator-provided follower counts, engagement information, pricing, portfolio claims, experience, audience information, availability, turnaround times, or other self-reported information.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We may request clarification, correction or supporting information where reasonably necessary.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              5. Creator Profile Visibility
            </h2>
            <p>
              A creator may complete their profile before purchasing a subscription. However, completing registration does not by itself make the profile publicly discoverable.
            </p>
            <p>
              Creator profiles may become publicly visible only when the applicable requirements for activation have been satisfied, including an active paid subscription where required by the Platform.
            </p>
            <p>
              When a creator's subscription expires or is otherwise inactive, their public profile may become hidden or unavailable from discovery.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Influencer Dhundo does not guarantee that an active creator profile will appear in any particular position in search results or receive any specific number of views, enquiries, leads or collaborations.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              6. Business Use of the Platform
            </h2>
            <p>
              Businesses may use the Platform to browse creators, search and filter creator profiles, view publicly available creator information, and where applicable, access creator contact information after completing the required registration process.
            </p>
            <p>
              Business users are responsible for conducting their own evaluation of creators before entering into any collaboration.
            </p>
            <p>Businesses must not use creator information for:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>spam;</li>
              <li>harassment;</li>
              <li>unsolicited bulk communication;</li>
              <li>resale or redistribution of contact information;</li>
              <li>scraping or bulk collection of creator data;</li>
              <li>impersonation;</li>
              <li>fraud;</li>
              <li>unlawful activities; or</li>
              <li>purposes unrelated to legitimate business or collaboration enquiries.</li>
            </ul>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              7. Business–Creator Relationships
            </h2>
            <p>
              Influencer Dhundo only facilitates discovery and connection. Any arrangement between a creator and a business, including fees, barter arrangements, products or services, deliverables, timelines, travel, content requirements, usage rights, payment, cancellations, revisions, refunds, disputes, or other commercial terms is agreed directly between the creator and the business.
            </p>
            <p>
              Influencer Dhundo is not a party to such arrangements unless expressly stated otherwise in writing.
            </p>
            <p>We do not guarantee:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>that a creator will respond to a business;</li>
              <li>that a business will contact a creator;</li>
              <li>that a collaboration will occur;</li>
              <li>that a creator will deliver content;</li>
              <li>that a business will make payment to a creator;</li>
              <li>the quality of content;</li>
              <li>the performance of a collaboration; or</li>
              <li>any commercial result from using the Platform.</li>
            </ul>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              8. Subscription Plans
            </h2>
            <p>
              Creator profiles may require a paid subscription to remain publicly discoverable. Current subscription plans may include:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>1 Month — ₹799</li>
              <li>3 Months — ₹1,999</li>
              <li>6 Months — ₹3,398</li>
              <li>1 Year — ₹7,996</li>
            </ul>
            <p>
              The applicable price, duration and benefits will be displayed before payment. We may change subscription prices, plans or features in the future. Any price change will not alter a subscription period that has already been successfully purchased, unless otherwise required by law or expressly agreed with the user.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Applicable taxes, if any, will be displayed or applied as required by law.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              9. Creator Free Trial
            </h2>
            <p>
              New creators may receive a 3-day free trial, subject to the eligibility rules displayed by Influencer Dhundo at the time of registration.
            </p>
            <p>
              The free trial allows an eligible creator to access the applicable creator features for the stated trial period. After the trial ends, continued public listing requires the creator to purchase an applicable paid subscription.
            </p>
            <p>
              A trial registration by itself does not constitute a paid subscription and does not qualify as a successful referral under the referral programme.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Influencer Dhundo may restrict abuse of trial access, including repeated creation of accounts for the purpose of obtaining multiple trials.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              10. Subscription Activation and Expiry
            </h2>
            <p>
              A subscription becomes active after successful confirmation of payment and activation by the Platform. Subscription validity is calculated according to the plan purchased.
            </p>
            <p>When a subscription expires:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>the creator's public listing may be hidden;</li>
              <li>the creator may no longer appear in public discovery;</li>
              <li>referral rewards may become inactive; and</li>
              <li>access to subscription-specific features may cease.</li>
            </ul>
            <p>
              A creator may renew their subscription according to the plans available at the time.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              11. Referral Programme
            </h2>
            <p>
              Influencer Dhundo may provide an optional referral programme for active subscribed creators. The referral programme currently operates on the following basis:
            </p>

            <h3 className="text-base font-semibold text-foreground pt-1">11.1 Referral Code</h3>
            <p className="text-muted-foreground text-sm">
              After activating a qualifying paid subscription, an eligible creator may receive a unique referral code or referral link. The referral code is associated with that creator. The code may become inactive when the creator's subscription expires and may become active again when the creator renews their subscription.
            </p>

            <h3 className="text-base font-semibold text-foreground pt-1">11.2 Successful Referral</h3>
            <p className="text-muted-foreground text-sm">
              A referral qualifies only when the referred creator: (1) joins Influencer Dhundo using the applicable referral link or code; (2) completes the required creator registration/profile process; and (3) purchases a qualifying paid subscription. A trial registration or profile creation without a qualifying paid subscription does not constitute a successful referral.
            </p>

            <h3 className="text-base font-semibold text-foreground pt-1">11.3 Referral Reward</h3>
            <p className="text-muted-foreground text-sm">
              For each qualifying successful referral, the referring creator may receive 7 additional days added to their existing subscription expiry date. The additional days are added to the existing subscription validity and are not calculated by restarting or replacing the existing subscription period. There is currently no maximum referral-reward limit, unless Influencer Dhundo changes the programme terms in the future.
            </p>

            <h3 className="text-base font-semibold text-foreground pt-1">11.4 One-Level Referral Structure</h3>
            <p className="text-muted-foreground text-sm">
              The referral programme is direct and one-level (Creator A refers Creator B → A receives reward; Creator B refers Creator C → B receives reward; A does not receive reward for C).
            </p>

            <h3 className="text-base font-semibold text-foreground pt-1">11.5 Referral Attribution</h3>
            <p className="text-muted-foreground text-sm">
              Referral attribution is established when a new creator registers through a valid referral link or code. Once established, the referral attribution generally cannot be transferred to another creator.
            </p>

            <h3 className="text-base font-semibold text-foreground pt-1">11.6 Refunds and Reversal of Referral Rewards</h3>
            <p className="text-muted-foreground text-sm">
              If a referred creator's qualifying subscription is refunded, cancelled or reversed in circumstances that make the original referral ineligible, the corresponding referral reward may also be reversed. The corresponding subscription expiry may be adjusted to account for the reversal.
            </p>

            <h3 className="text-base font-semibold text-foreground pt-1">11.7 Abuse and Fraud</h3>
            <p className="text-muted-foreground text-sm">
              Influencer Dhundo may reject or reverse referral rewards where we reasonably determine that a referral involves self-referral, duplicate or artificial accounts, fraudulent activity, manipulated registrations, payment abuse, or attempts to circumvent subscription rules. Referral rewards are intended for genuine new creator subscriptions.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              12. Payments
            </h2>
            <p>
              Payments for Influencer Dhundo subscriptions may be processed through third-party payment service providers, including Razorpay. When making a payment, you may be redirected to or interact with the payment provider's payment interface. Influencer Dhundo does not intend to store full card numbers, CVV numbers, UPI PINs, banking passwords or other complete payment-instrument credentials.
            </p>
            <p>
              Payment processing is subject to the applicable payment provider's terms and policies in addition to these Terms.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              13. Refunds and Cancellations
            </h2>
            <p>
              Subscription refunds and cancellations are governed by the Influencer Dhundo Refund &amp; Cancellation Policy displayed on the Platform.
            </p>
            <p>
              The applicable refund/cancellation terms will be made available to users before or during the relevant purchase process. Where a refund is approved, the refund will ordinarily be processed through the original payment method or payment mechanism, subject to the payment provider's processing procedures.
            </p>
            <p>
              The Refund &amp; Cancellation Policy forms part of these Terms.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              14. User Content
            </h2>
            <p>
              Creators and other users may submit photographs, biographies, social links, descriptions, pricing information and other content to the Platform (“User Content”). You retain ownership of your User Content.
            </p>
            <p>
              By submitting User Content to Influencer Dhundo, you grant us a limited, non-exclusive, worldwide, royalty-free licence to host, store, reproduce, display and technically distribute that content as reasonably necessary to operate the Platform, display your creator profile, provide discovery functionality, maintain and improve the Platform, and promote Influencer Dhundo and its services.
            </p>
            <p>
              You represent that you have the necessary rights and permissions to submit the content and that it does not infringe intellectual property rights, violate privacy, or breach applicable law.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              15. Social Media Information
            </h2>
            <p>
              Creators may provide links, usernames and other information relating to third-party social media accounts. Influencer Dhundo does not control those third-party platforms. Creators remain responsible for the accuracy and lawful use of information they provide about their social media accounts.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              16. Prohibited Activities
            </h2>
            <p>You must not use Influencer Dhundo to:</p>
            <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
              <li>violate applicable laws or regulations;</li>
              <li>impersonate another person or organisation;</li>
              <li>provide intentionally false creator, business or follower information;</li>
              <li>engage in fraud or deceptive activity;</li>
              <li>harass, threaten or abuse another user;</li>
              <li>send spam or bulk unsolicited communications;</li>
              <li>scrape, crawl, harvest or bulk-export Platform data without written permission;</li>
              <li>attempt to access another user's account;</li>
              <li>interfere with Platform security;</li>
              <li>introduce malware, viruses or malicious code;</li>
              <li>reverse engineer or attempt to obtain unauthorised access to Platform systems;</li>
              <li>misuse creator contact information;</li>
              <li>use the Platform to facilitate illegal transactions;</li>
              <li>manipulate subscriptions or referral rewards;</li>
              <li>create artificial accounts to obtain trials or referral benefits; or</li>
              <li>use the Platform in any manner that could damage, disable, overburden or impair its operation.</li>
            </ol>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              17. Platform Availability
            </h2>
            <p>
              We will make reasonable efforts to keep Influencer Dhundo available and operational. However, we do not guarantee that the Platform will always be available, operate without interruption, be completely error-free, or be free from security vulnerabilities.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              18. Search and Discovery
            </h2>
            <p>
              Influencer Dhundo may use information supplied by users to provide search and filtering functionality. Search results are intended to help users discover creators and are not endorsements, certifications or guarantees.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              19. No Verification or Performance Guarantee
            </h2>
            <p>
              Unless expressly stated otherwise, appearance on Influencer Dhundo does not mean that a creator has been independently verified, endorsed or certified by Influencer Dhundo. Creators are responsible for the information they submit. Businesses are responsible for independently evaluating creators before entering into any commercial arrangement.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              20. Moderation and Enforcement
            </h2>
            <p>
              We may, where reasonably necessary, review profiles or content, request corrections, remove content, hide a profile, restrict Platform functionality, suspend or terminate an account, or disable referral benefits where we reasonably believe that these Terms, applicable law, Platform security or the interests of users may be affected.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              21. Intellectual Property
            </h2>
            <p>
              The Influencer Dhundo name, logo, branding, website design, software, interface, graphics, text, functionality and other Platform materials are owned by or licensed to Influencer Dhundo unless otherwise stated.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              22. Third-Party Services
            </h2>
            <p>
              Influencer Dhundo may rely on third-party services for functions such as payment processing, hosting, cloud infrastructure, email, analytics, security, and storage. We are not responsible for the independent operation, availability or policies of third-party services outside our reasonable control.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              23. Disclaimer
            </h2>
            <p>
              To the maximum extent permitted by applicable law, Influencer Dhundo is provided on an “as is” and “as available” basis without warranties of any kind. The Platform is a discovery tool and does not constitute professional marketing, legal, financial or business advice.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              24. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, Influencer Dhundo shall not be liable for indirect, incidental, special, consequential or punitive losses, loss of profits, loss of business, loss of opportunities, loss of data or other consequential damages arising from or relating to your use of the Platform.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              25. Indemnification
            </h2>
            <p>
              To the extent permitted by applicable law, you agree to indemnify and hold Influencer Dhundo and its operators, personnel and service providers harmless from claims, losses, liabilities, damages and reasonable expenses arising from your violation of these Terms, your unlawful use of the Platform, your User Content, or your commercial dealings with another Platform user.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              26. Suspension and Termination
            </h2>
            <p>
              You may stop using Influencer Dhundo at any time. We may suspend or terminate access where reasonably necessary because of violation of these Terms, fraudulent or abusive activity, security concerns, misuse of the referral programme, or unlawful activity.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              27. Effect of Termination
            </h2>
            <p>
              Upon termination or expiry, access to applicable Platform features may cease, public creator profiles may be hidden, and referral benefits may become inactive.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              28. Changes to the Platform
            </h2>
            <p>
              We may modify, add, remove or discontinue Platform features from time to time. Continued use of the Platform after changes become effective constitutes acceptance of the updated Platform.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              29. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. The latest version will be published on the Platform with the updated “Last Updated” date. Your continued use of Influencer Dhundo after the updated Terms become effective constitutes acceptance of the revised Terms.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              30. Governing Law and Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and interpreted in accordance with the laws of India. Subject to any mandatory rights or protections available to consumers under applicable law, disputes relating to these Terms or your use of Influencer Dhundo shall be subject to the jurisdiction of the courts having appropriate jurisdiction in India.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              31. Privacy
            </h2>
            <p>
              Our collection and use of personal information is governed by our Privacy Policy. By using Influencer Dhundo, you acknowledge that you have read and understood the Privacy Policy.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              32. Contact and Grievance
            </h2>
            <p>
              For questions, complaints, privacy concerns, subscription issues, refund requests or other support matters:
            </p>
            <div className="rounded-2xl bg-secondary/50 p-5 border border-border space-y-1 text-sm">
              <p className="font-semibold text-foreground">Influencer Dhundo</p>
              <p className="text-muted-foreground">
                Email:{" "}
                <a
                  href="mailto:support@influencerdhundo.com"
                  className="text-primary font-medium hover:underline"
                >
                  support@influencerdhundo.com
                </a>
              </p>
              <p className="text-muted-foreground">
                Website:{" "}
                <a
                  href="https://www.influencerdhundo.com"
                  className="text-primary font-medium hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  www.influencerdhundo.com
                </a>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              You may use this email for Terms-related questions, complaints and grievances.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              33. Acceptance
            </h2>
            <p>
              By clicking an acceptance button, creating an account, creating a creator profile, purchasing a subscription, using a referral code, or otherwise accessing or using Influencer Dhundo, you acknowledge that you have read, understood and agreed to these Terms &amp; Conditions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
